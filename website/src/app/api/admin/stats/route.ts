
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyAdmin } from '@/lib/auth-utils';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    await verifyAdmin(req);
    const client = await clientPromise;
    const db = client.db('sahimed');
    
    const userCount = await db.collection('users').countDocuments();
    const productCount = await db.collection('products').countDocuments();
    const orderCount = await db.collection('orders').countDocuments();
    
    return NextResponse.json({
      users: userCount,
      products: productCount,
      orders: orderCount
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
