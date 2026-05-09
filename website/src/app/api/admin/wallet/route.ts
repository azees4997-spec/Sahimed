import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyAdmin } from '@/lib/auth-utils';
import { getDbAdmin } from '@/lib/firebase-admin';



export async function GET(request: Request) {
  try {
    const admin = await verifyAdmin(request);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    const client = await clientPromise;
    const db = client.db('sahimed');

    const profile = await db.collection('users').findOne({ uid: userId });
    return NextResponse.json({ balance: profile?.walletBalance || 0 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {

  try {
    const admin = await verifyAdmin(request);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { userId, amount, description } = await request.json();

    const client = await clientPromise;
    const db = client.db('sahimed');

    // Update balance in MongoDB
    await db.collection('users').updateOne(
      { uid: userId },
      { $inc: { walletBalance: amount } },
      { upsert: true }
    );

    // Sync to Firestore for real-time app reflection
    try {
      const firestore = getDbAdmin();
      const userRef = firestore.collection('userProfiles').doc(userId);
      const doc = await userRef.get();
      const currentFsBalance = doc.exists ? (doc.data()?.walletBalance || 0) : 0;
      await userRef.set({ 
        walletBalance: currentFsBalance + amount 
      }, { merge: true });
    } catch (fsErr) {
      console.error("[Admin Wallet Sync Error]", fsErr);
      // We continue since MongoDB is the primary source for the clinical matrix
    }


    // Record transaction
    await db.collection('walletTransactions').insertOne({
      userId,
      type: amount >= 0 ? 'credit' : 'debit',
      amount: Math.abs(amount),
      description: description || 'Admin Adjustment',
      timestamp: new Date(),
      adminId: admin.uid
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
