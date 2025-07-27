
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User, GoogleAuthProvider, getAdditionalUserInfo, signInWithPopup } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { usePathname, useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  getAccessToken: (scope: string) => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType>({ 
    user: null, 
    loading: true, 
    getAccessToken: async () => null 
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!loading && !user && pathname !== '/login') {
      router.push('/login');
    }
  }, [user, loading, router, pathname]);

  const getAccessToken = async (scope: string): Promise<string | null> => {
    if (!auth.currentUser) return null;

    // This is a simplified check. In a real app, you would need to
    // store granted scopes and check if the new scope is already granted.
    // For this app, we will re-prompt for simplicity.
    
    const provider = new GoogleAuthProvider();
    provider.addScope(scope);

    try {
        const result = await signInWithPopup(auth, provider);
        const credential = GoogleAuthProvider.credentialFromResult(result);
        return credential?.accessToken || null;
    } catch(error) {
        console.error("Error getting access token:", error);
        return null;
    }
  }


  return <AuthContext.Provider value={{ user, loading, getAccessToken }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
