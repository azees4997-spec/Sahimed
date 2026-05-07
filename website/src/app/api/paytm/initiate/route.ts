import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-utils';
import { PaytmService } from '@/lib/payments/paytm';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(req: Request) {
  try {
    const user = await verifyAuth(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { orderId, amount, channel } = await req.json();

    if (!orderId || !amount) {
      return NextResponse.json({ error: "Order ID and amount are required" }, { status: 400 });
    }

    const result = await PaytmService.initiateTransaction(
      orderId, 
      amount, 
      user.uid, 
      channel || 'WEB'
    );

    if (result.body?.resultInfo?.resultStatus === 'S') {
      return NextResponse.json({
        txnToken: result.body.txnToken,
        mid: process.env.PAYTM_MID || 'CFehFB20400052473723',
        orderId: orderId,
        amount: amount
      });
    } else {
      return NextResponse.json({ 
        error: result.body?.resultInfo?.resultMsg || "Failed to initiate Paytm transaction" 
      }, { status: 500 });
    }

  } catch (err: any) {
    console.error("[Paytm Initiate Error]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
