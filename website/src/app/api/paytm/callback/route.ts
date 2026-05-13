import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { PaytmService } from '@/lib/payments/paytm';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const body: any = {};
    formData.forEach((value, key) => {
      body[key] = value;
    });

    console.log("[Paytm Callback Received]", body);

    // Verify Checksum/Signature
    const checksum = body.CHECKSUMHASH || body.signature;
    if (body.CHECKSUMHASH) delete body.CHECKSUMHASH;
    if (body.signature) delete body.signature;
    
    if (!checksum) {
      console.error("[Paytm Callback] No Checksum/Signature found in response");
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/checkout?error=Missing+Verification+Token`, 303);
    }

    const isVerified = await PaytmService.verifyChecksum(body, process.env.PAYTM_MERCHANT_KEY || '', checksum);
    
    if (!isVerified) {
      console.error("[Paytm Callback] Checksum Verification Failed");
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/checkout?error=Security+Verification+Failed`, 303);
    }

    const client = await clientPromise;
    const db = client.db('sahimed');

    const status = body.STATUS;
    const paytmOrderId = body.ORDERID;
    const txnId = body.TXNID;

    // Extract baseOrderId (strip T suffix if exists)
    const baseOrderId = paytmOrderId.toString().includes('-') 
      ? paytmOrderId.toString().substring(0, paytmOrderId.toString().lastIndexOf('-'))
      : paytmOrderId.toString();

    if (status === 'TXN_SUCCESS') {
      console.log(`[Paytm Success] Updating Order: ${baseOrderId} with Paytm ID: ${paytmOrderId}`);
      
      // 1. Update Order in MongoDB
      await db.collection('orders').updateOne(
        { orderId: baseOrderId },
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
              message: `Payment confirmed via Paytm. TXN ID: ${txnId}` 
            } 
          } as any
        }
      );

      // 2. Sync to Firestore (Real-time update for App)
      try {
        const order = await db.collection('orders').findOne({ orderId: baseOrderId });
        if (order && order.userId) {
          const { getDbAdmin } = await import('@/lib/firebase-admin');
          const dbAdmin = getDbAdmin();
          await dbAdmin.doc(`userProfiles/${order.userId}/orders/${baseOrderId}`).set({
            status: 'Confirmed',
            paymentId: txnId,
            updatedAt: new Date(),
            timeline: order.timeline // Sync the updated timeline
          }, { merge: true });
        }
      } catch (fsErr: any) {
        console.error("[Paytm Callback Sync Error]", fsErr.message);
      }

      // Redirect to success page
      return NextResponse.redirect(`https://sahimed.com/order-success/${baseOrderId}`, 303);
    } else {
      // Update Order as Failed
      await db.collection('orders').updateOne(
        { orderId: baseOrderId },
        { $set: { status: 'Payment Failed', updatedAt: new Date() } }
      );
      
      return NextResponse.redirect(`https://sahimed.com/payment-failed?error=Payment+Failed`, 303);
    }

  } catch (err: any) {
    console.error("[Paytm Callback Error]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
