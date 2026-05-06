import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-utils';

export async function POST(req: Request) {
  try {
    const user = await verifyAuth(req);
    const { amount, currency = 'INR' } = await req.json();

    if (!amount) {
      return NextResponse.json({ error: "Amount is required" }, { status: 400 });
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return NextResponse.json({ error: "Razorpay keys not configured" }, { status: 500 });
    }

    // Basic Auth Header
    const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');

    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`
      },
      body: JSON.stringify({
        amount: Math.round(amount * 100), // Razorpay expects amount in paise
        currency,
        receipt: `receipt_${Date.now()}`,
      })
    });

    const order = await response.json();

    if (!response.ok) {
      console.error("[Razorpay API Error]", order);
      return NextResponse.json({ error: order.error?.description || "Failed to create Razorpay order" }, { status: response.status });
    }

    return NextResponse.json({ 
      id: order.id, 
      amount: order.amount, 
      currency: order.currency 
    });
  } catch (err: any) {
    console.error("[Razorpay Payment Error]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
