import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyAdmin, verifyAuth } from '@/lib/auth-utils';
import { ObjectId } from 'mongodb';

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function GET(req: Request) {
  try {
    let user;
    let isAdmin = false;
    try {
      user = await verifyAdmin(req);
      isAdmin = true;
    } catch (err) {
      user = await verifyAuth(req);
    }

    const client = await clientPromise;
    const db = client.db('sahimed');
    const { searchParams } = new URL(req.url);
    const statusRaw = searchParams.get('status');
    const status = statusRaw ? escapeRegExp(statusRaw) : null;
    const start = searchParams.get('start');
    const end = searchParams.get('end');
    const query: any = {};
    
    // Security check: Non-admins MUST be restricted to their own data
    if (!isAdmin) {
      const tokenPhone = (user as any).phoneNumber;
      const last10 = tokenPhone ? tokenPhone.replace(/\D/g, '').slice(-10) : null;
      
      const identityConditions: any[] = [
        { userId: user.uid },
        { customer_id: user.uid }
      ];

      if (tokenPhone) {
        identityConditions.push({ phoneNumber: tokenPhone });
        identityConditions.push({ phone: tokenPhone });
        identityConditions.push({ customer_phone: tokenPhone });
      }
      if (last10) {
        // Variants for both 'phoneNumber', 'phone', and 'customer_phone' keys
        const variants = [last10, `+91${last10}`, `91${last10}`];
        variants.forEach(v => {
          identityConditions.push({ phoneNumber: v });
          identityConditions.push({ phone: v });
          identityConditions.push({ customer_phone: v });
        });
      }

      query.$or = identityConditions;
    } else {
      // Admin Search Logic
      const requestedUserId = searchParams.get('userId');
      const phone = searchParams.get('phone');

      if (requestedUserId && phone) {
        const last10 = phone.replace(/\D/g, '').slice(-10);
        // BUG-08 FIX: Include all phone field variants (phoneNumber, phone, customer_phone)
        const phoneVariants = [phone, last10, `+91${last10}`, `91${last10}`];
        query.$or = [
          { userId: requestedUserId },
          { customer_id: requestedUserId },
          ...phoneVariants.flatMap(v => [
            { phoneNumber: v },
            { phone: v },
            { customer_phone: v },
          ])
        ];
      } else if (requestedUserId) {
        query.$or = [{ userId: requestedUserId }, { customer_id: requestedUserId }];
      } else if (phone) {
        const last10 = phone.replace(/\D/g, '').slice(-10);
        const phoneVariants = [phone, last10, `+91${last10}`, `91${last10}`];
        query.$or = phoneVariants.flatMap(v => [
          { phoneNumber: v },
          { phone: v },
          { customer_phone: v },
        ]);
      }
    }

    if (status) query.status = { $regex: new RegExp(status, 'i') };
    
    // Date filter
    if (start || end) {
      const dateQuery: any = {};
      if (start) {
        const startDate = new Date(start);
        if (!isNaN(startDate.getTime())) dateQuery.$gte = startDate;
      }
      if (end) {
        const endDate = new Date(end);
        endDate.setHours(23, 59, 59, 999);
        if (!isNaN(endDate.getTime())) dateQuery.$lte = endDate;
      }
      
      // Use $or for date field fallback (orderDate or createdAt)
      const dateCondition = {
        $or: [
          { orderDate: dateQuery },
          { createdAt: dateQuery }
        ]
      };

      // Merge with identity filter using $and if $or already exists
      if (query.$or) {
        const identityOr = query.$or;
        delete query.$or;
        query.$and = [
          { $or: identityOr },
          dateCondition
        ];
      } else {
        // If no identity $or, we can just use $and to wrap the date $or and other conditions
        const existingConditions = { ...query };
        Object.keys(query).forEach(key => delete query[key]);
        query.$and = [
          existingConditions,
          dateCondition
        ];
      }
    }

    const orders = await db.collection('orders')
      .find(query)
      .sort({ orderDate: -1, createdAt: -1 })
      .toArray();
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

    // 4. Clinical Status Logic: Check if any items require a prescription
    const hasRxItems = (body.items || []).some((it: any) => it.prescriptionRequired === true);
    const isConsultation = body.clinicalPath === 'consult' || body.isConsultationRequired === true;
    
    let initialStatus = 'Confirmed';
    if (hasRxItems) {
      initialStatus = 'Pending Pharmacist';
    } else if (isConsultation) {
      initialStatus = 'Pending Consult';
    } else if (body.status) {
      initialStatus = body.status;
    }

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
      status: initialStatus,
      shipping: body.shipping || { partner: 'Shipway' }
    };

    const result = await db.collection('orders').insertOne(orderData);

    // SHIPWAY AUTOMATION: Trigger immediately if order is Confirmed
    if (initialStatus === 'Confirmed') {
      try {
        const { ShipwayService } = await import('@/lib/logistics/shipway');
        const shipwayRes = await ShipwayService.createForwardOrder({
          orderId: nextId,
          billingCustomerName: orderData.patientName,
          orderItems: (orderData.items || []).map((it: any) => ({
            name: it.name,
            quantity: it.quantity,
            price: Number(it.unitPrice || it.price),
            sku: it.productId || it.name
          })),
          warehouseId: '93743', 
          shippingDetails: {
            address: `${orderData.shippingDetails?.houseNumber || ''}, ${orderData.shippingDetails?.street || ''}`,
            city: orderData.shippingDetails?.city || '',
            state: orderData.shippingDetails?.state || '',
            pincode: orderData.shippingDetails?.pincode || '',
            phone: orderData.phoneNumber
          },
          totalAmount: Number(orderData.totalAmount),
          paymentMode: 'PREPAID' // Defaulting to Prepaid for website orders for now, can be adjusted
        });

        if (shipwayRes.success && shipwayRes.data) {
          const vData = shipwayRes.data.result || shipwayRes.data;
          const awb = vData?.awb_number || vData?.awb;
          const label = vData?.label_url || vData?.manifest_url || vData?.label;
          const courier = vData?.courier_name || vData?.courier;

          if (awb) {
            await db.collection('orders').updateOne(
              { _id: result.insertedId },
              { $set: { 
                "shipping.awb": awb,
                "shipping.labelUrl": label || "",
                "shipping.courier": courier || "Shipway",
                "shipping.partner": "Shipway",
                status: 'Shipped', // Automatically move to Shipped once AWB is generated
                updatedAt: new Date()
              }}
            );
          }
        }
      } catch (err: any) {
        console.error("[Shipway Auto-Push Error]", err.message);
      }
    }

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
    const currentOrder = await db.collection('orders').findOne({ _id: new ObjectId(id) });
    
    // ACTION: Cancel Shipment
    if (updates.action === 'cancel_shipment') {
      try {
        const order = await db.collection('orders').findOne({ _id: new ObjectId(id) });
        if (order && (order.shipping?.partner === 'Shipway' || order.returnShipping?.partner === 'Shipway')) {
          const { ShipwayService } = await import('@/lib/logistics/shipway');
          // If it's a return, the orderId was order.orderId + '-RET'
          const targetOrderId = updates.isReturn ? `${order.orderId}-RET` : order.orderId;
          const shipwayRes = await ShipwayService.cancelOrder(targetOrderId);
          if (shipwayRes.success) {
            const unsetObj = updates.isReturn ? { returnShipping: "" } : { shipping: "" };
            const nextStatus = updates.isReturn ? 'Delivered' : 'Packed'; // Revert status
            await db.collection('orders').updateOne(
              { _id: new ObjectId(id) },
              { $unset: unsetObj, $set: { status: nextStatus, updatedAt: new Date() } }
            );
            return NextResponse.json({ success: true, message: 'Shipment cancelled' });
          } else {
             return NextResponse.json({ error: shipwayRes.error }, { status: 400 });
          }
        }
        return NextResponse.json({ error: 'Order not valid for cancellation' }, { status: 400 });
      } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
      }
    }
    
    // HANDLE CUSTOM WORKFLOW ACTIONS
    if (updates.action === 'pharmacist_accept') {
      updates.status = 'Confirmed';
      updates.pharmacistApproval = { approvedAt: new Date(), approvedBy: 'Pharmacist' };
      delete updates.action;
    } else if (updates.action === 'pharmacist_reject') {
      updates.status = 'Cancelled';
      updates.pharmacistApproval = { rejectedAt: new Date(), reason: updates.reason || 'Rejected by Pharmacist' };
      delete updates.action;
    } else if (updates.action === 'pharmacist_consult_req') {
      updates.status = 'Pending Consult';
      updates.pharmacistApproval = { consultRequired: true, requestedAt: new Date() };
      delete updates.action;
    } else if (updates.action === 'doctor_submit_rx') {
      updates.status = 'Confirmed';
      updates.doctorConsultation = { 
        consultedAt: new Date(), 
        prescriptionUrl: updates.prescriptionUrl,
        prescriptionLink: updates.prescriptionLink 
      };
      // Also append to global prescriptionUrls for visibility
      updates.prescriptionUrls = [...(currentOrder?.prescriptionUrls || []), updates.prescriptionUrl, updates.prescriptionLink].filter(Boolean);
      delete updates.action;
    } else if (updates.action === 'manifest_order') {
      try {
        const { ShipwayService } = await import('@/lib/logistics/shipway');
        const manifestRes = await ShipwayService.createManifest([currentOrder.orderId]);
        if (manifestRes.success) {
          const mData = manifestRes.data.result || manifestRes.data;
          const labelUrl = mData.manifest_url || mData.label_url || mData.url;
          
          if (labelUrl) {
            await db.collection('orders').updateOne(
              { _id: new ObjectId(id) },
              { $set: { 'shipping.labelUrl': labelUrl, updatedAt: new Date() } }
            );
            return NextResponse.json({ success: true, labelUrl });
          }
          return NextResponse.json({ error: 'Manifest created but no URL returned' }, { status: 400 });
        }
        return NextResponse.json({ error: manifestRes.error || 'Manifest failed' }, { status: 400 });
      } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
      }
    }

    const result = await db.collection('orders').updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...updates, updatedAt: new Date() } }
    );

    // Refresh currentOrder after update for automation logic
    const refreshedOrder = await db.collection('orders').findOne({ _id: new ObjectId(id) });
    let shipwayStatus = null;

    // SHIPWAY AUTOMATION: Trigger when status is Confirmed or Shipped
    if ((updates.status === 'Confirmed' || updates.status === 'Shipped')) {
      console.log(`[Shipway Automation] Attempting push for order ${id}. Status: ${updates.status}`);
      try {
        if (refreshedOrder) {
          if (refreshedOrder.shipping?.awb) {
            console.log(`[Shipway Automation] Skipping: Order ${id} already has AWB: ${refreshedOrder.shipping.awb}`);
          } else {
            console.log(`[Shipway Automation] Calling ShipwayService for order ${refreshedOrder.orderId}`);
            const { ShipwayService } = await import('@/lib/logistics/shipway');
            const shipwayRes = await ShipwayService.createForwardOrder({
              orderId: refreshedOrder.orderId,
            billingCustomerName: refreshedOrder.patientName,
            orderItems: (refreshedOrder.items || []).map((it: any) => ({
              name: it.name,
              quantity: it.quantity,
              price: Number(it.unitPrice),
              sku: it.productId || it.name
            })),
            warehouseId: '93743', 
            shippingDetails: {
              address: `${refreshedOrder.shippingDetails?.houseNumber || ''}, ${refreshedOrder.shippingDetails?.street || ''}`,
              city: refreshedOrder.shippingDetails?.city || '',
              state: refreshedOrder.shippingDetails?.state || '',
              pincode: refreshedOrder.shippingDetails?.pincode || '',
              phone: refreshedOrder.phoneNumber
            },
            totalAmount: Number(refreshedOrder.totalAmount),
            paymentMode: 'PREPAID'
          });
          
          shipwayStatus = shipwayRes;

          if (shipwayRes.success && shipwayRes.data) {
            console.log(`[Shipway] Order creation success:`, JSON.stringify(shipwayRes.data, null, 2));
            
            // Extract data from possible nested 'result' object
            const vData = shipwayRes.data.result || shipwayRes.data;
            const awb = vData?.awb_number || vData?.awb;
            const label = vData?.label_url || vData?.manifest_url || vData?.label;
            const courier = vData?.courier_name || vData?.courier;

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
              console.log(`[Shipway Automation] Order ${refreshedOrder.orderId} manifested successfully. AWB: ${awb}`);
            } else {
              console.warn(`[Shipway Automation] Success response but no AWB found for order ${refreshedOrder.orderId}`);
            }
          } else {
            console.error(`[Shipway Automation] Failed for order ${refreshedOrder.orderId}:`, shipwayRes.error || shipwayRes.data);
          }
        }
      }
    } catch (shipwayErr: any) {
      console.error(`[Shipway Automation Error] Failed to manifest order ${id}:`, shipwayErr.message);
      shipwayStatus = { success: false, error: shipwayErr.message };
    }
  }

    // SHIPWAY REVERSE AUTOMATION: Trigger when status is Returned and partner is Shipway
    if (updates.status === 'Returned' && result.modifiedCount > 0) {
      try {
        const order = await db.collection('orders').findOne({ _id: new ObjectId(id) });
        // Assuming if they want reverse orchestration, it's done via Shipway if it was shipped via Shipway or specified.
        if (order && (order.shipping?.partner === 'Shipway' || updates.shipping?.partner === 'Shipway')) {
          const { ShipwayService } = await import('@/lib/logistics/shipway');
          const shipwayRes = await ShipwayService.createReverseOrder({
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
          
          if (shipwayRes.success && shipwayRes.data?.awb_number) {
            await db.collection('orders').updateOne(
              { _id: new ObjectId(id) },
              { $set: { 
                  'returnShipping.awb': shipwayRes.data.awb_number, 
                  'returnShipping.labelUrl': shipwayRes.data.label_url || shipwayRes.data.manifest_url,
                  'returnShipping.courier': shipwayRes.data.courier_name
                } 
              }
            );
            console.log(`[Shipway Reverse] Return for ${order.orderId} manifested successfully.`);
          }
        }
      } catch (shipwayErr: any) {
        console.error(`[Shipway Reverse Error] Failed to manifest return ${id}:`, shipwayErr.message);
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
      shipway: shipwayStatus 
    });
  } catch (err: any) {
    console.error("[Orders API Error]", err);
    const status = err.message?.includes('Unauthorized') || err.message?.includes('Forbidden') ? 401 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}
