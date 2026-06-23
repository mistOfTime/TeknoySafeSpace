'use client';
import {
  Auth,
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  confirmPasswordReset,
  ActionCodeSettings,
  UserCredential,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';

/** Initiate anonymous sign-in (returns promise for better error handling in UI). */
export function initiateAnonymousSignIn(authInstance: Auth): Promise<UserCredential> {
  return signInAnonymously(authInstance);
}

/** Initiate email/password sign-up (returns promise for better error handling in UI). */
export function initiateEmailSignUp(authInstance: Auth, email: string, password: string): Promise<UserCredential> {
  return createUserWithEmailAndPassword(authInstance, email, password);
}

/** Initiate email/password sign-in (returns promise for better error handling in UI). */
export function initiateEmailSignIn(authInstance: Auth, email: string, password: string): Promise<UserCredential> {
  return signInWithEmailAndPassword(authInstance, email, password);
}

/** Initiate Google sign-in using a popup. */
export function initiateGoogleSignIn(authInstance: Auth): Promise<UserCredential> {
  const provider = new GoogleAuthProvider();
  return signInWithPopup(authInstance, provider);
}

/** Send password reset email with optional settings for "Continue URL". */
export async function initiatePasswordResetEmail(
  authInstance: Auth, 
  email: string,
  settings?: ActionCodeSettings
): Promise<void> {
  return sendPasswordResetEmail(authInstance, email, settings);
}

/** Confirm password reset with code. */
export async function confirmPasswordResetWithCode(authInstance: Auth, code: string, newPw: string): Promise<void> {
  return confirmPasswordReset(authInstance, code, newPw);
}
