
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyAuth } from '@/lib/auth-utils';
import { getDbAdmin } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

/**
 * GET: Fetch the current user's profile from the MongoDB 'users' collection.
 * This is the primary source of truth for the app's profile screen.
 */
export async function GET(req: Request) {
  try {
    const user = await verifyAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db('sahimed');
    
    // Fetch user from 'users' collection (consolidated from userProfiles)
    const mongoUser = await db.collection('users').findOne({ uid: user.uid });

    if (!mongoUser) {
      // If user doesn't exist in MongoDB yet, they might need to be synced
      // For now, we return a 404 or empty profile
      return NextResponse.json({ 
        uid: user.uid,
        name: user.displayName || 'Sahimed Member',
        email: user.email,
        phone: user.phoneNumber,
        walletBalance: 0,
        isNewUser: true,
        photoUrl: user.photoURL || null,
        age: null,
        weight: null,
        height: null
      });
    }

    // Return the consolidated profile
    return NextResponse.json({
      uid: mongoUser.uid,
      name: mongoUser.name || user.displayName || 'Sahimed Member',
      email: mongoUser.email || user.email,
      phone: mongoUser.phone || mongoUser.phoneNumber || user.phoneNumber,
      walletBalance: mongoUser.walletBalance || 0,
      tags: mongoUser.tags || [],
      photoUrl: mongoUser.photoUrl || user.photoURL || null,
      age: mongoUser.age || null,
      weight: mongoUser.weight || null,
      height: mongoUser.height || null,
      updatedAt: mongoUser.updatedAt
    });
  } catch (err: any) {
    console.error("[User Profile API Error]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * POST: Create or update fields in the user's profile.
 * Supports updating name, photoUrl, age, weight, and height.
 */
export async function POST(req: Request) {
  try {
    const user = await verifyAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { name, photoUrl, age, weight, height } = body;

    const client = await clientPromise;
    const db = client.db('sahimed');

    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (photoUrl !== undefined) updates.photoUrl = photoUrl;
    if (age !== undefined) updates.age = age;
    if (weight !== undefined) updates.weight = weight;
    if (height !== undefined) updates.height = height;
    updates.updatedAt = new Date();

    // 1. Update/Upsert in MongoDB
    await db.collection('users').updateOne(
      { uid: user.uid },
      { $set: updates },
      { upsert: true }
    );

    // 2. Update/Sync to Firestore if Firestore Admin is configured
    try {
      const firestore = getDbAdmin();
      if (firestore) {
        const firestoreUpdates = { ...updates };
        delete firestoreUpdates.updatedAt;
        await firestore.collection('userProfiles').doc(user.uid).set(
          {
            ...firestoreUpdates,
            updatedAt: new Date()
          },
          { merge: true }
        );
      }
    } catch (fsErr) {
      console.warn("[User Profile POST] Firestore mirror failed:", fsErr);
    }

    return NextResponse.json({ success: true, profile: updates });
  } catch (err: any) {
    console.error("[User Profile POST Error]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
