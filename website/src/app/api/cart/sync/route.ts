import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, email, phoneNumber, patientName, items, totalPrice } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('sahimed');

    const updateDoc = {
      userId,
      email: email || null,
      phoneNumber: phoneNumber || null,
      patientName: patientName || 'Anonymous Patient',
      items: items || [],
      totalPrice: Number(totalPrice) || 0,
      updatedAt: new Date(),
    };

    await db.collection('abandoned_carts').updateOne(
      { userId },
      { $set: updateDoc },
      { upsert: true }
    );

    return NextResponse.json({ success: true, message: 'Cart synced successfully' });
  } catch (err: any) {
    console.error('[Cart Sync POST Error]', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('sahimed');

    await db.collection('abandoned_carts').deleteOne({ userId });

    return NextResponse.json({ success: true, message: 'Cart cleared successfully' });
  } catch (err: any) {
    console.error('[Cart Sync DELETE Error]', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
