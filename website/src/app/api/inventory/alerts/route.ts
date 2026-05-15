import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyAuth } from '@/lib/auth-utils';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { productId } = body;

    console.log(`[Notify] Received request for Product: ${productId}`);

    if (!productId) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
    }

    let user;
    try {
      user = await verifyAuth(request);
      console.log(`[Notify] Linked to User: ${user.uid}`);
    } catch (e) {
      console.log(`[Notify] Anonymous request`);
    }

    const client = await clientPromise;
    const db = client.db('sahimed');

    // Record the notification request
    await db.collection('inventoryRequests').insertOne({
      productId,
      userId: user?.uid || null,
      userPhone: user?.phoneNumber || body.phone || null,
      userName: body.name || null,
      createdAt: new Date(),
      status: 'pending'
    });

    return NextResponse.json({ success: true, message: 'Notification recorded' });
  } catch (error: any) {
    console.error('[Notify API Error]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const client = await clientPromise;
    const db = client.db('sahimed');

    // Aggregate requests by productId to show in Admin Panel
    const alerts = await db.collection('inventoryRequests').aggregate([
      { $match: { status: 'pending' } },
      {
        $group: {
          _id: '$productId',
          count: { $sum: 1 },
          lastRequest: { $max: '$createdAt' }
        }
      },
      { $sort: { count: -1 } },
      {
        $lookup: {
          from: 'products',
          let: { prodId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $or: [
                    { $eq: ['$_id', '$$prodId'] },
                    { $eq: ['$_id', { $toObjectId: '$$prodId' }] },
                    { $eq: [{ $toString: '$_id' }, '$$prodId'] }
                  ]
                }
              }
            }
          ],
          as: 'product'
        }
      },
      { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } }
    ]).toArray();

    return NextResponse.json(alerts);
  } catch (error: any) {
    console.error('[Alerts API Error]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
