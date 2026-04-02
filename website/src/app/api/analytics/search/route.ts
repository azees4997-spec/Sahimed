import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyAdmin } from '@/lib/auth-utils';

export const dynamic = 'force-dynamic';

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
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        query.timestamp.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.timestamp.$lte = end;
      }
    }

    console.log(`[Search Analytics GET] Parameters: ${startDate} to ${endDate}`);
    const logs = await collection
      .find(query)
      .sort({ timestamp: -1 })
      .limit(1000)
      .toArray();

    return NextResponse.json(logs);
  } catch (err: any) {
    console.error("[Search Analytics GET Critical Error]", {
      message: err.message,
      stack: err.stack,
      url: request.url
    });
    
    let status = 500;
    if (err.message?.includes('Unauthorized')) status = 401;
    if (err.message?.includes('Forbidden')) status = 403;
    
    return NextResponse.json({ 
      error: err.message || "Unknown analytics error",
      details: process.env.NODE_ENV === 'development' ? err.stack : "Check server logs for details"
    }, { status });
  }
}
