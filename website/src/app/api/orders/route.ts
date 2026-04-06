
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyAdmin } from '@/lib/auth-utils';
import { ObjectId } from 'mongodb';

export async function GET(req: Request) {
  try {
    await verifyAdmin(req);
    const client = await clientPromise;
    const db = client.db('sahimed');
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const start = searchParams.get('start');
    const end = searchParams.get('end');
    
    const query: any = status ? { status: { $regex: new RegExp(status, 'i') } } : {};
    
    if (start || end) {
      query.orderDate = {};
      if (start) query.orderDate.$gte = new Date(start);
      if (end) {
        const endDate = new Date(end);
        endDate.setHours(23, 59, 59, 999);
        query.orderDate.$lte = endDate;
      }
    }
    
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
        
        // Critical Sync: Update status and link orderId
        await dbAdmin.doc(enquiryPath).set({
          status: 'Digitized',
          orderId: nextId,
          mongoId: result.insertedId.toString(),
          updatedAt: new Date()
        }, { merge: true });
        
        console.log(`[Order Sync] Successfully linked MongoDB Order ${nextId} to Firestore Enquiry ${enquiryPath}`);
      } catch (fsErr: any) {
        console.error(`[Order Sync Error] Failed to sync MongoDB order ${nextId} to Firestore path ${enquiryPath}:`, fsErr.message);
        // Note: MongoDB insert was successful, so the order exists, but visibility in Firestore is pending.
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
