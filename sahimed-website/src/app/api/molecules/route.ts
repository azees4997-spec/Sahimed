
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

const getQuery = (id: string) => {
  try {
    if (id.length === 24) return { _id: new ObjectId(id) };
  } catch (e) {}
  return { _id: id as any };
};

export async function GET(request: Request) {
  try {
    const client = await clientPromise;
    const db = client.db('sahimed');
    const molecules = await db.collection('molecules').find({}).toArray();
    return NextResponse.json(molecules.map(m => ({ ...m, id: m._id.toString() })));
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const client = await clientPromise;
    const db = client.db('sahimed');
    const result = await db.collection('molecules').insertOne({ ...body, createdAt: new Date() });
    return NextResponse.json({ success: true, id: result.insertedId });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
