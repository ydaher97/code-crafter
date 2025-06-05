
"use client";

import { useState, useEffect, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertCircle } from 'lucide-react';
import { AppHeader } from "@/components/layout/app-header";
import { AppFooter } from "@/components/layout/app-footer";


export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signInWithEmail, signUpWithEmail, authError, setAuthError, user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && user) {
      router.push('/'); // Redirect if already logged in
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (event: FormEvent, action: 'signIn' | 'signUp') => {
    event.preventDefault();
    setIsSubmitting(true);
    setAuthError(null);

    let result = null;
    if (action === 'signIn') {
      result = await signInWithEmail(email, password);
    } else {
      result = await signUpWithEmail(email, password);
    }

    if (result) {
      router.push('/'); // Redirect to dashboard on successful login/signup
    }
    setIsSubmitting(false);
  };
  
  if (authLoading) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading authentication status...</p>
      </div>
    );
  }
  
  if (user) return null; // Already handled by useEffect, but as a safeguard

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground font-body">
      <AppHeader />
      <main className="flex-grow container mx-auto px-4 py-8 flex flex-col items-center justify-center">
        <Card className="w-full max-w-md shadow-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-headline">Welcome Back!</CardTitle>
            <CardDescription className="text-lg">
              Sign in or create an account to continue.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            {authError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Authentication Error</AlertTitle>
                <AlertDescription>{authError}</AlertDescription>
              </Alert>
            )}
            <form className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                  required
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting}
                  required
                />
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button
              onClick={(e) => handleSubmit(e, 'signIn')}
              disabled={isSubmitting || !email || !password}
              className="w-full"
            >
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Sign In
            </Button>
            <Button
              variant="outline"
              onClick={(e) => handleSubmit(e, 'signUp')}
              disabled={isSubmitting || !email || !password}
              className="w-full"
            >
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Sign Up
            </Button>
          </CardFooter>
        </Card>
      </main>
      <AppFooter />
    </div>
  );
}
