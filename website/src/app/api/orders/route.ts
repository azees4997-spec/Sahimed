import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyAdmin, verifyAuth } from '@/lib/auth-utils';
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
    
    // 3. GENERATE RANDOM & UNIQUE ORDER ID (SHM-XXXXX)
    // We use a high-entropy random string and keep the counter as backup/audit
    const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
    const nextId = `SHM-${randomSuffix}`;

    // 3.5. DEDUPLICATION: Prevent duplicate orders within 30 seconds
    // (Check if same user has same amount recently)
    const thirtySecondsAgo = new Date(Date.now() - 30 * 1000);
    const existingOrder = await db.collection('orders').findOne({
      userId: body.userId,
      totalAmount: body.totalAmount,
      createdAt: { $gte: thirtySecondsAgo }
    });

    if (existingOrder && !isAdmin) {
      return NextResponse.json({ 
        error: "Potential duplicate detected. Please wait 30 seconds.",
        orderId: existingOrder.orderId 
      }, { status: 409 });
    }

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
      orderDate: new Date(), // ALWAYS capture real server time
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
    
    // ACTION: Cancel Shipment
    if (updates.action === 'cancel_shipment') {
      try {
        const order = await db.collection('orders').findOne({ _id: new ObjectId(id) });
        if (order && (order.shipping?.partner === 'Velocity' || order.returnShipping?.partner === 'Velocity')) {
          const { VelocityService } = await import('@/lib/logistics/velocity');
          // If it's a return, the orderId was order.orderId + '-RET'
          const targetOrderId = updates.isReturn ? `${order.orderId}-RET` : order.orderId;
          const velocityRes = await VelocityService.cancelOrder(targetOrderId);
          if (velocityRes.success) {
            const unsetObj = updates.isReturn ? { returnShipping: "" } : { shipping: "" };
            const nextStatus = updates.isReturn ? 'Delivered' : 'Packed'; // Revert status
            await db.collection('orders').updateOne(
              { _id: new ObjectId(id) },
              { $unset: unsetObj, $set: { status: nextStatus, updatedAt: new Date() } }
            );
            return NextResponse.json({ success: true, message: 'Shipment cancelled' });
          } else {
             return NextResponse.json({ error: velocityRes.error }, { status: 400 });
          }
        }
        return NextResponse.json({ error: 'Order not valid for cancellation' }, { status: 400 });
      } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
      }
    }
    
    const result = await db.collection('orders').updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...updates, updatedAt: new Date() } }
    );

    const currentOrder = await db.collection('orders').findOne({ _id: new ObjectId(id) });

    let velocityStatus = null;

    // VELOCITY AUTOMATION: Trigger when partner is Velocity
    if ((updates.status === 'Confirmed' || updates.status === 'Shipped') && (updates.shipping?.partner === 'Velocity' || currentOrder?.shipping?.partner === 'Velocity')) {
      console.log(`[Velocity Automation] Block entered for order ${id}. Status: ${updates.status}`);
      try {
        if (currentOrder && !currentOrder.shipping?.awb) { // Double check no AWB exists to prevent duplicates
          const { VelocityService } = await import('@/lib/logistics/velocity');
          const velocityRes = await VelocityService.createForwardOrder({
            orderId: currentOrder.orderId,
            billingCustomerName: currentOrder.patientName,
            orderItems: (currentOrder.items || []).map((it: any) => ({
              name: it.name,
              quantity: it.quantity,
              price: Number(it.unitPrice),
              sku: it.productId || it.name
            })),
            warehouseId: 'Primary', 
            shippingDetails: {
              address: `${currentOrder.shippingDetails?.houseNumber || ''}, ${currentOrder.shippingDetails?.street || ''}`,
              city: currentOrder.shippingDetails?.city || '',
              state: currentOrder.shippingDetails?.state || '',
              pincode: currentOrder.shippingDetails?.pincode || '',
              phone: currentOrder.phoneNumber
            },
            totalAmount: Number(currentOrder.totalAmount),
            paymentMode: 'PREPAID'
          });
          
          velocityStatus = velocityRes;

          if (velocityRes.success) {
            console.log(`[Velocity] Order creation success:`, JSON.stringify(velocityRes.data, null, 2));
            
            // Extract data from possible nested 'result' object
            const vData = velocityRes.data.result || velocityRes.data;
            const awb = vData.awb_number || vData.awb;
            const label = vData.label_url || vData.manifest_url || vData.label;
            const courier = vData.courier_name || vData.courier;

            if (awb) {
              // Update order with AWB and label
              await db.collection('orders').updateOne(
                { _id: new ObjectId(id) },
                { $set: { 
                    'shipping.awb': awb, 
                    'shipping.labelUrl': label,
                    'shipping.courier': courier
                  } 
                }
              );
              console.log(`[Velocity Automation] Order ${currentOrder.orderId} manifested successfully. AWB: ${awb}`);
            } else {
              console.warn(`[Velocity Automation] Success response but no AWB found for order ${currentOrder.orderId}`);
            }
          } else {
            console.error(`[Velocity Automation] Failed for order ${currentOrder.orderId}:`, velocityRes.error || velocityRes.data);
          }
        }
      } catch (velocityErr: any) {
        console.error(`[Velocity Automation Error] Failed to manifest order ${id}:`, velocityErr.message);
        velocityStatus = { success: false, error: velocityErr.message };
      }
    }

    // VELOCITY REVERSE AUTOMATION: Trigger when status is Returned and partner is Velocity
    if (updates.status === 'Returned' && result.modifiedCount > 0) {
      try {
        const order = await db.collection('orders').findOne({ _id: new ObjectId(id) });
        // Assuming if they want reverse orchestration, it's done via Velocity if it was shipped via Velocity or specified.
        if (order && (order.shipping?.partner === 'Velocity' || updates.shipping?.partner === 'Velocity')) {
          const { VelocityService } = await import('@/lib/logistics/velocity');
          const velocityRes = await VelocityService.createReverseOrder({
            orderId: order.orderId + '-RET', // Append -RET for reverse order distinction
            billingCustomerName: order.patientName,
            orderItems: (order.items || []).map((it: any) => ({
              name: it.name,
              quantity: it.quantity,
              price: Number(it.unitPrice),
              sku: it.productId || it.name
            })),
            warehouseId: 'default', 
            shippingDetails: {
              address: `${order.shippingDetails?.houseNumber || ''}, ${order.shippingDetails?.street || ''}`,
              city: order.shippingDetails?.city || '',
              state: order.shippingDetails?.state || '',
              pincode: order.shippingDetails?.pincode || '',
              phone: order.phoneNumber
            },
            totalAmount: Number(order.totalAmount),
            paymentMode: 'PREPAID'
          });
          
          if (velocityRes.success && velocityRes.data?.awb_number) {
            await db.collection('orders').updateOne(
              { _id: new ObjectId(id) },
              { $set: { 
                  'returnShipping.awb': velocityRes.data.awb_number, 
                  'returnShipping.labelUrl': velocityRes.data.label_url || velocityRes.data.manifest_url,
                  'returnShipping.courier': velocityRes.data.courier_name
                } 
              }
            );
            console.log(`[Velocity Reverse] Return for ${order.orderId} manifested successfully.`);
          }
        }
      } catch (velocityErr: any) {
        console.error(`[Velocity Reverse Error] Failed to manifest return ${id}:`, velocityErr.message);
      }
    }
    // Sync updates back to Firebase so customer can see live status changes
    try {
      const order = await db.collection('orders').findOne({ _id: new ObjectId(id) });
      if (order && order.userId && order.orderId) {
        const { getDbAdmin } = await import('@/lib/firebase-admin');
        const dbAdmin = getDbAdmin();
        // Construct sync object (excluding internal things that might be large or unnecessary)
        const firebaseUpdates: any = { ...updates, updatedAt: new Date() };
        // Merge shipping info if it was generated during this request
        if (order.shipping) firebaseUpdates.shipping = order.shipping;
        if (order.returnShipping) firebaseUpdates.returnShipping = order.returnShipping;
        if (order.status) firebaseUpdates.status = order.status;
        
        await dbAdmin.doc(`userProfiles/${order.userId}/orders/${order.orderId}`).set(firebaseUpdates, { merge: true });
        console.log(`[Firebase Sync] Successfully synced updates to order ${order.orderId}`);
      }
    } catch (fsErr: any) {
      console.error(`[Firebase Sync Error] Failed to sync order ${id}:`, fsErr.message);
    }
    
    return NextResponse.json({ 
      success: true, 
      modifiedCount: result.modifiedCount,
      velocity: velocityStatus 
    });
  } catch (err: any) {
    console.error("[Orders API Error]", err);
    const status = err.message?.includes('Unauthorized') || err.message?.includes('Forbidden') ? 401 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}
