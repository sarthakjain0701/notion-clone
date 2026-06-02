import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile as firebaseUpdateProfile,
  type User,
} from 'firebase/auth';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from './config';
import type { UserProfile } from '@/lib/types';

/**
 * Register a new user with email and password
 */
export async function signUp(
  email: string,
  password: string,
  displayName: string
): Promise<User> {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // Update Firebase Auth profile
  await firebaseUpdateProfile(user, { displayName });

  // Create Firestore user profile
  const userProfile: UserProfile = {
    uid: user.uid,
    email: user.email!,
    displayName,
    photoURL: null,
    role: 'member',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    settings: {
      theme: 'system',
    },
  };

  await setDoc(doc(db, 'users', user.uid), userProfile);

  return user;
}

/**
 * Sign in with email and password
 */
export async function signIn(email: string, password: string): Promise<User> {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
}

/**
 * Sign out current user
 */
export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

/**
 * Send password reset email
 */
export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

/**
 * Update user profile in both Firebase Auth and Firestore
 */
export async function updateUserProfile(
  uid: string,
  data: Partial<Pick<UserProfile, 'displayName' | 'photoURL' | 'settings'>>
): Promise<void> {
  const updates: Record<string, unknown> = {
    ...data,
    updatedAt: Timestamp.now(),
  };

  await setDoc(doc(db, 'users', uid), updates, { merge: true });

  // Also update Firebase Auth profile if display name changed
  if (data.displayName && auth.currentUser) {
    await firebaseUpdateProfile(auth.currentUser, {
      displayName: data.displayName,
    });
  }
}
