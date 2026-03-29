import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyAdmin } from '@/lib/auth-utils';

export async function POST(request: Request) {
  try {
    const { keyword, mobile, userId } = await request.json();
    if (!keyword) return NextResponse.json({ error: 'Keyword required' }, { status: 400 });

    const client = await clientPromise;
    const db = client.db('sahimed');
    const collection = db.collection('searchAnalytics');

    await collection.insertOne({
      keyword,
      mobile: mobile || 'Anonymous',
      userId: userId || null,
      timestamp: new Date()
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    // 1. Verify Administrative Clearance
    await verifyAdmin(request);

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const client = await clientPromise;
    const db = client.db('sahimed');
    const collection = db.collection('searchAnalytics');

    const query: any = {};
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const logs = await collection
      .find(query)
      .sort({ timestamp: -1 })
      .limit(1000)
      .toArray();

    return NextResponse.json(logs);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: err.message.includes('Unauthorized') ? 401 : 500 });
  }
}
