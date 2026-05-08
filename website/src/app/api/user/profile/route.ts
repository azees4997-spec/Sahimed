
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyAuth } from '@/lib/auth-utils';

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
        isNewUser: true
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
      updatedAt: mongoUser.updatedAt
    });
  } catch (err: any) {
    console.error("[User Profile API Error]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
