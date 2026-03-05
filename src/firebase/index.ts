'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore'

interface FirebaseSdks {
  firebaseApp: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
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
    try {
      // First attempt: environment-based initialization
      firebaseApp = initializeApp();
    } catch (e) {
      // Fallback: explicit config object
      firebaseApp = initializeApp(firebaseConfig);
    }
  } else {
    firebaseApp = getApp();
  }

  const sdks: FirebaseSdks = {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp)
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
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp)
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
