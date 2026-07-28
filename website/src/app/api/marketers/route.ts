import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyAdmin } from '@/lib/auth-utils';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const qRaw = searchParams.get('q');
    let limitValue = parseInt(searchParams.get('limit') || '50');
    if (isNaN(limitValue) || limitValue < 1) limitValue = 50;

    const client = await clientPromise;
    const db = client.db('sahimed');

    const query: any = {};
    if (qRaw) {
      query.name = { $regex: escapeRegExp(qRaw), $options: 'i' };
    }

    const marketers = await db.collection('marketers')
      .find(query)
      .sort({ name: 1 })
      .limit(limitValue)
      .toArray();

    return NextResponse.json(marketers);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await verifyAdmin(request);
    const body = await request.json();
    const client = await clientPromise;
    const db = client.db('sahimed');

    const result = await db.collection('marketers').insertOne({
      name: body.name,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return NextResponse.json({ success: true, id: result.insertedId });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
