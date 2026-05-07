import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyAdmin } from '@/lib/auth-utils';
import { getDbAdmin } from '@/lib/firebase-admin';

/**
 * MASTER MIGRATION API
 * Iterates through all Firestore 'userProfiles' and mirrors them to MongoDB.
 * WARNING: This is a heavy operation. Use only when necessary.
 */
export async function POST(req: Request) {
  try {
    await verifyAdmin(req);
    const client = await clientPromise;
    const db = client.db('sahimed');
    const firestore = getDbAdmin();

    console.log("[Migration] Starting full Firestore -> MongoDB sync...");

    const usersSnap = await firestore.collection('userProfiles').get();
    let migratedCount = 0;
    let addressCount = 0;

    for (const userDoc of usersSnap.docs) {
      const uid = userDoc.id;
      const data = userDoc.data();

      // 1. Mirror Profile
      const mongoUserData = {
        uid: uid,
        name: data.name || null,
        email: data.email || null,
        phone: data.phone || null,
        phoneNumber: data.phone || null,
        walletBalance: data.walletBalance || 0,
        tags: data.tags || [],
        authCreated: data.authCreated || null,
        authLastSignIn: data.authLastSignIn || null,
        updatedAt: new Date(),
      };

      await db.collection('users').updateOne(
        { uid: uid },
        { $set: mongoUserData },
        { upsert: true }
      );
      migratedCount++;

      // 2. Mirror Addresses
      const addressesSnap = await firestore.collection('userProfiles').doc(uid).collection('addresses').get();
      for (const addrDoc of addressesSnap.docs) {
        const addr = addrDoc.data();
        const addressData = {
          ...addr,
          userId: uid,
          phoneNumber: mongoUserData.phoneNumber,
          firestoreId: addrDoc.id,
          updatedAt: new Date(),
          timestamp: addr.createdAt?.toDate?.() || new Date()
        };

        await db.collection('addresses').updateOne(
          { firestoreId: addrDoc.id },
          { $set: addressData },
          { upsert: true }
        );
        addressCount++;
      }
    }

    console.log(`[Migration] Finished. Users: ${migratedCount}, Addresses: ${addressCount}`);
    return NextResponse.json({ 
      success: true, 
      usersMigrated: migratedCount, 
      addressesMigrated: addressCount 
    });

  } catch (err: any) {
    console.error("[Migration API Error]", err);
    const status = err.message?.includes('Unauthorized') || err.message?.includes('Forbidden') ? 401 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}
