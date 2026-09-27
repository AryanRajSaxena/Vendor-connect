'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { TrendingUp, AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuthUser } = useAuth();
  const [statusMessage, setStatusMessage] = useState('Verifying your Google account...');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function handleAuthCallback() {
      try {
        // 1. Check for error parameters returned from OAuth provider
        const errorDesc = searchParams.get('error_description') || searchParams.get('error');
        if (errorDesc) {
          throw new Error(errorDesc);
        }

        const code = searchParams.get('code');
        const roleParam = searchParams.get('role');

        // 2. Exchange code for session if PKCE code is present
        if (code) {
          setStatusMessage('Exchanging authorization code...');
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            console.warn('exchangeCodeForSession warning:', exchangeError.message);
          }
        }

        // 3. Retrieve user from session
        setStatusMessage('Retrieving user profile...');
        let authUser = null;

        const { data: userData } = await supabase.auth.getUser();
        authUser = userData?.user;

        if (!authUser) {
          const { data: sessionData } = await supabase.auth.getSession();
          authUser = sessionData?.session?.user || null;
        }

        if (!authUser || !authUser.email) {
          throw new Error('Google authorization completed, but no authenticated user or email was found.');
        }

        // 4. Synchronize with public.users via backend API
        setStatusMessage('Finalizing your account setup...');
        const fullName =
          authUser.user_metadata?.full_name ||
          authUser.user_metadata?.name ||
          authUser.user_metadata?.user_name ||
          '';
        const avatarUrl =
          authUser.user_metadata?.avatar_url ||
          authUser.user_metadata?.picture ||
          '';

        const syncResponse = await fetch('/api/auth/google-sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: authUser.email,
            name: fullName,
            avatar: avatarUrl,
            role: roleParam || undefined,
            supabaseUid: authUser.id,
          }),
        });

        if (!syncResponse.ok) {
          const errData = await syncResponse.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to synchronize account information.');
        }

        const appUser = await syncResponse.json();

        // 5. Store user in auth context and localStorage
        setAuthUser(appUser);
        setStatusMessage('Success! Redirecting to your dashboard...');

        // 6. Redirect to role dashboard
        const redirectPath = getRolePath(appUser.role);
        setTimeout(() => {
          if (isMounted) {
            window.location.href = redirectPath;
          }
        }, 300);
      } catch (err: any) {
        console.error('OAuth callback error:', err);
        if (isMounted) {
          setErrorMessage(err.message || 'An unexpected error occurred during Google sign in.');
        }
      }
    }

    handleAuthCallback();

    return () => {
      isMounted = false;
    };
  }, [searchParams, router, setAuthUser]);

  const getRolePath = (userRole: string): string => {
    switch (userRole) {
      case 'vendor':
        return '/vendor/dashboard';
      case 'seller':
        return '/seller/dashboard';
      case 'admin':
        return '/admin/dashboard';
      default:
        return '/products';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
      <Link href="/" className="inline-flex items-center gap-2 mb-8">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
          <TrendingUp className="w-7 h-7 text-white" />
        </div>
        <span className="text-2xl font-bold text-white">Agent Croww</span>
      </Link>

      <div className="w-full max-w-md bg-slate-900/80 border border-slate-800 rounded-2xl p-8 backdrop-blur-sm shadow-2xl">
        {errorMessage ? (
          <div className="space-y-6">
            <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto text-red-400">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white mb-2">Sign In Failed</h2>
              <p className="text-sm text-red-300 leading-relaxed bg-red-950/40 border border-red-900/50 rounded-xl p-3">
                {errorMessage}
              </p>
            </div>
            <div className="space-y-3 pt-2">
              <Link
                href="/auth/login"
                className="w-full py-3 px-4 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-violet-600/20"
              >
                <ArrowLeft className="w-4 h-4" />
                Return to Sign In
              </Link>
              <Link
                href="/"
                className="block text-sm text-slate-400 hover:text-slate-300 transition-colors"
              >
                Go to Home
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
              <div className="w-16 h-16 rounded-full border-4 border-violet-500/20 border-t-violet-500 animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-violet-500/10"></div>
              </div>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white mb-2">Connecting Account</h2>
              <p className="text-sm text-slate-400">{statusMessage}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-violet-500/20 border-t-violet-500 rounded-full animate-spin"></div>
        </div>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}
