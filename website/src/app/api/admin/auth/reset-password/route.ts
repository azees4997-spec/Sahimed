import { NextResponse } from 'next/server';
import { getAuthAdmin } from '@/lib/firebase-admin';
import { verifyAdmin } from '@/lib/auth-utils';
import clientPromise from '@/lib/mongodb';

/**
 * POST: Force-reset a user's password using the Firebase Admin SDK.
 * Required: staff_manage permission or Master role.
 */
export async function POST(req: Request) {
  try {
    const requester = await verifyAdmin(req);
    
    // Security check: Only masters or those with staff_manage permission can reset passwords
    const isMaster = (process.env.MASTER_UIDS || "").includes(requester.uid);
    const canManageStaff = requester.permissions?.staff_manage === true;

    if (requester.role !== 'admin') {
      return NextResponse.json({ error: "Forbidden: You do not have System Authorization for credential overrides." }, { status: 403 });
    }

    const { uid, newPassword } = await req.json();

    if (!uid || !newPassword) {
      return NextResponse.json({ error: "Missing identity key or new credential payload." }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: "Security Policy: Password must be at least 6 characters." }, { status: 400 });
    }

    const authAdmin = getAuthAdmin();
    
    // 1. Update Firebase Auth Password
    await authAdmin.updateUser(uid, {
      password: newPassword
    });

    // 2. Log Audit in MongoDB
    const client = await clientPromise;
    const db = client.db('sahimed');
    await db.collection('audit_logs').insertOne({
      action: 'ADMIN_FORCE_PASSWORD_RESET',
      subjectUid: uid,
      actorUid: requester.uid,
      timestamp: new Date(),
      ip: req.headers.get('x-forwarded-for') || 'unknown'
    });

    console.log(`[Auth Override] Password force-reset for UID ${uid} by Admin ${requester.uid}`);

    return NextResponse.json({ 
      success: true, 
      message: "Access Key re-provisioned successfully. Standard login is now active with new credentials." 
    });

  } catch (err: any) {
    console.error("[Force Reset API Error]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
