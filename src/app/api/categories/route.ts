
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

// GET all categories
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limitValue = parseInt(searchParams.get('limit') || '50');

  try {
    const client = await clientPromise;
    const db = client.db('sahimed');
    const categories = await db.collection('categories')
      .find({})
      .sort({ name: 1 })
      .limit(limitValue)
      .toArray();

    return NextResponse.json(categories.map(c => ({ ...c, id: c._id.toString() })));
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST new category
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const client = await clientPromise;
    const db = client.db('sahimed');
    const result = await db.collection('categories').insertOne({
      ...body,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return NextResponse.json({ success: true, id: result.insertedId });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
