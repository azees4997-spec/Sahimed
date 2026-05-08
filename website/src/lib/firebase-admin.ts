import * as admin from 'firebase-admin';

export function getFirebaseAdmin() {
  if (admin.apps.length > 0) return admin.apps[0];

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  // STRATEGY: Try to initialize without explicit keys first.
  // On Firebase App Hosting / Cloud Run, this will automatically use the environment's default service account.
  try {
    if (!projectId && !clientEmail && !privateKey) {
      console.log("[Firebase Admin] Attempting automatic initialization...");
      return admin.initializeApp();
    }
  } catch (e) {
    console.warn("[Firebase Admin] Automatic initialization failed, falling back to explicit configuration.");
  }

  // Fallback: Require explicit keys if automatic init is not possible or failed.
  if (!projectId || !clientEmail || !privateKey) {
    const missing = [];
    if (!projectId) missing.push('FIREBASE_PROJECT_ID');
    if (!clientEmail) missing.push('FIREBASE_CLIENT_EMAIL');
    if (!privateKey) missing.push('FIREBASE_PRIVATE_KEY');
    
    throw new Error(`Firebase Admin Configuration Missing: ${missing.join(', ')}. Please configure these Environment Variables in your deployment platform (Vercel, Firebase App Hosting, etc.).`);
  }

  try {
    return admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  } catch (error: any) {
    console.error('[Firebase Admin Init Error]', error);
    throw new Error(`Firebase Admin Initialization Failed: ${error.message}`);
  }
}

export const getDbAdmin = () => {
  const app = getFirebaseAdmin();
  return (app as admin.app.App).firestore();
};

export const getAuthAdmin = () => {
  const app = getFirebaseAdmin();
  return (app as admin.app.App).auth();
};

/**
 * STABILIZATION: Use Proxies for db and auth to prevent build-time crashes
 * when environment variables are missing during static generation/prerendering.
 */
export const db: admin.firestore.Firestore = new Proxy({} as admin.firestore.Firestore, {
  get: (target, prop) => {
    const instance = getDbAdmin();
    return (instance as any)[prop];
  }
});

export const auth: admin.auth.Auth = new Proxy({} as admin.auth.Auth, {
  get: (target, prop) => {
    const instance = getAuthAdmin();
    return (instance as any)[prop];
  }
});
