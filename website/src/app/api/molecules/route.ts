import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyAdmin } from '@/lib/auth-utils';
import { getDbAdmin } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';
import { ObjectId } from 'mongodb';
import { generateSlug } from '@/lib/slug';

const getQuery = (id: string) => {
  try {
    if (id.length === 24) return { _id: new ObjectId(id) };
  } catch (e) {}
  return { _id: id as any };
};

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const qRaw = searchParams.get('q');
    const q = qRaw ? escapeRegExp(qRaw) : null;
    let limitValue = parseInt(searchParams.get('limit') || '50');
    if (isNaN(limitValue) || limitValue < 1) limitValue = 50;
    if (limitValue > 500) limitValue = 500;

    const client = await clientPromise;
    const db = client.db('sahimed');
    
    let query = {};
    if (qRaw) {
      const terms = qRaw.split(/\s+/).filter(t => t.length > 0);
      if (terms.length > 0) {
        // Strict match: ALL terms in the query must be present in the molecule name
        query = { 
          $or: [
            { 
              $and: terms.map(t => ({ molecule: { $regex: escapeRegExp(t), $options: 'i' } })) 
            },
            { masterId: { $regex: qRaw, $options: 'i' } }
          ]
        };
      }
    }

    const molecules = await db.collection('molecules')
      .find(query)
      .sort({ molecule: 1 })
      .limit(limitValue)
      .toArray();

    // --- AUTOMATIC SEARCH ANALYTICS LOGGING ---
    if (qRaw && qRaw.length >= 2) {
      try {
        const analyticsCol = db.collection('searchAnalytics');
        analyticsCol.insertOne({
          keyword: qRaw,
          userId: searchParams.get('userId') || null,
          mobile: searchParams.get('mobile') || 'Anonymous',
          platform: searchParams.get('platform') || (request.headers.get('user-agent')?.includes('Dart') ? 'mobile' : 'web'),
          resultsCount: molecules.length,
          timestamp: new Date(),
          autoCaptured: true,
          type: 'molecule'
        }).catch(err => console.error("[Analytics Molecule Background Error]", err));
      } catch (e) {
        console.error("[Molecule Search Analytics Auto-Log Failed]", e);
      }
    }

    return NextResponse.json(molecules.map(m => ({ ...m, id: m._id.toString() })), {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await verifyAdmin(request);
    const body = await request.json();
    const { id, _id, ...rest } = body;
    const client = await clientPromise;
    const db = client.db('sahimed');
    
    // Use consistent ID generation
    const finalId = id || _id || generateSlug(`${rest.molecule}-${rest.form}`);
    
    const result = await db.collection('molecules').updateOne(
      { _id: finalId },
      { $set: { ...rest, _id: finalId, createdAt: new Date(), updatedAt: new Date() } },
      { upsert: true }
    );

    // Sync to Firestore
    try {
      const firestore = getDbAdmin();
      await firestore.collection('moleculeMaster').doc(finalId).set({
        ...rest,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    } catch (fsErr) {
      console.error("[Firestore Sync Error]", fsErr);
    }

    return NextResponse.json({ success: true, id: finalId });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
