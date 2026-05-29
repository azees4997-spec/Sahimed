import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyAuth, verifyAdmin } from '@/lib/auth-utils';
import { getDbAdmin } from '@/lib/firebase-admin';

/**
 * API to synchronize a user's Firestore profile and addresses to MongoDB.
 * This ensures MongoDB remains a mirror of the critical user identity data.
 */
export async function POST(req: Request) {
  try {
    let user;
    let isAdmin = false;
    try {
      user = await verifyAdmin(req);
      isAdmin = true;
    } catch (err) {
      user = await verifyAuth(req);
    }

    const body = await req.json().catch(() => ({}));
    const targetUid = (isAdmin && body.uid) ? body.uid : user.uid;

    if (!targetUid) {
      return NextResponse.json({ error: 'UID required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('sahimed');
    const firestore = getDbAdmin();

    if (!firestore) {
      console.warn("[Sync] Firestore Admin not configured. Performing basic Mongo upsert only.");
      await db.collection('users').updateOne(
        { uid: targetUid },
        { 
          $set: { 
            uid: targetUid,
            email: user.email || null,
            phone: user.phoneNumber || null,
            updatedAt: new Date()
          } 
        },
        { upsert: true }
      );
      return NextResponse.json({ 
        success: true, 
        message: 'Sync partially completed: Basic profile created in MongoDB' 
      });
    }

    // 1. Fetch Profile from Firestore
    const profileSnap = await firestore.collection('userProfiles').doc(targetUid).get();
    if (!profileSnap.exists) {
      return NextResponse.json({ error: 'Firestore profile not found' }, { status: 404 });
    }

    const profileData = profileSnap.data() || {};
    
    // 2. Prepare MongoDB User Data
    const mongoUserData = {
      uid: targetUid,
      name: profileData.name || null,
      email: profileData.email || user.email || null,
      phone: profileData.phone || user.phoneNumber || null,
      phoneNumber: profileData.phone || user.phoneNumber || null,
      walletBalance: profileData.walletBalance || 0,
      tags: profileData.tags || [],
      photoUrl: profileData.photoUrl || null,
      age: profileData.age || null,
      weight: profileData.weight || null,
      height: profileData.height || null,
      authCreated: profileData.authCreated || null,
      authLastSignIn: profileData.authLastSignIn || null,
      updatedAt: new Date(),
    };

    // 3. Upsert into 'users' collection
    await db.collection('users').updateOne(
      { uid: targetUid },
      { $set: mongoUserData },
      { upsert: true }
    );

    // 4. Fetch Addresses from Firestore
    const addressesSnap = await firestore.collection('userProfiles').doc(targetUid).collection('addresses').get();
    const addresses = addressesSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // 5. Sync Addresses to 'addresses' collection
    if (addresses.length > 0) {
      for (const addr of addresses) {
        const addressData = {
          ...addr,
          userId: targetUid,
          phoneNumber: mongoUserData.phoneNumber, // For cross-platform matching
          updatedAt: new Date(),
          timestamp: addr.createdAt || new Date()
        };
        // Use a composite key or Firestore ID for matching
        const addrId = addr.id;
        delete addressData.id;

        await db.collection('addresses').updateOne(
          { 
            $or: [
              { firestoreId: addrId },
              { $and: [{ userId: targetUid }, { tag: addr.tag }, { street: addr.street }] }
            ]
          },
          { $set: { ...addressData, firestoreId: addrId } },
          { upsert: true }
        );
      }
    }

    console.log(`[Sync] Successfully mirrored User ${targetUid} to MongoDB`);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[Sync API Error]", err);
    const status = err.message?.includes('Unauthorized') ? 401 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}
