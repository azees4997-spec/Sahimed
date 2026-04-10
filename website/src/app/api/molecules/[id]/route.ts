
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyAdmin } from '@/lib/auth-utils';
import { ObjectId } from 'mongodb';

const getQuery = (id: string) => {
  const query: any = {
    $or: [
      { masterId: id },
      { id: id }
    ]
  };

  try {
    if (id.length === 24) {
      query.$or.push({ _id: new ObjectId(id) });
    }
  } catch (e) {}

  // Fallback for simple string _id
  query.$or.push({ _id: id as any });

  return query;
};

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const client = await clientPromise;
    const db = client.db('sahimed');
    const molecule = await db.collection('molecules').findOne(getQuery(params.id));
    if (!molecule) return NextResponse.json({ error: 'Molecule not found' }, { status: 404 });
    return NextResponse.json({ ...molecule, id: molecule._id.toString() });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

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
