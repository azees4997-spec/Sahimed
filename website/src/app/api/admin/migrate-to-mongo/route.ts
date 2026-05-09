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

    if (!firestore) {
      return NextResponse.json({ 
        error: "Firebase Admin Configuration Missing. Please check your environment variables (Project ID, Client Email, Private Key)." 
      }, { status: 500 });
    }

    console.log("[Migration] Starting full Auth -> Firestore -> MongoDB sync...");

    const authAdmin = getAuthAdmin();
    if (!authAdmin) {
      return NextResponse.json({ error: "Auth Admin missing" }, { status: 500 });
    }

    let migratedCount = 0;
    let addressCount = 0;
    let nextPageToken: string | undefined;

    do {
      const listUsersResult = await authAdmin.listUsers(100, nextPageToken);
      
      for (const userRecord of listUsersResult.users) {
        const uid = userRecord.uid;
        
        // 1. Get Firestore Profile
        const userDoc = await firestore.collection('userProfiles').doc(uid).get();
        const data = userDoc.exists ? userDoc.data() : {};

        // 2. Prepare MongoDB User Data (Merges Auth + Firestore)
        const mongoUserData = {
          uid: uid,
          name: data?.name || userRecord.displayName || null,
          email: data?.email || userRecord.email || null,
          phone: data?.phone || userRecord.phoneNumber || null,
          phoneNumber: data?.phone || userRecord.phoneNumber || null,
          walletBalance: data?.walletBalance || 0,
          tags: data?.tags || [],
          authCreated: data?.authCreated || userRecord.metadata.creationTime || null,
          authLastSignIn: data?.authLastSignIn || userRecord.metadata.lastSignInTime || null,
          updatedAt: new Date(),
        };

        // 3. Sync to MongoDB
        await db.collection('users').updateOne(
          { uid: uid },
          { $set: mongoUserData },
          { upsert: true }
        );
        migratedCount++;

        // 4. Sync Addresses if profile exists
        if (userDoc.exists) {
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
      }
      
      nextPageToken = listUsersResult.pageToken;
    } while (nextPageToken);

    console.log(`[Migration] Finished. Total Auth Users: ${migratedCount}, Addresses: ${addressCount}`);
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
