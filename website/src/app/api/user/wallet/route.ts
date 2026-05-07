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
      const [profile, settings] = await Promise.all([
        db.collection('userProfiles').findOne({ uid: user.uid }),
        db.collection('walletSettings').findOne({ id: 'global' })
      ]);

      const balance = profile?.walletBalance || 0;
      if (balance <= 0) return NextResponse.json({ allowable: 0, currentBalance: 0, reason: 'No balance' });

      const rules = settings || {
        maxPercentage: 20,
        maxFixedAmount: 500,
        allowGenericOnly: false,
        allowBrandedOnly: false,
        excludedCategories: ['Health Devices'],
        excludedProducts: [],
        excludedCustomers: [],
        minWalletBalance: 500
      };

      // 0. Customer Restriction Check
      if (rules.excludedCustomers?.includes(user.uid)) {
        return NextResponse.json({ 
          allowable: 0, 
          currentBalance: balance, 
          reason: 'Wallet usage restricted for your account' 
        });
      }

      // Calculate Eligible Total based on rules
      let eligibleTotal = 0;
      const ineligibleReasons: string[] = [];

      items?.forEach((item: any) => {
        let isItemEligible = true;

        // 1. Category Restriction
        if (rules.excludedCategories?.includes(item.category)) {
          isItemEligible = false;
        }

        // 2. Product Restriction
        if (rules.excludedProducts?.includes(item.name)) {
          isItemEligible = false;
        }

        // 3. Branded/Generic Restriction
        const isGeneric = item.isGeneric === true || item.isGeneric === 'true';
        if (rules.allowGenericOnly && !isGeneric) {
          isItemEligible = false;
        }
        if (rules.allowBrandedOnly && isGeneric) {
          isItemEligible = false;
        }

        if (isItemEligible) {
          eligibleTotal += (item.price * item.quantity);
        }
      });

      if (eligibleTotal <= 0) {
        return NextResponse.json({ 
          allowable: 0, 
          currentBalance: balance, 
          reason: 'No eligible items in cart' 
        });
      }

      // Small Balance Rule: If balance is low, allow full redemption on eligible items
      if (balance < (rules.minWalletBalance || 500)) {
        return NextResponse.json({
          allowable: Math.min(balance, eligibleTotal),
          currentBalance: balance
        });
      }

      // Calculate standard allowable amount
      const percentageLimit = eligibleTotal * (rules.maxPercentage / 100);
      const allowable = Math.min(balance, percentageLimit, rules.maxFixedAmount);

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
