
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyAdmin } from '@/lib/auth-utils';
import { ObjectId } from 'mongodb';

const getQuery = (id: string) => {
  try {
    if (id.length === 24) return { _id: new ObjectId(id) };
  } catch (e) {}
  return { _id: id as any };
};

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    await verifyAdmin(request);
    const body = await request.json();
    const client = await clientPromise;
    const db = client.db('sahimed');
    await db.collection('molecules').updateOne(getQuery(params.id), { $set: { ...body, updatedAt: new Date() } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    await verifyAdmin(request);
    const client = await clientPromise;
    const db = client.db('sahimed');
    await db.collection('molecules').deleteOne(getQuery(params.id));
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
