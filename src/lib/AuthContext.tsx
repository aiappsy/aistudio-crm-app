import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { 
  auth, 
  db,
  signInWithGoogle as firebaseSignInWithGoogle, 
  signOut, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  updateProfile
} from './firebase';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: () => Promise<any>;
  signInWithEmail: (email: string, pass: string) => Promise<any>;
  signUpWithEmail: (email: string, pass: string, name: string) => Promise<any>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await saveUserToFirestore(user);
      }
      setUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const saveUserToFirestore = async (user: User) => {
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      const isSuperAdmin = user.email === "paljuritzen@gmail.com";
      const orgId = isSuperAdmin ? "admin-org" : `org-${user.uid}`;
      const defaultTier = isSuperAdmin ? 'enterprise' : 'free';
      
      // Create User
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        role: isSuperAdmin ? 'super_admin' : 'admin',
        organizationId: orgId,
        createdAt: serverTimestamp()
      });

      // Create Organization
      const orgRef = doc(db, 'organizations', orgId);
      await setDoc(orgRef, {
        name: isSuperAdmin ? "System Admin" : `${user.displayName || 'My'} Team`,
        ownerId: user.uid,
        tier: defaultTier,
        memberLimit: isSuperAdmin ? 9999 : 3,
        createdAt: serverTimestamp()
      });

      // Create default settings
      const settingsRef = doc(db, 'settings', user.uid);
      await setDoc(settingsRef, {
        companyName: isSuperAdmin ? "System Admin" : `${user.displayName || 'My'} Company`,
        email: user.email,
        tier: defaultTier,
        createdAt: serverTimestamp()
      });
    } else {
      // Auto-upgrade existing super admin to enterprise
      const userData = userSnap.data();
      const isActuallySuperAdmin = user.email === "paljuritzen@gmail.com" || userData.role === 'super_admin';
      
      if (isActuallySuperAdmin) {
        if (userData.role !== 'super_admin') {
          await setDoc(userRef, { role: 'super_admin' }, { merge: true });
        }
        
        const settingsRef = doc(db, 'settings', user.uid);
        const settingsSnap = await getDoc(settingsRef);
        if (!settingsSnap.exists() || settingsSnap.data().tier !== 'enterprise') {
          await setDoc(settingsRef, { 
            tier: 'enterprise',
            companyName: userData.displayName ? `${userData.displayName}'s Company` : "System Admin",
            email: userData.email
          }, { merge: true });
        }
        
        if (userData.organizationId) {
          const orgRef = doc(db, 'organizations', userData.organizationId);
          const orgSnap = await getDoc(orgRef);
          if (!orgSnap.exists() || orgSnap.data().tier !== 'enterprise') {
            await setDoc(orgRef, { tier: 'enterprise', memberLimit: 9999 }, { merge: true });
          }
        }
      }
    }
  };

  const signIn = async () => {
    const result = await firebaseSignInWithGoogle();
    await saveUserToFirestore(result.user);
    return result;
  };

  const signUpWithEmail = async (email: string, pass: string, name: string) => {
    const result = await createUserWithEmailAndPassword(auth, email, pass);
    await updateProfile(result.user, { displayName: name });
    await saveUserToFirestore(result.user);
    return result;
  };

  const signInWithEmail = (email: string, pass: string) => {
    return signInWithEmailAndPassword(auth, email, pass);
  };

  const value = {
    user,
    loading,
    signIn,
    signInWithEmail,
    signUpWithEmail,
    logout: signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
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
