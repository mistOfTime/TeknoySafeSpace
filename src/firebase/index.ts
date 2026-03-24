'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

/**
 * Initializes Firebase SDKs safely for both client and build-time environments.
 */
export function initializeFirebase() {
  if (typeof window === 'undefined') {
    return { firebaseApp: null, auth: null, firestore: null };
  }

  const apps = getApps();
  if (apps.length > 0) {
    return getSdks(apps[0]);
  }

  // Validate critical configuration fields
  const { apiKey, projectId, appId, messagingSenderId, authDomain } = firebaseConfig;
  
  const missingFields = [];
  if (!apiKey || apiKey === 'undefined' || apiKey === '') missingFields.push('API_KEY');
  if (!projectId || projectId === 'projectId' || projectId === 'undefined' || projectId === '') missingFields.push('PROJECT_ID');
  if (!appId || appId === 'undefined' || appId === '') missingFields.push('APP_ID');
  if (!messagingSenderId || messagingSenderId === 'undefined' || messagingSenderId === '') missingFields.push('MESSAGING_SENDER_ID');
  if (!authDomain || authDomain === 'undefined' || authDomain === '') missingFields.push('AUTH_DOMAIN');

  if (missingFields.length > 0) {
    console.error("❌ Firebase configuration is incomplete. Missing:", missingFields.join(', '));
    console.warn("👉 Action Required: Check your Vercel Environment Variables and REDEPLOY.");
    return { firebaseApp: null, auth: null, firestore: null };
  }

  try {
    const firebaseApp = initializeApp(firebaseConfig);
    
    // Detailed Debug Logs for Developer Console
    console.group("🔥 Firebase Client Initialization");
    console.log("Project ID:", projectId);
    console.log("API Key Found:", !!apiKey);
    console.log("Auth Domain:", authDomain);
    console.log("App ID:", appId);
    console.log("Website Origin:", window.location.origin);
    console.log("💡 Tip: If you get 'auth/configuration-not-found', verify both the Identity Toolkit API AND the Email/Password sign-in method are enabled.");
    console.groupEnd();
    
    const auth = getAuth(firebaseApp);
    return {
      firebaseApp,
      auth,
      firestore: getFirestore(firebaseApp)
    };
  } catch (error) {
    console.error("❌ Firebase initialization failed:", error);
    return { firebaseApp: null, auth: null, firestore: null };
  }
}

/**
 * Retrieves the core Firebase service instances.
 */
export function getSdks(firebaseApp: FirebaseApp) {
  if (!firebaseApp) {
    return { firebaseApp: null, auth: null, firestore: null };
  }

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
