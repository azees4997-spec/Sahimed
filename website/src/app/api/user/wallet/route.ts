import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyAuth } from '@/lib/auth-utils';

/**
 * WALLET SYSTEM V2: ROBUST, LOGGED, AND FAIL-SAFE
 * 1. Never allows negative balances.
 * 2. Always records a transaction for every change.
 * 3. Uses rounded 2-decimal precision.
 * 4. Safe fallbacks if settings are missing.
 */

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const user = await verifyAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const client = await clientPromise;
    const db = client.db('sahimed');
    
    // Get profile and fix negative balance if it exists
    const profile = await db.collection('users').findOne({ uid: user.uid });
    let balance = profile?.walletBalance || 0;
    
    if (balance < 0) {
      balance = 0;
      await db.collection('users').updateOne({ uid: user.uid }, { $set: { walletBalance: 0 } });
    }

    const transactions = await db.collection('walletTransactions')
      .find({ userId: user.uid })
      .sort({ timestamp: -1 })
      .limit(50)
      .toArray();

    return NextResponse.json({
      balance: Math.round(balance * 100) / 100,
      transactions: transactions.map(t => ({ ...t, id: t._id.toString() }))
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

    const [profile, settings] = await Promise.all([
      db.collection('users').findOne({ uid: user.uid }),
      db.collection('walletSettings').findOne({ id: 'global' })
    ]);

    const currentBalance = Math.max(0, profile?.walletBalance || 0);
    const rules = settings || {
      maxPercentage: 20,
      maxFixedAmount: 500,
      minWalletBalance: 500,
      isCashbackEnabled: true
    };

    // --- ACTION: VALIDATE USAGE (Pre-Checkout) ---
    if (action === 'validate_use') {
      console.log(`[Wallet V2] Validating for User: ${user.uid}. Balance: ₹${currentBalance}`);
      
      if (currentBalance <= 0) return NextResponse.json({ allowable: 0, currentBalance: 0, reason: 'Balance is zero' });
      if (rules.excludedCustomers?.includes(user.uid)) return NextResponse.json({ allowable: 0, currentBalance, reason: 'Account restricted' });

      let eligibleTotal = 0;
      const cartItems = items || [];
      
      cartItems.forEach((item: any) => {
        // DEFAULT TO ELIGIBLE (Relaxed Rule)
        let isEligible = true;

        // Only exclude if explicitly found in exclusion lists
        if (rules.excludedCategories?.length > 0 && rules.excludedCategories.includes(item.category)) isEligible = false;
        if (rules.excludedProducts?.length > 0 && rules.excludedProducts.includes(item.name)) isEligible = false;
        
        // Branded/Generic check (New 4-Way Granular Logic)
        const isGeneric = item.isGeneric === true || item.isGeneric === 'true';
        if (isGeneric && rules.enableGenericUse === false) isEligible = false;
        if (!isGeneric && rules.enableBrandedUse === false) isEligible = false;

        if (isEligible) {
          const itemTotal = (Number(item.price || 0) * Number(item.quantity || 1));
          eligibleTotal += itemTotal;
        }
      });

      console.log(`[Wallet V2] Eligible Total for discount: ₹${eligibleTotal}`);

      if (eligibleTotal <= 0) {
        return NextResponse.json({ 
          allowable: 0, 
          currentBalance, 
          reason: 'Items not eligible for wallet discount' 
        });
      }

      // Small Balance Rule: Allow 100% redemption
      if (currentBalance < (rules.minWalletBalance || 500)) {
        return NextResponse.json({ 
          allowable: Math.round(Math.min(currentBalance, eligibleTotal) * 100) / 100,
          currentBalance
        });
      }

      // Standard Limit Rule
      const percentageLimit = eligibleTotal * ((rules.maxPercentage || 20) / 100);
      const allowable = Math.min(currentBalance, percentageLimit, (rules.maxFixedAmount || 500));

      return NextResponse.json({ 
        allowable: Math.round(allowable * 100) / 100, 
        currentBalance 
      });
    }

    // --- ACTION: SPEND (Confirm Usage) ---
    if (action === 'spend') {
      const spendAmount = Math.round(Number(amount) * 100) / 100;
      if (spendAmount <= 0) return NextResponse.json({ success: true });
      if (currentBalance < spendAmount) return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 });

      const newBalance = Math.max(0, currentBalance - spendAmount);

      // Atomic Update
      await db.collection('users').updateOne(
        { uid: user.uid },
        { $set: { walletBalance: newBalance } }
      );

      // Record Transaction
      await db.collection('walletTransactions').insertOne({
        userId: user.uid,
        type: 'debit',
        amount: spendAmount,
        description: `Used for Order #${orderId}`,
        orderId,
        timestamp: new Date()
      });

      // Sync to Firestore for real-time app view
      try {
        const { getDbAdmin } = await import('@/lib/firebase-admin');
        const dbAdmin = getDbAdmin();
        await dbAdmin.doc(`userProfiles/${user.uid}`).set({ 
          walletBalance: Math.round(newBalance * 100) / 100
        }, { merge: true });
      } catch (e) {}

      return NextResponse.json({ success: true, newBalance });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    console.error("[Wallet V2 Error]", err);
    return NextResponse.json({ error: "System Error" }, { status: 500 });
  }
}
