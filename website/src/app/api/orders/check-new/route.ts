import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const lastTime = searchParams.get('since') || new Date().toISOString();

  try {
    const client = await clientPromise;
    const db = client.db('sahimed');
    
    // Find orders created after 'lastTime'
    const newOrders = await db.collection('orders')
      .find({
        $or: [
          { orderDate: { $gt: new Date(lastTime) } },
          { createdAt: { $gt: new Date(lastTime) } }
        ]
      })
      .sort({ orderDate: -1 })
      .limit(5)
      .toArray();

    return NextResponse.json({ 
      orders: newOrders,
      serverTime: new Date().toISOString()
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
