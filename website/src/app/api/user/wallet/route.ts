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
    
    const profile = await db.collection('users').findOne({ uid: user.uid });
    
    // Fetch transaction history
    const transactions = await db.collection('walletTransactions')
      .find({ userId: user.uid })
      .sort({ timestamp: -1 })
      .limit(50)
      .toArray();

    let balance = profile?.walletBalance || 0;
    
    // SELF-HEAL: If balance is negative, reset to zero in DB and response
    if (balance < 0) {
      balance = 0;
      await db.collection('users').updateOne(
        { uid: user.uid },
        { $set: { walletBalance: 0 } }
      );
    }

    const roundedBalance = Math.round(balance * 100) / 100;

    return NextResponse.json({
      balance: roundedBalance,
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

    let client, db;
    try {
      client = await clientPromise;
      db = client.db('sahimed');
      await db.command({ ping: 1 });
    } catch (dbErr: any) {
      console.error("[Wallet DB Error]", dbErr);
      return NextResponse.json({ error: "Database Connection Failed" }, { status: 503 });
    }

    if (action === 'validate_use') {
      const profile = await db.collection('users').findOne({ uid: user.uid });
      const balance = profile?.walletBalance || 0;
      const roundedBalance = Math.round(balance * 100) / 100;

      if (roundedBalance <= 0) {
        return NextResponse.json({ allowable: 0, currentBalance: 0, reason: 'Balance is ₹0' });
      }

      // SLEDGEHAMMER: Ignore all rules and allow 100% of balance on any items in cart
      // We still calculate eligibleTotal to ensure the cart isn't empty
      let cartTotal = 0;
      if (items && Array.isArray(items)) {
        items.forEach((item: any) => {
          cartTotal += Number(item.price || 0) * Number(item.quantity || 1);
        });
      }

      console.log(`[Wallet Sledgehammer] Balance: ${roundedBalance}, Cart Total: ${cartTotal}`);

      if (cartTotal <= 0) {
        return NextResponse.json({ 
          allowable: 0, 
          currentBalance: roundedBalance, 
          reason: 'Cart is empty' 
        });
      }

      // Allow the minimum of (Full Balance) or (Cart Total)
      // This ensures the user can use their whole wallet if they have enough items
      const allowable = Math.min(roundedBalance, cartTotal);

      return NextResponse.json({ 
        allowable: Math.round(allowable * 100) / 100, 
        currentBalance: roundedBalance 
      });
    }

    if (action === 'spend') {
      const profile = await db.collection('users').findOne({ uid: user.uid });
      const currentBalance = profile?.walletBalance || 0;

      if (currentBalance < amount) {
        return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 });
      }

      const newBalance = Math.max(0, currentBalance - amount);

      await db.collection('users').updateOne(
        { uid: user.uid },
        { $set: { walletBalance: newBalance } }
      );

      // Sync to Firestore
      try {
        const { getDbAdmin } = await import('@/lib/firebase-admin');
        const dbAdmin = getDbAdmin();
        await dbAdmin.doc(`userProfiles/${user.uid}`).set({ 
          walletBalance: Math.round(newBalance * 100) / 100
        }, { merge: true });
      } catch (e) {}

      await db.collection('walletTransactions').insertOne({
        userId: user.uid,
        type: 'debit',
        amount,
        description: `Used for Order #${orderId}`,
        orderId,
        timestamp: new Date()
      });

      return NextResponse.json({ success: true, newBalance: Math.round(newBalance * 100) / 100 });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    console.error("[Wallet API Error]", err);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
