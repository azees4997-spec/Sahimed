
'use client';

import React, { DependencyList, createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Auth, User, onAuthStateChanged } from 'firebase/auth';
import { Functions } from 'firebase/functions';
import { FirebaseStorage } from 'firebase/storage';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener'

interface FirebaseProviderProps {
  children: ReactNode;
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
  functions: Functions;
  storage: FirebaseStorage;
}

// Internal state for user authentication
interface UserAuthState {
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

// Combined state for the Firebase context
export interface FirebaseContextState {
  areServicesAvailable: boolean; // True if core services (app, firestore, auth instance) are provided
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null; // The Auth service instance
  functions: Functions | null;
  storage: FirebaseStorage | null;
  // User authentication state
  user: User | null;
  isUserLoading: boolean; // True during initial auth check
  userError: Error | null; // Error from auth listener
}

// Return type for useFirebase()
export interface FirebaseServicesAndUser {
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
  functions: Functions;
  storage: FirebaseStorage;
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

// React Context
export const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

/**
 * FirebaseProvider manages and provides Firebase services and user authentication state.
 */
export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({
  children,
  firebaseApp,
  firestore,
  auth,
  functions,
  storage,
}) => {
  const [userAuthState, setUserAuthState] = useState<UserAuthState>({
    user: null,
    isUserLoading: true, // Start loading until first auth event
    userError: null,
  });

  // Effect to subscribe to Firebase auth state changes
  useEffect(() => {
    if (!auth) { 
      setUserAuthState({ user: null, isUserLoading: false, userError: new Error("Auth service not provided.") });
      return;
    }

    const unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser) => {
        setUserAuthState({ user: firebaseUser, isUserLoading: false, userError: null });
      },
      (error) => {
        console.error("FirebaseProvider: onAuthStateChanged error:", error);
        setUserAuthState({ user: null, isUserLoading: false, userError: error });
      }
    );
    return () => unsubscribe();
  }, [auth]);

  /**
   * REAL-TIME DATA BRIDGE: Direct Auth Integration
   * This hook ensures every Auth user has a corresponding Firestore profile.
   * It syncs Auth Metadata (Created, Signed In) to Firestore for the Patient Registry.
   */
  useEffect(() => {
    const syncUserProfile = async () => {
      if (userAuthState.user && firestore) {
        const { user } = userAuthState;
        const profileRef = doc(firestore, 'userProfiles', user.uid);
        
        try {
          const snap = await getDoc(profileRef);
          
          // Capture raw Auth metadata for Registry visibility
          const baseData = {
            id: user.uid,
            firebaseAuthId: user.uid,
            email: user.email || null,
            phone: user.phoneNumber || null,
            authCreated: user.metadata.creationTime || null,
            authLastSignIn: user.metadata.lastSignInTime || null,
            updatedAt: serverTimestamp() 
          };

          if (!snap.exists()) {
            // First-time sync for shadow document creation
            await setDoc(profileRef, {
              ...baseData,
              name: user.displayName || null, 
              createdAt: serverTimestamp() 
            }, { merge: true });
          } else {
            // Heartbeat update for Last Activity tracking
            await setDoc(profileRef, baseData, { merge: true });
          }
        } catch (e) {
          console.error("Clinical Bridge Sync Failure:", e);
        }
      }
    };

    if (!userAuthState.isUserLoading) {
      syncUserProfile();
    }
  }, [userAuthState.user, userAuthState.isUserLoading, firestore]);

  const contextValue = useMemo((): FirebaseContextState => {
    const servicesAvailable = !!(firebaseApp && firestore && auth && functions && storage);
    return {
      areServicesAvailable: servicesAvailable,
      firebaseApp: servicesAvailable ? firebaseApp : null,
      firestore: servicesAvailable ? firestore : null,
      auth: servicesAvailable ? auth : null,
      functions: servicesAvailable ? functions : null,
      storage: servicesAvailable ? storage : null,
      user: userAuthState.user,
      isUserLoading: userAuthState.isUserLoading,
      userError: userAuthState.userError,
    };
  }, [firebaseApp, firestore, auth, functions, storage, userAuthState]);

  return (
    <FirebaseContext.Provider value={contextValue}>
      <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = (): FirebaseServicesAndUser => {
  const context = useContext(FirebaseContext);
  if (context === undefined) throw new Error('useFirebase must be used within a FirebaseProvider.');
  if (!context.areServicesAvailable || !context.firebaseApp || !context.firestore || !context.auth || !context.functions || !context.storage) {
    throw new Error('Firebase core services not available.');
  }
  return {
    firebaseApp: context.firebaseApp,
    firestore: context.firestore,
    auth: context.auth,
    functions: context.functions,
    storage: context.storage,
    user: context.user,
    isUserLoading: context.isUserLoading,
    userError: context.userError,
  };
};

export const useAuth = (): Auth => useFirebase().auth;
export const useFirestore = (): Firestore => useFirebase().firestore;
export const useStorage = (): FirebaseStorage => useFirebase().storage;
export const useFunctions = (): Functions => useFirebase().functions;
export const useFirebaseApp = (): FirebaseApp => useFirebase().firebaseApp;

export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T & {__memo?: boolean} {
  const memoized = useMemo(factory, deps);
  if(typeof memoized !== 'object' || memoized === null) return memoized as any;
  (memoized as any).__memo = true;
  return memoized as any;
}

export const useUser = () => { 
  const { user, isUserLoading, userError } = useFirebase();
  return { user, isUserLoading, userError };
};
