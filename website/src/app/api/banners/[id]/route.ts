
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

const getQuery = (id: string) => {
  if (/^[0-9a-fA-F]{24}$/.test(id)) {
    return { _id: new ObjectId(id) };
  }
  return { _id: id as any };
};

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const client = await clientPromise;
    const db = client.db('sahimed');
    await db.collection('banners').updateOne(getQuery(params.id), { $set: { ...body, updatedAt: new Date() } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const client = await clientPromise;
    const db = client.db('sahimed');
    await db.collection('banners').deleteOne(getQuery(params.id));
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
