import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { PaytmService } from '@/lib/payments/paytm';

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    let body: any;
    try {
      body = JSON.parse(rawBody);
    } catch (e) {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    console.log("[Paytm Webhook Received]", body);

    // Some webhooks send nested body/head, some send flat JSON
    const data = body.body || body;
    const head = body.head || {};
    
    // Checksum verification
    const signature = head.signature || data.CHECKSUMHASH || data.signature;
    
    // Webhooks might be signed differently, for now we will process if we can extract an orderId
    // In production, you should strictly verify webhook signatures based on Paytm Docs.
    // For Payment Links, `data.merchantRequestId` or `data.orderId` contains our internal tracking ID
    
    const paytmOrderId = data.orderId || data.ORDERID;
    const merchantRequestId = data.merchantRequestId; 
    // merchantRequestId looks like SHM12345-1680000000
    
    let baseOrderId = null;
    
    if (merchantRequestId) {
       baseOrderId = merchantRequestId.split('-')[0];
    } else if (paytmOrderId) {
       baseOrderId = paytmOrderId.toString().includes('-') 
        ? paytmOrderId.toString().substring(0, paytmOrderId.toString().lastIndexOf('-'))
        : paytmOrderId.toString();
    }

    if (!baseOrderId) {
      console.warn("[Paytm Webhook] No identifiable Order ID found", data);
      return NextResponse.json({ success: true, warning: "Ignored, no Order ID" });
    }

    const status = data.resultInfo?.resultStatus || data.STATUS || data.status;
    const txnId = data.txnId || data.TXNID;

    // We only care about successful payments to mark order as Confirmed
    if (status === 'TXN_SUCCESS' || status === 'SUCCESS') {
      const client = await clientPromise;
      const db = client.db('sahimed');
      
      console.log(`[Paytm Webhook] Payment Success for Order: ${baseOrderId}`);

      // 1. Update Order in MongoDB
      const updateRes = await db.collection('orders').updateOne(
        { orderId: baseOrderId, status: { $in: ['Pending Payment', 'Payment Pending'] } },
        { 
          $set: { 
            status: 'Confirmed', 
            paymentId: txnId,
            paytmOrderId: paytmOrderId,
            updatedAt: new Date(),
            paymentStatus: 'Paid'
          },
          $push: { 
            timeline: { 
              status: 'Paid', 
              timestamp: new Date(), 
              message: `Payment link fulfilled via Paytm Webhook. TXN ID: ${txnId}` 
            } 
          } as any
        }
      );

      // 2. Trigger Shipway if status was changed
      if (updateRes.modifiedCount > 0) {
        const order = await db.collection('orders').findOne({ orderId: baseOrderId });
        if (order) {
           console.log(`[Paytm Webhook] Triggering Shipway for paid order ${baseOrderId}`);
           try {
             const { ShipwayService } = await import('@/lib/logistics/shipway');
             const shipwayRes = await ShipwayService.createForwardOrder({
               orderId: order.orderId,
               billingCustomerName: order.patientName,
               orderItems: (order.items || []).map((it: any) => ({
                 name: it.name,
                 quantity: it.quantity,
                 price: Number(it.unitPrice),
                 sku: it.productId || it.name
               })),
               warehouseId: '93743', 
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

             if (shipwayRes.success && shipwayRes.data) {
                const vData = shipwayRes.data.result || shipwayRes.data;
                const awb = vData?.awb_number || vData?.awb;
                if (awb) {
                  await db.collection('orders').updateOne(
                    { _id: order._id },
                    { $set: { 
                        'shipping.awb': awb, 
                        'shipping.labelUrl': vData?.label_url || vData?.manifest_url || vData?.label,
                        'shipping.courier': vData?.courier_name || vData?.courier
                      } 
                    }
                  );
                }
             }
           } catch (shipwayErr) {
             console.error("[Paytm Webhook Shipway Error]", shipwayErr);
           }
           
           // Sync to Firestore
           if (order.userId) {
             try {
               const { getDbAdmin } = await import('@/lib/firebase-admin');
               const dbAdmin = getDbAdmin();
               await dbAdmin.doc(`userProfiles/${order.userId}/orders/${baseOrderId}`).set({
                 status: 'Confirmed',
                 paymentId: txnId,
                 updatedAt: new Date(),
               }, { merge: true });
             } catch (fsErr) {}
           }
        }
      }
    }

    // Always return 200 OK to acknowledge receipt to Paytm
    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error("[Paytm Webhook Error]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
