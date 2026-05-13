import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-utils';
import { PaytmService } from '@/lib/payments/paytm';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(req: Request) {
  try {
    const user = await verifyAuth(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { orderId, amount, channel, userDetails } = await req.json();

    if (!orderId || !amount) {
      return NextResponse.json({ error: "Order ID and amount are required" }, { status: 400 });
    }

    const host = req.headers.get('host') || undefined;

    const result = await PaytmService.initiateTransaction(
      orderId, 
      amount, 
      user.uid, 
      host,
      channel || 'WEB',
      userDetails
    );

    if (result.body?.resultInfo?.resultStatus === 'S') {
      return NextResponse.json({
        txnToken: result.body.txnToken,
        mid: process.env.PAYTM_MID || '',
        orderId: result.body.uniqueOrderId || orderId, // Use the unique ID for the payment window
        amount: amount
      });
    } else {
      const resultInfo = result.body?.resultInfo || {};
      const resultCode = resultInfo.resultCode || "Unknown";
      const resultMsg = resultInfo.resultMsg || "System Error";
      const errorMsg = `Paytm Error: ${resultCode} - ${resultMsg}`;
      
      console.warn(`[Paytm Failure] ${errorMsg}`, resultInfo);
      return NextResponse.json({ 
        error: errorMsg,
        details: resultInfo
      }, { status: 400 });
    }

  } catch (err: any) {
    console.error("[Paytm Initiate Error]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
