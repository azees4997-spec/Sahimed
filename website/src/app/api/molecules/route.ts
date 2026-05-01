import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyAdmin } from '@/lib/auth-utils';
import { getDbAdmin } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';
import { ObjectId } from 'mongodb';

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
    const limit = parseInt(searchParams.get('limit') || '50');

    const client = await clientPromise;
    const db = client.db('sahimed');
    
    let query = {};
    if (q) {
      query = { molecule: { $regex: q, $options: 'i' } };
    }

    const molecules = await db.collection('molecules')
      .find(query)
      .sort({ molecule: 1 })
      .limit(limit)
      .toArray();

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
    const finalId = id || _id || `${rest.molecule}-${rest.form}`.trim().toLowerCase().replace(/\s+/g, '-');
    
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
