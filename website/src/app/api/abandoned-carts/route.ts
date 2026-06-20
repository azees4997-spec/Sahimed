import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyAdmin } from '@/lib/auth-utils';

export async function GET(req: Request) {
  try {
    // Basic Admin authorization check
    try {
      await verifyAdmin(req);
    } catch (e) {
      return NextResponse.json({ error: 'Unauthorized Access' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';

    const client = await clientPromise;
    const db = client.db('sahimed');

    let query: any = {};
    if (search) {
      const regex = new RegExp(search, 'i');
      query = {
        $or: [
          { patientName: regex },
          { email: regex },
          { phoneNumber: regex },
        ]
      };
    }

    const carts = await db
      .collection('abandoned_carts')
      .find(query)
      .sort({ updatedAt: -1 })
      .toArray();

    return NextResponse.json({ success: true, carts });
  } catch (err: any) {
    console.error('[Abandoned Carts GET Error]', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    // Verify admin authority before manual deletion of an abandoned cart
    try {
      await verifyAdmin(req);
    } catch (e) {
      return NextResponse.json({ error: 'Unauthorized Access' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required for manual dismissal' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('sahimed');

    await db.collection('abandoned_carts').deleteOne({ userId });

    return NextResponse.json({ success: true, message: 'Abandoned cart manually dismissed' });
  } catch (err: any) {
    console.error('[Abandoned Cart Manual DELETE Error]', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
