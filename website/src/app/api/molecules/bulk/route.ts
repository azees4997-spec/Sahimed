import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

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
    const molecules = await request.json();
    
    if (!Array.isArray(molecules)) {
      return NextResponse.json({ error: "Invalid data format. Expected an array." }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('sahimed');
    const moleculesCol = db.collection('molecules');

    const ops = molecules.map((m: any) => {
      const { id, _id, ...rest } = m;
      // Generate a consistent slug-based ID
      const filterId = id || _id || `${m.molecule}-${m.form}`.trim().toLowerCase().replace(/\s+/g, '-');
      
      return {
        updateOne: {
          filter: { _id: filterId },
          update: { 
            $set: { 
              ...rest, 
              _id: filterId, // Explicitly set _id for upsert
              updatedAt: new Date() 
            }
          },
          upsert: true
        }
      };
    });

    if (ops.length > 0) {
      const result = await moleculesCol.bulkWrite(ops, { ordered: false });
      console.log(`[Molecule Bulk Import] Success: ${result.upsertedCount} upserted, ${result.modifiedCount} modified`);
    }

    return NextResponse.json({ 
      success: true, 
      count: molecules.length,
      message: `Processed ${molecules.length} molecules successfully.`
    });
  } catch (err: any) {
    console.error("[Molecule Bulk Import Error]", err);
    return NextResponse.json({ 
      error: "Import failed", 
      details: err.message 
    }, { status: 500 });
  }
}
