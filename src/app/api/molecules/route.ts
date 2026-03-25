
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limitValue = parseInt(searchParams.get('limit') || '15');
  const q = searchParams.get('q');

  try {
    const client = await clientPromise;
    const db = client.db('sahimed');
    const collection = db.collection('molecules');

    if (!q) {
      const all = await collection.find({}).limit(limitValue).toArray();
      return NextResponse.json(all);
    }

    // Use prefix-first for speed, then substring
    const query = {
      $or: [
        { molecule: { $regex: `^${q}`, $options: 'i' } },
        { molecule: { $regex: q, $options: 'i' } }
      ]
    };

    const results = await collection
      .find(query)
      .limit(limitValue)
      .toArray();

    return NextResponse.json(results);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
