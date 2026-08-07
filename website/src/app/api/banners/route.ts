
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// Cache banners for 60 seconds — rarely updated
export const revalidate = 60;

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
    const banners = await db.collection('banners').find({}).sort({ order: 1 }).toArray();
    return NextResponse.json(banners.map(b => ({ ...b, id: b._id.toString() })), {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const client = await clientPromise;
    const db = client.db('sahimed');
    const result = await db.collection('banners').insertOne({ 
      _id: body.id,
      ...body, 
      createdAt: new Date() 
    });
    return NextResponse.json({ success: true, id: result.insertedId });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
