import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyAuth } from '@/lib/auth-utils';
import { getDbAdmin } from '@/lib/firebase-admin';

export async function POST(req: Request) {
  try {
    const user = await verifyAuth(req);
    const { fcmToken } = await req.json();

    if (!fcmToken) {
      return NextResponse.json({ error: 'FCM Token required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('sahimed');

    // 1. Update in MongoDB Users collection
    await db.collection('users').updateOne(
      { uid: user.uid },
      { 
        $set: { 
          fcmToken: fcmToken,
          lastFcmUpdate: new Date(),
          updatedAt: new Date()
        } 
      },
      { upsert: true }
    );

    // 2. Optionally sync to Firestore Profile for fallback
    const firestore = getDbAdmin();
    if (firestore) {
      await firestore.collection('userProfiles').doc(user.uid).set({
        fcmToken: fcmToken,
        lastFcmUpdate: new Date(),
        updatedAt: new Date()
      }, { merge: true });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[FCM Token API Error]", err);
    const status = err.message?.includes('Unauthorized') ? 401 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}
