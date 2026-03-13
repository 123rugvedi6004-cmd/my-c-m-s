import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
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
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    // Check if guest session exists in local storage
    const guestData = localStorage.getItem('guest_session');
    if (guestData) {
      const data = JSON.parse(guestData);
      setUser(data.user);
      setProfile(data.profile);
      setIsGuest(true);
      setLoading(false);
      return;
    }

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (isGuest) return; // Don't override guest session

      setUser(firebaseUser);
      
      if (firebaseUser) {
        // Listen to profile changes
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        
        const unsubscribeProfile = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            setProfile(docSnap.data() as UserProfile);
            setLoading(false);
          } else {
            // Create initial profile if it doesn't exist
            const isDemo = firebaseUser.email === 'demo@example.com';
            const newProfile: Partial<UserProfile> = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || (isDemo ? 'Demo User' : 'New User'),
              photoURL: firebaseUser.photoURL || (isDemo ? 'https://ui-avatars.com/api/?name=Demo+User&background=6366f1&color=fff' : null),
              role: isDemo ? 'admin' : 'viewer', // Demo user is admin
              createdAt: serverTimestamp() as any,
            };
            
            console.log('Creating initial profile for user:', firebaseUser.uid, newProfile);
            setDoc(userDocRef, newProfile).catch(err => {
              handleFirestoreError(err, OperationType.WRITE, `users/${firebaseUser.uid}`);
            });
            // Profile will be set by the next snapshot
          }
        }, (err) => {
          handleFirestoreError(err, OperationType.GET, `users/${firebaseUser.uid}`);
        });

        return () => unsubscribeProfile();
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, [isGuest]);

  const loginAsGuest = async () => {
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
