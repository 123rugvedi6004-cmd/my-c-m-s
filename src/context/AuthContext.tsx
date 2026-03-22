import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { UserProfile } from '../types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isEditor: boolean;
  loginAsGuest: () => void;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    // 1. Check if guest session exists in local storage on mount
    const guestData = localStorage.getItem('guest_session');
    if (guestData) {
      try {
        const data = JSON.parse(guestData);
        setUser(data.user);
        setProfile(data.profile);
        setIsGuest(true);
        setLoading(false);
      } catch (err) {
        console.error('Failed to parse guest session:', err);
        localStorage.removeItem('guest_session');
      }
    }
  }, []);

  useEffect(() => {
    // 2. Auth listener
    if (isGuest) return;

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (!firebaseUser) {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, [isGuest]);

  useEffect(() => {
    // 3. Profile listener
    if (isGuest || !user?.uid) return;

    const userDocRef = doc(db, 'users', user.uid);
    const unsubscribeProfile = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setProfile(docSnap.data() as UserProfile);
        setLoading(false);
      } else {
        // Create initial profile if it doesn't exist
        const isDemo = user.email === 'demo@example.com';
        const emailPrefix = user.email ? user.email.split('@')[0] : 'user';
        const formattedName = emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
        
        const newProfile: Partial<UserProfile> = {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || (isDemo ? 'Demo User' : formattedName),
          photoURL: user.photoURL || (isDemo ? 'https://ui-avatars.com/api/?name=Demo+User&background=6366f1&color=fff' : `https://ui-avatars.com/api/?name=${formattedName}&background=6366f1&color=fff`),
          role: isDemo ? 'admin' : 'viewer',
          createdAt: serverTimestamp() as any,
        };
        
        setDoc(userDocRef, newProfile).catch(err => {
          handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
        });
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, `users/${user.uid}`);
    });

    return () => unsubscribeProfile();
  }, [user?.uid, isGuest]);

  const loginAsGuest = async () => {
    // Sign out from Firebase if logged in to avoid listener conflicts
    await auth.signOut();
    const guestUser = {
      uid: 'guest_user_123',
      email: 'guest@example.com',
      displayName: 'Guest Explorer',
      photoURL: 'https://ui-avatars.com/api/?name=Guest+Explorer&background=10b981&color=fff',
    } as User;

    const guestProfile: UserProfile = {
      uid: 'guest_user_123',
      email: 'guest@example.com',
      displayName: 'Guest Explorer',
      photoURL: 'https://ui-avatars.com/api/?name=Guest+Explorer&background=10b981&color=fff',
      role: 'admin', // Give guest admin rights to see everything
      createdAt: new Date().toISOString() as any,
      bio: 'I am exploring the platform as a guest.',
    };

    // Seed the database if it's empty so the guest has something to see
    try {
      const { seedDatabase } = await import('../lib/seedData');
      await seedDatabase();
    } catch (err) {
      console.error('Failed to seed database:', err);
    }

    localStorage.setItem('guest_session', JSON.stringify({ user: guestUser, profile: guestProfile }));
    setUser(guestUser);
    setProfile(guestProfile);
    setIsGuest(true);
    setLoading(false);
  };

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error('Google login error:', err);
      throw err;
    }
  };

  const logout = async () => {
    if (isGuest) {
      localStorage.removeItem('guest_session');
      setIsGuest(false);
      setUser(null);
      setProfile(null);
    } else {
      await auth.signOut();
    }
  };

  const value = {
    user,
    profile,
    loading,
    isAdmin: profile?.role === 'admin',
    isEditor: profile?.role === 'admin' || profile?.role === 'editor',
    loginAsGuest,
    loginWithGoogle,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
