import * as admin from 'firebase-admin';

export function getFirebaseAdmin() {
  if (!admin.apps.length) {
    if (!process.env.FIREBASE_PROJECT_ID) {
      console.warn('Firebase Admin skipped: missing project ID env (expected during build/static-export).');
    } else {
      try {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          }),
        });
      } catch (error) {
        console.error('Firebase admin initialization error', error);
      }
    }
  }
  return admin;
}

export const getDbAdmin = () => getFirebaseAdmin().firestore();
export const getAuthAdmin = () => getFirebaseAdmin().auth();
