import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyAdmin, verifyAuth } from '@/lib/auth-utils';
import { ObjectId } from 'mongodb';
import { ShipwayService } from '@/lib/logistics/shipway';

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
      query.$or = [{ orderDate: { $exists: true } }, { createdAt: { $exists: true } }];
      const dateField = query.orderDate ? 'orderDate' : 'createdAt'; // Fallback logic
      
      const dateQuery: any = {};
      if (start) dateQuery.$gte = new Date(start);
      if (end) {
        const endDate = new Date(end);
        endDate.setHours(23, 59, 59, 999);
        dateQuery.$lte = endDate;
      }
      
      // We'll apply it to both for safety if they exist
      query.$and = [
        { $or: [
          { orderDate: dateQuery },
          { createdAt: dateQuery }
        ]}
      ];
    }
    
    const orders = await db.collection('orders').find(query).sort({ orderDate: -1 }).limit(100).toArray();
    return NextResponse.json(orders);
  } catch (err: any) {
    console.error("[Orders API Error]", err);
    const status = err.message?.includes('Unauthorized') || err.message?.includes('Forbidden') ? 401 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}

export async function POST(req: Request) {
  try {
    // 1. Try Admin Verification first, fallback to standard Auth
    let user;
    let isAdmin = false;
    try {
      user = await verifyAdmin(req);
      isAdmin = true;
    } catch (err) {
      user = await verifyAuth(req);
    }

    const { enquiryPath, ...body } = await req.json();
    
    // 2. Security Check: Non-admins can only create orders for themselves
    if (!isAdmin && body.userId !== user.uid) {
      return NextResponse.json({ error: "Forbidden: You can only create orders for your own account." }, { status: 403 });
    }

    const client = await clientPromise;
    const db = client.db('sahimed');
    
    // 3. Generate Atomic Unique Order ID (ORDxxxx)
    const counterResult = await db.collection('counters').findOneAndUpdate(
      { _id: 'orderId' },
      { $inc: { seq: 1 } },
      { upsert: true, returnDocument: 'after' }
    );
    
    // Ensure the sequence starts from a reasonable number if it was just created
    let seq = counterResult?.seq;
    if (!seq) {
      // Fallback/Init logic if sequence was somehow missing
      const count = await db.collection('orders').countDocuments();
      seq = count + 1;
      await db.collection('counters').updateOne({ _id: 'orderId' }, { $set: { seq: seq } }, { upsert: true });
    }
    
    const nextId = "ORD" + seq.toString().padStart(4, '0');

    // 4. Clinical Status Logic
    const isConsultation = body.clinicalPath === 'consult' || body.isConsultationRequired === true;
    const initialStatus = isConsultation ? 'Pending Consult' : (body.status || 'Confirmed');

    // 5. White-list Fields (Security Hardening)
    const allowedFields = [
      'userId', 'patientName', 'phoneNumber', 'shippingDetails', 'billingBreakdown', 
      'items', 'totalAmount', 'prescriptionUrls', 'isConsultationRequired', 
      'clinicalPath', 'couponCode', 'discountAmount'
    ];
    
    const sanitizedBody: any = {};
    allowedFields.forEach(field => {
      if (body[field] !== undefined) sanitizedBody[field] = body[field];
    });

    const orderData = {
      ...sanitizedBody,
      orderId: nextId,
      orderDate: body.orderDate || new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      status: initialStatus
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
    console.error("[Orders API Error]", err);
    const status = err.message?.includes('Unauthorized') || err.message?.includes('Forbidden') ? 401 : 500;
    return NextResponse.json({ error: err.message }, { status });
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

    // SHIPWAY AUTOMATION: Trigger when status is Shipped and partner is Shipway
    if (updates.status === 'Shipped' && updates.shipping?.partner === 'Shipway' && result.modifiedCount > 0) {
      try {
        const order = await db.collection('orders').findOne({ _id: new ObjectId(id) });
        if (order) {
          await ShipwayService.createShipment({
            orderId: order.orderId,
            name: order.patientName,
            phone: order.phoneNumber,
            address: `${order.shippingDetails?.houseNumber || ''}, ${order.shippingDetails?.street || ''}`,
            city: order.shippingDetails?.city || '',
            state: order.shippingDetails?.state || '',
            pincode: order.shippingDetails?.pincode || '',
            items: (order.items || []).map((it: any) => ({
              name: it.name,
              qty: it.quantity,
              price: it.unitPrice
            }))
          });
          console.log(`[Shipway Automation] Order ${order.orderId} pushed successfully.`);
        }
      } catch (shipwayErr: any) {
        console.error(`[Shipway Automation Error] Failed to sync order ${id}:`, shipwayErr.message);
        // Note: We don't fail the whole API call if Shipway fails, as the internal status is updated.
      }
    }
    
    return NextResponse.json({ success: true, modifiedCount: result.modifiedCount });
  } catch (err: any) {
    console.error("[Orders API Error]", err);
    const status = err.message?.includes('Unauthorized') || err.message?.includes('Forbidden') ? 401 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}
