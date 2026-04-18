import { jwtVerify, createRemoteJWKSet } from 'jose';
import clientPromise from './mongodb';

// Firebase Remote JWK Set for ID Token verification
const JWKS = createRemoteJWKSet(
  new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com')
);

/**
 * Verifies the Firebase ID token and returns the user's UID and email.
 * Does NOT check for administrative privileges.
 */
export async function verifyAuth(request: Request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Unauthorized: Missing or invalid token');
  }

  const token = authHeader.split('Bearer ')[1];
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || "studio-9756314138-8403b";

  if (!projectId) {
    throw new Error('Server Configuration Error: Missing Project ID');
  }

  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
    });

    const uid = payload.sub;
    const email = payload.email as string;

    if (!uid) throw new Error('Invalid token payload: missing sub');

    return { uid, email };
  } catch (error: any) {
    throw new Error(error.message || 'Unauthorized access attempt');
  }
}

/**
 * Verifies if the request is from a legitimate admin or pharmacist.
 * Uses manual JWT verification to remove dependency on Firebase Admin SDK (Service Account).
 * Checks the 'adminProfiles' collection in MongoDB for authorization.
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
  
  // Use public or private project ID env, with hardcoded fallback for robustness
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || "studio-9756314138-8403b";

  if (!projectId) {
    console.error('[Auth Error] FIREBASE_PROJECT_ID is missing from environment.');
    throw new Error('Server Configuration Error: Missing Project ID');
  }

  try {
    const { uid, email } = await verifyAuth(request);

    // 1.5 MASTER UID OVERRIDE: Always allow these UIDs (Owner)
    const MASTER_UIDS = (process.env.MASTER_UIDS || "BM9HheYflheT0Wyj6olaEnyCAHl1,RzB6nqlQumg1VEniFcZrgbcDdRA2").split(',');
    if (uid && MASTER_UIDS.includes(uid)) {
      return { uid, role: 'admin', email };
    }

    // 2. Fetch the admin profile from MongoDB instead of Firestore
    const client = await clientPromise;
    const db = client.db('sahimed');
    
    // Look for matching UID or Email in adminProfiles
    const adminProfile = await db.collection('adminProfiles').findOne({ 
      $or: [
        { uid: uid },
        { id: uid },
        { email: email }
      ]
    });
    
    if (!adminProfile) {
      console.warn(`[Auth Security] Forbidden: No MongoDB admin profile found for UID: ${uid}`);
      throw new Error('Forbidden: No administrative profile found in MongoDB');
    }

    const { role } = adminProfile;
    if (!['admin', 'pharmacist', 'sub-admin'].includes(role)) {
      throw new Error('Forbidden: Insufficient clinical clearance');
    }

    return { uid, role, email };
  } catch (error: any) {
    console.warn(`[Auth Security] Verification failed: ${error.message}`);
    throw new Error(error.message || 'Unauthorized access attempt');
  }
}
