
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limitValue = parseInt(searchParams.get('limit') || '20');

  try {
    const client = await clientPromise;
    const db = client.db('sahimed');
    const collection = db.collection('categories');

    const categories = await collection
      .find({})
      .sort({ name: 1 })
      .limit(limitValue)
      .toArray();

    // Map _id to id for frontend compatibility
    const normalized = categories.map(cat => ({
      ...cat,
      id: cat._id.toString()
    }));

    return NextResponse.json(normalized);
  } catch (err: any) {
    console.error("[Categories API Error]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
