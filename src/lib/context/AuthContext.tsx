'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';
import {
  signUp as firebaseSignUp,
  signIn as firebaseSignIn,
  signOut as firebaseSignOut,
  resetPassword as firebaseResetPassword,
} from '@/lib/firebase/auth';
import { getUserWorkspaces, createWorkspace } from '@/lib/firebase/firestore';
import type { UserProfile, Workspace } from '@/lib/types';

interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: User | null;
  workspace: Workspace | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        setFirebaseUser(fbUser);

        // Fetch user profile from Firestore
        let userDoc = await getDoc(doc(db, 'users', fbUser.uid));
        
        // Handle race condition during sign up: Firebase Auth triggers this listener 
        // immediately, often before our signUp function finishes writing the Firestore doc.
        if (!userDoc.exists()) {
          await new Promise(resolve => setTimeout(resolve, 800));
          userDoc = await getDoc(doc(db, 'users', fbUser.uid));
        }

        if (userDoc.exists()) {
          setUser(userDoc.data() as UserProfile);
        } else {
          // Fallback if doc still doesn't exist
          console.error("User document not found after retry");
        }

        // Fetch or create workspace
        const workspaces = await getUserWorkspaces(fbUser.uid);
        if (workspaces.length > 0) {
          setWorkspace(workspaces[0]);
        } else {
          // Create default workspace for new users
          const newWorkspace = await createWorkspace('My Workspace', fbUser.uid);
          setWorkspace(newWorkspace);
        }
      } else {
        setFirebaseUser(null);
        setUser(null);
        setWorkspace(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, displayName: string) => {
    await firebaseSignUp(email, password, displayName);
  };

  const signIn = async (email: string, password: string) => {
    await firebaseSignIn(email, password);
  };

  const signOut = async () => {
    await firebaseSignOut();
  };

  const resetPassword = async (email: string) => {
    await firebaseResetPassword(email);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        workspace,
        loading,
        signUp,
        signIn,
        signOut,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
