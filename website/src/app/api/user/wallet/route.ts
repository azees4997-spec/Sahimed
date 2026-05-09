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
    const profile = await db.collection('users').findOne({ uid: user.uid });
    
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

    let client, db;
    try {
      client = await clientPromise;
      db = client.db('sahimed');
      // Simple ping to verify connection
      await db.command({ ping: 1 });
    } catch (dbErr: any) {
      console.error("[Wallet DB Error]", dbErr);
      return NextResponse.json({ 
        error: "Database Connection Failed", 
        details: dbErr.message,
        hint: "Ensure MONGODB_URI is set in Vercel and IP 0.0.0.0/0 is whitelisted in MongoDB Atlas."
      }, { status: 503 });
    }

    if (action === 'validate_use') {
      console.log(`[Wallet] Validating usage for user: ${user.uid}`);
      
      const [profile, settings] = await Promise.all([
        db.collection('users').findOne({ uid: user.uid }).catch(e => { console.error("Profile fetch error", e); return null; }),
        db.collection('walletSettings').findOne({ id: 'global' }).catch(e => { console.error("Settings fetch error", e); return null; })
      ]);

      const balance = profile?.walletBalance || 0;
      console.log(`[Wallet] User Balance: ${balance}`);

      if (balance <= 0) return NextResponse.json({ allowable: 0, currentBalance: 0, reason: 'No balance' });

      const rules = settings || {
        maxPercentage: 20,
        maxFixedAmount: 500,
        allowGenericOnly: false,
        allowBrandedOnly: false,
        excludedCategories: [],
        excludedProducts: [],
        excludedCustomers: [],
        minWalletBalance: 0
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
      
      if (!items || !Array.isArray(items)) {
        console.warn("[Wallet] No valid items array provided for validation");
      }

      items?.forEach((item: any) => {
        let isItemEligible = true;

        // 1. Category Restriction
        if (item.category && rules.excludedCategories?.includes(item.category)) {
          isItemEligible = false;
        }

        const isGeneric = item.isGeneric === true || item.isGeneric === 'true';
        let isItemEligible = true;
        let reason = '';

        // Apply rules
        if (rules.allowGenericOnly && !isGeneric) {
          isItemEligible = false;
          reason = 'Generic products only';
        }
        if (rules.allowBrandedOnly && isGeneric) {
          isItemEligible = false;
          reason = 'Branded products only';
        }
        if (rules.excludedCategories?.includes(item.category)) {
          isItemEligible = false;
          reason = `Category ${item.category} excluded`;
        }
        if (rules.excludedProducts?.includes(item.id)) {
          isItemEligible = false;
          reason = 'Product excluded';
        }

        if (isItemEligible) {
          eligibleTotal += ((item.price || 0) * (item.quantity || 1));
        }
      });

      console.log(`[Wallet] Eligible Total: ${eligibleTotal}`);

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
      console.log(`[Wallet] Processing spend: ${amount} for user: ${user.uid}`);
      
      // Deduct from wallet
      const profile = await db.collection('users').findOne({ uid: user.uid });
      if (!profile) {
        return NextResponse.json({ error: 'User profile not found in database' }, { status: 404 });
      }

      const currentBalance = profile?.walletBalance || 0;

      if (currentBalance < amount) {
        return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 });
      }

      await db.collection('users').updateOne(
        { uid: user.uid },
        { $inc: { walletBalance: -amount } }
      );

      // --- SYNC TO FIRESTORE (for App/Frontend visibility) ---
      try {
        const { getDbAdmin } = await import('@/lib/firebase-admin');
        const dbAdmin = getDbAdmin();
        const userRef = dbAdmin.doc(`userProfiles/${user.uid}`);
        
        await userRef.set({ 
          walletBalance: Math.max(0, currentBalance - amount)
        }, { merge: true });
      } catch (fsErr: any) {
        console.error("[Wallet Sync Error]", fsErr.message);
      }

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
    console.error("[Wallet API Error]", err);
    return NextResponse.json({ error: "Internal Server Error", message: err.message }, { status: 500 });
  }
}
