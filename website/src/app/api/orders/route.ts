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
    // ADMINS: If no search params are provided, default to their own orders for the app profile screen
    const requestedUserId = searchParams.get('userId');
    const phone = searchParams.get('phone');

    if (!isAdmin || (!requestedUserId && !phone)) {
      const identityConditions: any[] = [
        { userId: user.uid },
        { customer_id: user.uid }
      ];

      // FALLBACK: If phoneNumber is not in the token, check the MongoDB user profile
      let activePhone = user.phoneNumber;
      if (!activePhone) {
        const userProfile = await db.collection('users').findOne({ uid: user.uid });
        activePhone = userProfile?.phoneNumber || userProfile?.phone || userProfile?.phone_number;
      }

      if (activePhone) {
        // ULTRA-AGGRESSIVE MATCHING: Catch every possible format
        const stripped = activePhone.replace(/\D/g, '');
        const last10 = stripped.slice(-10);
        
        const phoneVariants = Array.from(new Set([
          activePhone, 
          stripped, 
          last10, 
          `+91${last10}`, 
          `91${last10}`, 
          `0${last10}`
        ]));
        
        phoneVariants.forEach(v => {
          identityConditions.push({ phoneNumber: v });
          identityConditions.push({ phone: v });
          identityConditions.push({ phone_number: v });
          identityConditions.push({ customer_phone: v });
          identityConditions.push({ customerPhone: v });
          
          // Case-insensitive check for string, and exact check for numeric fields
          const numValue = parseInt(v.replace(/\D/g, ''));
          if (!isNaN(numValue)) {
            identityConditions.push({ phoneNumber: numValue });
            identityConditions.push({ phone: numValue });
            identityConditions.push({ phone_number: numValue });
            identityConditions.push({ customerPhone: numValue });
            identityConditions.push({ customer_phone: numValue });
          }
        });

        // Find all other UIDs associated with any variant of this phone number
        const linkedUsers = await db.collection('users').find({
          $or: [
            { phoneNumber: { $in: phoneVariants } },
            { phone: { $in: phoneVariants } },
            { phone_number: { $in: phoneVariants } }
          ]
        }).toArray();
        
        linkedUsers.forEach(u => {
          if (u.uid) {
            identityConditions.push({ userId: u.uid });
            identityConditions.push({ user_id: u.uid }); // Added underscore variant
            identityConditions.push({ customer_id: u.uid });
          }
        });
      }

      // Final unique conditions to keep query efficient
      query.$or = Array.from(new Set(identityConditions.map(c => JSON.stringify(c)))).map(s => JSON.parse(s));
    } else {
      // Admin Search Logic (When params ARE provided)

      if (requestedUserId && phone) {
        const last10 = phone.replace(/\D/g, '').slice(-10);
        // BUG-08 FIX: Include all phone field variants (phoneNumber, phone, customer_phone)
        const phoneVariants = [phone, last10, `+91${last10}`, `91${last10}`, `0${last10}`];
        query.$or = [
          { userId: requestedUserId },
          { customer_id: requestedUserId },
          ...phoneVariants.flatMap(v => [
            { phoneNumber: v },
            { phone: v },
            { customer_phone: v },
            { customerPhone: v },
          ])
        ];
      } else if (requestedUserId) {
        query.$or = [{ userId: requestedUserId }, { customer_id: requestedUserId }];
      } else if (phone) {
        const last10 = phone.replace(/\D/g, '').slice(-10);
        const phoneVariants = [phone, last10, `+91${last10}`, `91${last10}`, `0${last10}`];
        query.$or = phoneVariants.flatMap(v => [
          { phoneNumber: v },
          { phone: v },
          { customer_phone: v },
          { customerPhone: v },
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
    
    // 3. GENERATE RANDOM & UNIQUE ORDER ID (SHM-XXXXX) with collision guard
    let nextId: string;
    let idAttempts = 0;
    do {
      const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
      nextId = `SHM-${randomSuffix}`;
      const idCollision = await db.collection('orders').findOne({ orderId: nextId });
      if (!idCollision) break;
      idAttempts++;
    } while (idAttempts < 5);

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

    // 3.7. PRICE INTEGRITY CHECK: Recalculate total from DB prices
    const itemIds = (body.items || []).map((it: any) => it.medicineId || it.id).filter(Boolean);
    const dbProducts = await db.collection('products').find({ _id: { $in: itemIds } }).toArray();
    
    let calculatedSubtotal = 0;
    (body.items || []).forEach((item: any) => {
      const dbProduct = dbProducts.find(p => p._id.toString() === (item.medicineId || item.id));
      const price = dbProduct?.price || Number(item.unitPrice || item.price || 0);
      calculatedSubtotal += price * Number(item.quantity || 1);
    });

    const expectedTotal = calculatedSubtotal - Number(body.walletUsed || 0) - Number(body.discountAmount || 0);
    // Allow for a 1 rupee rounding tolerance
    if (Math.abs(expectedTotal - Number(body.totalAmount)) > 1 && !isAdmin) {
      return NextResponse.json({ 
        error: "Price discrepancy detected. Your cart has been updated.",
        expected: expectedTotal,
        received: body.totalAmount
      }, { status: 400 });
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
      'clinicalPath', 'couponCode', 'discountAmount', 'paymentType', 
      'paymentId', 'razorpayOrderId', 'signature', 'walletUsed'
    ];
    
    const sanitizedBody: any = {};
    allowedFields.forEach(field => {
      if (body[field] !== undefined) sanitizedBody[field] = body[field];
    });

    // 2.5. Handle Wallet Usage with strict server-side validation
    const walletUsed = Number(body.walletUsed || body.billingBreakdown?.walletUsed || 0);
    if (walletUsed > 0) {
      const mongoUser = await db.collection('users').findOne({ uid: user.uid });
      const currentBalance = mongoUser?.walletBalance || 0;
      
      if (currentBalance < walletUsed) {
        return NextResponse.json({ error: "Insufficient wallet balance" }, { status: 400 });
      }

      // Deduct immediately in MongoDB
      await db.collection('users').updateOne(
        { uid: user.uid },
        { $inc: { walletBalance: -walletUsed } }
      );

      // --- SYNC TO FIRESTORE (for App/Frontend visibility) ---
      try {
        const { getDbAdmin } = await import('@/lib/firebase-admin');
        const dbAdmin = getDbAdmin();
        const userRef = dbAdmin.doc(`userProfiles/${user.uid}`);
        const userDoc = await userRef.get();
        const currentFsBalance = userDoc.exists ? (userDoc.data()?.walletBalance || 0) : 0;
        
        await userRef.set({ 
          walletBalance: Math.max(0, currentFsBalance - walletUsed)
        }, { merge: true });
      } catch (fsErr: any) {
        console.error("[Wallet Sync Error]", fsErr.message);
      }

      // Record transaction in MongoDB
      await db.collection('walletTransactions').insertOne({
        userId: user.uid,
        type: 'debit',
        amount: walletUsed,
        description: `Used for Order #${nextId}`,
        orderId: nextId,
        timestamp: new Date()
      });
    }

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
            sku: it.productId || it.name,
            brand: it.brand || '',
            imageUrl: it.imageUrl || '',
            category: it.category || 'General'
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
          paymentMode: orderData.paymentType === 'Cash on Delivery' ? 'COD' : 'PREPAID'
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

    // --- REBUILT CASHBACK ENGINE V2 ---
    const isOrderFinished = updates.status === 'Delivered' || updates.status === 'Completed';
    const wasAlreadyFinished = currentOrder?.status === 'Delivered' || currentOrder?.status === 'Completed';

    /* CASHBACK DEACTIVATED
    if (isOrderFinished && !wasAlreadyFinished && !currentOrder?.cashbackApplied) {
      console.log(`[Cashback V2] Processing Order #${currentOrder.orderId}`);
      try {
        const settings = await db.collection('walletSettings').findOne({ id: 'global' });
        const isCashbackEnabled = settings?.isCashbackEnabled !== false; // Default to true if missing
        
        if (isCashbackEnabled) {
          let eligibleTotal = 0;
          const items = currentOrder.items || [];
          
          items.forEach((item: any) => {
            let isEligible = true;
            if (settings?.excludedCategories?.includes(item.category)) isEligible = false;
            if (settings?.excludedProducts?.includes(item.name)) isEligible = false;
            
            // New 4-Way Credit Logic
            const isGeneric = item.isGeneric === true || item.isGeneric === 'true';
            if (isGeneric && settings?.enableGenericCredit === false) isEligible = false;
            if (!isGeneric && settings?.enableBrandedCredit === false) isEligible = false;

            if (isEligible) {
              eligibleTotal += (Number(item.unitPrice || item.price || 0) * Number(item.quantity || 1));
            }
          });

          const minOrder = Number(settings?.minOrderAmountForCashback || 0);
          console.log(`[Cashback V2] Eligible Total: ₹${eligibleTotal} | Min Required: ₹${minOrder}`);

          if (eligibleTotal >= minOrder) {
            const cbValue = Number(settings?.cashbackValue || 5);
            let cashback = 0;
            
            if (settings?.cashbackType === 'fixed') {
              cashback = cbValue;
            } else {
              cashback = eligibleTotal * (cbValue / 100);
            }

            cashback = Math.round(cashback * 100) / 100;

            if (cashback > 0) {
              // 1. Credit MongoDB
              await db.collection('users').updateOne(
                { uid: currentOrder.userId },
                { $inc: { walletBalance: cashback } }
              );

              // 2. Add Transaction Record
              await db.collection('walletTransactions').insertOne({
                userId: currentOrder.userId,
                type: 'credit',
                amount: cashback,
                description: `Cashback for Order #${currentOrder.orderId}`,
                orderId: currentOrder.orderId,
                timestamp: new Date()
              });

              // 3. Prevent Duplicates
              await db.collection('orders').updateOne(
                { _id: new ObjectId(id) },
                { $set: { cashbackApplied: true, cashbackAmount: cashback } }
              );

              // 4. Sync to Firestore
              try {
                const { getDbAdmin } = await import('@/lib/firebase-admin');
                const dbAdmin = getDbAdmin();
                const userRef = dbAdmin.doc(`userProfiles/${currentOrder.userId}`);
                const userDoc = await userRef.get();
                const fsBalance = userDoc.exists ? (userDoc.data()?.walletBalance || 0) : 0;
                await userRef.set({ 
                  walletBalance: Number((fsBalance + cashback).toFixed(2))
                }, { merge: true });
              } catch (e) {}

              console.log(`[Cashback V2] SUCCESS: ₹${cashback} credited to ${currentOrder.userId}`);
            }
          } else {
            console.log(`[Cashback V2] Order below threshold: ₹${eligibleTotal} < ₹${minOrder}`);
          }
        }
      } catch (err: any) {
        console.error("[Cashback V2 Error]", err.message);
      }
    }
    */

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
            paymentMode: refreshedOrder.paymentType === 'Cash on Delivery' ? 'COD' : 'PREPAID'
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
            paymentMode: order.paymentType === 'Cash on Delivery' ? 'COD' : 'PREPAID'
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

export async function DELETE(req: Request) {
  try {
    const user = await verifyAdmin(req);
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: "Order ID required" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('sahimed');
    
    // 1. Find the order first to get userId and orderId for sync
    const order = await db.collection('orders').findOne({ _id: new ObjectId(id) });
    
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // 2. Hard Delete from MongoDB
    await db.collection('orders').deleteOne({ _id: new ObjectId(id) });

    // 3. Sync Deletion to Firestore
    try {
      if (order.userId && order.orderId) {
        const { getDbAdmin } = await import('@/lib/firebase-admin');
        const dbAdmin = getDbAdmin();
        await dbAdmin.doc(`userProfiles/${order.userId}/orders/${order.orderId}`).delete();
        console.log(`[Order Delete Sync] Successfully deleted order ${order.orderId} from Firestore`);
      }
    } catch (fsErr: any) {
      console.error(`[Order Delete Sync Error] Failed to delete from Firestore:`, fsErr.message);
    }

    return NextResponse.json({ success: true, message: "Order purged from clinical matrix" });
  } catch (err: any) {
    console.error("[Orders Delete Error]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
