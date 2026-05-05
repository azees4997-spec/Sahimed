import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyAuth } from '@/lib/auth-utils';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const user = await verifyAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const client = await clientPromise;
    const db = client.db('sahimed');
    
    // Fetch profile for balance
    const profile = await db.collection('userProfiles').findOne({ uid: user.uid });
    
    // Fetch transaction history
    const transactions = await db.collection('walletTransactions')
      .find({ userId: user.uid })
      .sort({ timestamp: -1 })
      .limit(50)
      .toArray();

    return NextResponse.json({
      balance: profile?.walletBalance || 0,
      transactions
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await verifyAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { action, amount, orderId, items } = await request.json();

    const client = await clientPromise;
    const db = client.db('sahimed');

    if (action === 'validate_use') {
      // Wallet Usage Rules Logic
      const profile = await db.collection('userProfiles').findOne({ uid: user.uid });
      const balance = profile?.walletBalance || 0;

      if (balance <= 0) return NextResponse.json({ allowable: 0, reason: 'No balance' });

      // Rule 1: Exclude 'Health Devices' category
      const hasExcludedItems = items?.some((item: any) => item.category === 'Health Devices');
      if (hasExcludedItems) {
        return NextResponse.json({ allowable: 0, reason: 'Wallet cannot be used for Health Devices' });
      }

      // Rule 2: Max 20% of order total, unless balance is low/high? 
      // User said: "X% or full of certain amount"
      // Let's implement: Max 20% of order, but if balance is < ₹500 and order is > ₹1000, allow full balance.
      const orderTotal = items?.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0) || 0;
      
      let allowable = Math.min(balance, orderTotal * 0.20);
      
      if (balance < 500) {
        allowable = Math.min(balance, orderTotal); // Allow full small balance
      }

      return NextResponse.json({ 
        allowable, 
        currentBalance: balance 
      });
    }

    if (action === 'spend') {
      // Deduct from wallet
      const profile = await db.collection('userProfiles').findOne({ uid: user.uid });
      const currentBalance = profile?.walletBalance || 0;

      if (currentBalance < amount) {
        return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 });
      }

      await db.collection('userProfiles').updateOne(
        { uid: user.uid },
        { $inc: { walletBalance: -amount } }
      );

      await db.collection('walletTransactions').insertOne({
        userId: user.uid,
        type: 'debit',
        amount,
        description: `Used for Order #${orderId}`,
        orderId,
        timestamp: new Date()
      });

      return NextResponse.json({ success: true, newBalance: currentBalance - amount });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
