import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyAdmin } from '@/lib/auth-utils';

/**
 * GET: Fetch all administrative profiles from MongoDB.
 * Required: Admin verification.
 */
export async function GET(req: Request) {
  try {
    await verifyAdmin(req);
    const client = await clientPromise;
    const db = client.db('sahimed');
    
    const admins = await db.collection('adminProfiles').find({}).sort({ activatedAt: -1 }).toArray();
    return NextResponse.json(admins);
  } catch (err: any) {
    console.error("[Admin Profiles GET Error]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * POST: Create or Update an administrative profile.
 * Required: Admin verification (or initial bootstrap).
 */
export async function POST(req: Request) {
  try {
    const client = await clientPromise;
    const db = client.db('sahimed');
    
    // Bootstrap check: If no admins exist, we allow the first one to create themselves
    const adminCount = await db.collection('adminProfiles').countDocuments();
    let isBootstrap = adminCount === 0;

    if (!isBootstrap) {
      await verifyAdmin(req);
    }

    const { id, uid, permissions, ...profile } = await req.json();
    const finalId = id || uid;

    if (!finalId) throw new Error('Missing identification (UID/ID)');

    const result = await db.collection('adminProfiles').updateOne(
      { $or: [{ uid: finalId }, { id: finalId }] },
      { 
        $set: { 
          ...profile, 
          permissions: permissions || {}, // Persist granular matrix
          uid: finalId, 
          id: finalId, 
          updatedAt: new Date().toISOString() 
        },
        $setOnInsert: { activatedAt: new Date().toISOString() }
      },
      { upsert: true }
    );

    return NextResponse.json({ success: true, result });
  } catch (err: any) {
    console.error("[Admin Profiles POST Error]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * DELETE: Revoke administrative access.
 * Required: Admin verification.
 */
export async function DELETE(req: Request) {
  try {
    await verifyAdmin(req);
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) throw new Error('Missing ID');

    const client = await clientPromise;
    const db = client.db('sahimed');
    
    const result = await db.collection('adminProfiles').deleteOne({ 
      $or: [{ id: id }, { uid: id }] 
    });

    return NextResponse.json({ success: true, deletedCount: result.deletedCount });
  } catch (err: any) {
    console.error("[Admin Profiles DELETE Error]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
