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

    // Verify Checksum
    const checksum = body.CHECKSUMHASH;
    delete body.CHECKSUMHASH;
    
    const isVerified = await PaytmService.verifyChecksum(body, process.env.PAYTM_MERCHANT_KEY || 'UcS3iYcSyDs5%RGX', checksum);
    
    if (!isVerified) {
      console.error("[Paytm Callback] Checksum Verification Failed");
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/checkout?error=Security+Verification+Failed`, 303);
    }

    const client = await clientPromise;
    const db = client.db('sahimed');

    const status = body.STATUS;
    const orderId = body.ORDERID;
    const txnId = body.TXNID;

    if (status === 'TXN_SUCCESS') {
      // 1. Update Order in MongoDB
      await db.collection('orders').updateOne(
        { orderId: orderId },
        { 
          $set: { 
            status: 'Confirmed', 
            paymentId: txnId,
            paytmOrderId: orderId,
            updatedAt: new Date(),
            paymentStatus: 'Paid'
          } 
        }
      );

      // 2. Sync to Firestore (Real-time update for App)
      try {
        const order = await db.collection('orders').findOne({ orderId: orderId });
        if (order && order.userId) {
          const { getDbAdmin } = await import('@/lib/firebase-admin');
          const dbAdmin = getDbAdmin();
          await dbAdmin.doc(`userProfiles/${order.userId}/orders/${orderId}`).set({
            status: 'Confirmed',
            paymentId: txnId,
            updatedAt: new Date()
          }, { merge: true });
        }
      } catch (fsErr: any) {
        console.error("[Paytm Callback Sync Error]", fsErr.message);
      }

      // Redirect to success page
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/orders/success?id=${orderId}`, 303);
    } else {
      // Update Order as Failed
      await db.collection('orders').updateOne(
        { orderId: orderId },
        { $set: { status: 'Payment Failed', updatedAt: new Date() } }
      );
      
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/checkout?error=Payment+Failed`, 303);
    }

  } catch (err: any) {
    console.error("[Paytm Callback Error]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
