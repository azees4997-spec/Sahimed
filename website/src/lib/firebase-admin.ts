import * as admin from 'firebase-admin';

export function getFirebaseAdmin() {
  if (admin.apps.length > 0) return admin.apps[0];

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  // STRATEGY: Try to initialize without explicit keys first (GCP/Firebase App Hosting)
  // Only attempt automatic init if we have at least the Project ID or we are NOT in build phase
  try {
    if (!projectId && !clientEmail && !privateKey) {
      // In Vercel/Next build phase, admin.initializeApp() without args often fails cryptically
      if (process.env.NEXT_PHASE === 'phase-production-build') {
        console.warn("[Firebase Admin] Build phase detected without credentials. Skipping automatic init.");
        return null;
      }
      return admin.initializeApp();
    }
  } catch (e) {
    // Automatic init failed
  }

  // Fallback: Check for explicit keys
  if (!projectId || !clientEmail || !privateKey) {
    console.warn("[Firebase Admin] Configuration missing. Some features will be disabled.");
    return null;
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
    return null;
  }
}

export const getDbAdmin = () => {
  const app = getFirebaseAdmin();
  return app ? (app as admin.app.App).firestore() : null;
};

export const getAuthAdmin = () => {
  const app = getFirebaseAdmin();
  return app ? (app as admin.app.App).auth() : null;
};

/**
 * STABILIZATION: Use Proxies for db and auth to prevent build-time crashes.
 * If the Admin SDK is not initialized, these will return a mock object 
 * to prevent immediate crashes, though operations will still fail.
 */
export const db: admin.firestore.Firestore = new Proxy({} as admin.firestore.Firestore, {
  get: (target, prop) => {
    const instance = getDbAdmin();
    if (!instance) {
      throw new Error("Firebase Firestore Admin accessed but not configured.");
    }
    return (instance as any)[prop];
  }
});

export const auth: admin.auth.Auth = new Proxy({} as admin.auth.Auth, {
  get: (target, prop) => {
    const instance = getAuthAdmin();
    if (!instance) {
      throw new Error("Firebase Auth Admin accessed but not configured.");
    }
    return (instance as any)[prop];
  }
});
