
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyAdmin } from '@/lib/auth-utils';
import { ObjectId } from 'mongodb';

export async function GET(req: Request) {
  try {
    const client = await clientPromise;
    const db = client.db('sahimed');
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const query = status ? { status: { $regex: new RegExp(status, 'i') } } : {};
    
    const orders = await db.collection('orders').find(query).sort({ orderDate: -1 }).limit(100).toArray();
    return NextResponse.json(orders);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { enquiryPath, ...body } = await req.json();
    const client = await clientPromise;
    const db = client.db('sahimed');
    
    // Add unique orderId if not present
    const lastOrder = await db.collection('orders').find().sort({ createdAt: -1 }).limit(1).toArray();
    const lastId = lastOrder[0]?.orderId || "ORD0000";
    const nextId = "ORD" + (parseInt(lastId.replace("ORD", "")) + 1).toString().padStart(4, '0');

    const orderData = {
      ...body,
      orderId: nextId,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: body.status || 'Confirmed'
    };

    const result = await db.collection('orders').insertOne(orderData);

    // Sync to Firestore if enquiryPath is provided (resolves permission issues)
    if (enquiryPath) {
      try {
        const { getDbAdmin } = await import('@/lib/firebase-admin');
        const dbAdmin = getDbAdmin();
        await dbAdmin.doc(enquiryPath).update({
          status: 'Digitized',
          orderId: nextId,
          updatedAt: new Date()
        });
      } catch (fsErr) {
        console.error('Firestore sync failed', fsErr);
        // We don't fail the whole request because the order is already in MongoDB
      }
    }

    return NextResponse.json({ success: true, id: result.insertedId, orderId: nextId });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await verifyAdmin(req);
    const body = await req.json();
    const { id, ...updates } = body;
    const client = await clientPromise;
    const db = client.db('sahimed');
    
    const result = await db.collection('orders').updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...updates, updatedAt: new Date() } }
    );
    
    return NextResponse.json({ success: true, modifiedCount: result.modifiedCount });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
