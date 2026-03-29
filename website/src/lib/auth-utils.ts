import { getAuthAdmin, getDbAdmin } from './firebase-admin';

/**
 * Verifies if the request is from a legitimate admin or pharmacist.
 * Checks the Authorization header for a Firebase ID Token.
 * 
 * @param request The incoming Next.js Request
 * @returns The user's UID and role if verified, otherwise throws an error.
 */
export async function verifyAdmin(request: Request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Unauthorized: Missing or invalid token');
  }

  const token = authHeader.split('Bearer ')[1];
  
  try {
    const authAdmin = getAuthAdmin();
    const dbAdmin = getDbAdmin();
    
    // 1. Verify the ID token using the Firebase Admin SDK
    const decodedToken = await authAdmin.verifyIdToken(token);
    const uid = decodedToken.uid;

    // 2. Fetch the admin profile from Firestore
    const adminSnap = await dbAdmin.collection('adminProfiles').doc(uid).get();
    
    if (!adminSnap.exists) {
      throw new Error('Forbidden: No administrative profile found');
    }

    const adminData = adminSnap.data();
    if (adminData?.role !== 'admin' && adminData?.role !== 'pharmacist' && adminData?.role !== 'sub-admin') {
      throw new Error('Forbidden: Insufficient clinical clearance');
    }

    return { uid, role: adminData.role, email: decodedToken.email };
  } catch (error: any) {
    console.warn(`[Auth Security] Verification failed: ${error.message}`);
    throw new Error(error.message || 'Unauthorized access attempt');
  }
}
