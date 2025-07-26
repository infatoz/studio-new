
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { useAuth } from '@/contexts/auth-context';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/icons';

function GoogleIcon() {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px">
        <path fill="#4285F4" d="M44 24c0-1.6-.1-3.2-.4-4.7H24v8.9h11.2c-.5 2.8-2 5.2-4.2 6.8v5.7h7.3c4.3-4 6.9-9.8 6.9-16.7z" />
        <path fill="#34A853" d="M24 44c6.5 0 12-2.2 16-5.8l-7.3-5.7c-2.1 1.4-4.8 2.3-7.7 2.3-5.9 0-11-4-12.8-9.3H4.4v5.9C8.3 39.7 15.5 44 24 44z" />
        <path fill="#FBBC05" d="M11.2 28.7c-.3-1-.5-2-.5-3s.2-2 .5-3V16.9H4.4c-1.8 3.6-2.8 7.7-2.8 12s1 8.4 2.8 12l6.8-5.8z" />
        <path fill="#EA4335" d="M24 10.7c3.5 0 6.6 1.2 9.1 3.6l6.5-6.5C36 2.2 30.5 0 24 0 15.5 0 8.3 4.3 4.4 11.1l6.8 5.8c1.8-5.3 6.9-9.2 12.8-9.2z" />
      </svg>
    );
  }

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/');
    }
  }, [user, loading, router]);

  const handleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      router.push('/');
    } catch (error) {
      console.error('Error signing in with Google', error);
    }
  };

  if (loading || user) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Logo className="size-12 text-primary" />
          </div>
          <CardTitle className="text-2xl">Welcome to Sahayak AI</CardTitle>
          <CardDescription>
            Your AI-powered teaching assistant. Please sign in to continue.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleSignIn} className="w-full">
            <GoogleIcon />
            <span>Sign in with Google</span>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
