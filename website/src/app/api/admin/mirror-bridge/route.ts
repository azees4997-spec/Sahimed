import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyAdmin } from '@/lib/auth-utils';

export async function POST(req: Request) {
  try {
    await verifyAdmin(req);
    const body = await req.json();
    const { user, addresses } = body;

    if (!user || !user.id) {
      return NextResponse.json({ error: "Invalid user data" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('sahimed');

    // 1. Mirror Profile
    const mongoUserData = {
      uid: user.id,
      name: user.name || null,
      email: user.email || null,
      phone: user.phone || null,
      phoneNumber: user.phone || null,
      walletBalance: user.walletBalance || 0,
      tags: user.tags || [],
      authCreated: user.authCreated || null,
      authLastSignIn: user.authLastSignIn || null,
      updatedAt: new Date(),
    };

    await db.collection('users').updateOne(
      { uid: user.id },
      { $set: mongoUserData },
      { upsert: true }
    );

    // 2. Mirror Addresses
    if (addresses && Array.isArray(addresses)) {
      for (const addr of addresses) {
        const addressData = {
          ...addr,
          userId: user.id,
          phoneNumber: mongoUserData.phoneNumber,
          firestoreId: addr.id,
          updatedAt: new Date(),
        };

        await db.collection('addresses').updateOne(
          { firestoreId: addr.id },
          { $set: addressData },
          { upsert: true }
        );
      }
    }

    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error("[Mirror Bridge API Error]", err);
    const status = err.message?.includes('Unauthorized') || err.message?.includes('Forbidden') ? 401 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}
