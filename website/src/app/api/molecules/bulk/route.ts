import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyAdmin } from '@/lib/auth-utils';
import { getDbAdmin } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db('sahimed');
    const molecules = await db.collection('molecules').find({}).toArray();

    const headers = ['molecule', 'masterId', 'form'];

    const csvContent = [
      headers.join(','),
      ...molecules.map(m => {
        return headers.map(h => {
          let val = m[h] ?? '';
          if (typeof val === 'string') {
            val = val.replace(/"/g, '""');
            if (val.includes(',') || val.includes('\n')) val = `"${val}"`;
          }
          return val;
        }).join(',');
      })
    ].join('\n');

    return new Response(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename=sahimed_molecules_export.csv'
      }
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    // 1. Authorize the user
    await verifyAdmin(request);

    const molecules = await request.json();
    
    if (!Array.isArray(molecules)) {
      return NextResponse.json({ error: "Invalid data format. Expected an array." }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('sahimed');
    const moleculesCol = db.collection('molecules');

    // 2. Prepare MongoDB Bulk Ops
    const ops = molecules.map((m: any) => {
      const { id, _id, ...rest } = m;
      const filterId = id || _id || `${m.molecule}-${m.form}`.trim().toLowerCase().replace(/\s+/g, '-');
      
      return {
        updateOne: {
          filter: { _id: filterId },
          update: { 
            $set: { 
              ...rest, 
              _id: filterId,
              updatedAt: new Date() 
            }
          },
          upsert: true
        }
      };
    });

    // 3. Execute MongoDB Bulk
    if (ops.length > 0) {
      await moleculesCol.bulkWrite(ops, { ordered: false });
    }

    // 4. Sync to Firestore using Admin SDK (Batching)
    try {
      const firestore = getDbAdmin();
      const BATCH_SIZE = 400;
      
      for (let i = 0; i < molecules.length; i += BATCH_SIZE) {
        const batch = firestore.batch();
        const chunk = molecules.slice(i, i + BATCH_SIZE);
        
        chunk.forEach((m: any) => {
          const docId = m.id || m._id || `${m.molecule}-${m.form}`.trim().toLowerCase().replace(/\s+/g, '-');
          const docRef = firestore.collection('moleculeMaster').doc(docId);
          batch.set(docRef, {
            ...m,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          }, { merge: true });
        });
        
        await batch.commit();
      }
    } catch (fsErr: any) {
      console.error("[Firestore Sync Error]", fsErr);
      // We don't fail the whole request if Firestore sync fails, but we log it
    }

    return NextResponse.json({ 
      success: true, 
      count: molecules.length,
      message: `Processed ${molecules.length} molecules and synced to cloud registry.`
    });
  } catch (err: any) {
    console.error("[Molecule Bulk Import Error]", err);
    return NextResponse.json({ 
      error: "Import failed", 
      details: err.message 
    }, { status: 500 });
  }
}
