import React, { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import {
  auth,
  db,
  signInWithGoogle as firebaseSignInWithGoogle,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "./firebase";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";

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

  const [hasSavedUser, setHasSavedUser] = useState(false);
  const saveInProgress = React.useRef(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        if (!hasSavedUser && !saveInProgress.current) {
          saveInProgress.current = true;
          try {
            await saveUserToFirestore(user);
            setHasSavedUser(true);
          } catch (error) {
            console.error("Failed to save user to Firestore on login:", error);
          } finally {
            saveInProgress.current = false;
          }
        }
      } else {
        setHasSavedUser(false);
        saveInProgress.current = false;
      }
      setUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, [hasSavedUser]);

  const saveUserToFirestore = async (user: User) => {
    try {
      console.log("Checking userRef...");
      const userRef = doc(db, "users", user.uid);

      let userSnap;
      try {
        userSnap = await getDoc(userRef);
      } catch (e) {
        console.error("Failed on getDoc(userRef)", e);
        // Do not throw, gracefully fallback
      }

      if (!userSnap || !userSnap.exists()) {
        const isSuperAdmin = user.email === "paljuritzen@gmail.com";
        const orgId = isSuperAdmin ? "admin-org" : `org-${user.uid}`;
        const defaultTier = isSuperAdmin ? "enterprise" : "free";

        console.log("Saving user doc...", {
          uid: user.uid,
          role: isSuperAdmin ? "super_admin" : "admin",
        });
        try {
          await setDoc(userRef, {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || null,
            photoURL: user.photoURL || null,
            role: isSuperAdmin ? "super_admin" : "admin",
            organizationId: orgId,
            aiTokens: isSuperAdmin ? 9999 : 30,
            createdAt: serverTimestamp(),
          });
        } catch (e) {
          console.error("Failed on setDoc(userRef)", e);
        }

        console.log("Saving org doc...", { orgId });
        try {
          const orgRef = doc(db, "organizations", orgId);
          await setDoc(orgRef, {
            name: isSuperAdmin
              ? "System Admin"
              : `${user.displayName || "My"} Team`,
            ownerId: user.uid,
            tier: defaultTier,
            memberLimit: isSuperAdmin ? 9999 : 3,
            createdAt: serverTimestamp(),
          });
        } catch (e) {
          console.error("Failed on setDoc(orgRef)", e);
        }

        console.log("Saving settings doc...");
        try {
          const settingsRef = doc(db, "settings", user.uid);
          await setDoc(settingsRef, {
            companyName: isSuperAdmin
              ? "System Admin"
              : `${user.displayName || "My"} Company`,
            email: user.email,
            tier: defaultTier,
            createdAt: serverTimestamp(),
          });
        } catch (e) {
          console.error("Failed on setDoc(settingsRef)", e);
        }
      } else {
        console.log(
          "User already exists, checking super_admin auto-upgrade...",
        );
        const userData = userSnap?.data() || {};
        const isActuallySuperAdmin =
          user.email === "paljuritzen@gmail.com" ||
          userData.role === "super_admin";

        if (isActuallySuperAdmin) {
          if (userData.role !== "super_admin") {
            console.log("Upgrading role to super_admin...");
            try {
              await setDoc(userRef, { role: "super_admin" }, { merge: true });
            } catch (e) {
              console.error("Failed on userRef upgrade", e);
            }
          }

          console.log("Fetching settingsRef...");
          try {
            const settingsRef = doc(db, "settings", user.uid);
            const settingsSnap = await getDoc(settingsRef);
            if (
              !settingsSnap.exists() ||
              settingsSnap.data().tier !== "enterprise"
            ) {
              console.log("Upgrading settings tier to enterprise...");
              await setDoc(
                settingsRef,
                {
                  tier: "enterprise",
                  companyName: userData.displayName
                    ? `${userData.displayName}'s Company`
                    : "System Admin",
                  email: userData.email,
                },
                { merge: true },
              );
            }
          } catch (e) {
            console.error("Failed on settingsRef upgrade", e);
          }

          if (userData.organizationId) {
            console.log("Fetching orgRef...");
            try {
              const orgRef = doc(db, "organizations", userData.organizationId);
              const orgSnap = await getDoc(orgRef);
              if (!orgSnap.exists() || orgSnap.data().tier !== "enterprise") {
                console.log("Upgrading org tier to enterprise...");
                await setDoc(
                  orgRef,
                  { tier: "enterprise", memberLimit: 9999 },
                  { merge: true },
                );
              }
            } catch (e) {
              console.error("Failed on orgRef upgrade", e);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error internally in saveUserToFirestore:", error);
    }
  };

  const signIn = async () => {
    const result = await firebaseSignInWithGoogle();
    return result;
  };

  const signUpWithEmail = async (email: string, pass: string, name: string) => {
    const result = await createUserWithEmailAndPassword(auth, email, pass);
    await updateProfile(result.user, { displayName: name });
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
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
