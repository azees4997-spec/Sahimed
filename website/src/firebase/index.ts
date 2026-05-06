'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, initializeFirestore, Firestore, memoryLocalCache } from 'firebase/firestore'
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getFunctions, Functions } from 'firebase/functions';

interface FirebaseSdks {
  firebaseApp: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
  storage: FirebaseStorage;
  functions: Functions;
}

/**
 * Persists the SDK instances globally on the window object to survive 
 * module re-evaluations during hot module replacement (HMR) in development.
 */
declare global {
  interface Window {
    __sahimedFirebaseSdks?: FirebaseSdks;
  }
}

let cachedSdks: FirebaseSdks | null = null;

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase(): FirebaseSdks {
  // Check if we already have initialized SDKs in this window session
  if (typeof window !== 'undefined' && window.__sahimedFirebaseSdks) {
    return window.__sahimedFirebaseSdks;
  }

  if (cachedSdks) return cachedSdks;

  let firebaseApp: FirebaseApp;
  const existingApps = getApps();

  if (!existingApps.length) {
    firebaseApp = initializeApp(firebaseConfig);
  } else {
    firebaseApp = getApp();
  }

  // Use initializeFirestore instead of getFirestore for better reliability in Next.js/HMR
  let firestore: Firestore;
  try {
    firestore = initializeFirestore(firebaseApp, {
      // Use memory cache during development/HMR to avoid the "mutations" assertion error
      // in Firebase 11.x
      localCache: memoryLocalCache()
    });
  } catch (e) {
    // If already initialized, get current instance
    firestore = getFirestore(firebaseApp);
  }

  const sdks: FirebaseSdks = {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore,
    storage: getStorage(firebaseApp),
    functions: getFunctions(firebaseApp)
  };

  cachedSdks = sdks;
  
  if (typeof window !== 'undefined') {
    window.__sahimedFirebaseSdks = sdks;
  }

  return sdks;
}

/**
 * Returns SDK instances for a given Firebase app.
 * Used internally by initializeFirebase.
 */
export function getSdks(firebaseApp: FirebaseApp): FirebaseSdks {
  let firestore: Firestore;
  try {
    firestore = initializeFirestore(firebaseApp, {
      localCache: memoryLocalCache()
    });
  } catch (e) {
    firestore = getFirestore(firebaseApp);
  }

  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore,
    storage: getStorage(firebaseApp),
    functions: getFunctions(firebaseApp)
  };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
