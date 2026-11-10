'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { TrendingUp, Zap, Shield, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const { signInWithGoogle } = useAuth();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleSignIn = async () => {
    setError('');
    setIsGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setError(err.message || 'Failed to initiate Google sign in');
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col lg:flex-row">
      {/* Left Side - Value Proposition & Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 flex-col justify-between p-12 relative overflow-hidden border-r border-slate-800/60">
        {/* Glow decorations */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl -mr-48 -mt-48 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -ml-48 -mb-48 pointer-events-none" />

        {/* Brand header */}
        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-3 mb-12 group">
            <div className="w-11 h-11 rounded-xl overflow-hidden ring-1 ring-primary-200/60 shadow-md group-hover:scale-105 transition-transform flex items-center justify-center">
              <img src="/images/icon.jpeg" alt="Agent Croww" className="w-11 h-11 object-cover" />
            </div>
            <span className="brand-text text-2xl text-white">Agent Croww</span>
          </Link>

          <div className="space-y-6 max-w-lg">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 mb-4">
                <Shield className="w-3.5 h-3.5" /> Fast & Secure Authentication
              </span>
              <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight leading-tight mb-4">
                Welcome back to your workspace.
              </h1>
              <p className="text-base text-slate-300 leading-relaxed">
                One-click sign in with Google connects you directly to your vendor or seller dashboard without managing separate passwords.
              </p>
            </div>

            {/* Feature Highlights */}
            <div className="space-y-4 pt-6 border-t border-slate-800">
              <div className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Zap className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">Instant Dashboard Sync</p>
                  <p className="text-xs text-slate-400 mt-0.5">Automated role detection routes you to your earnings, products, and fulfillment.</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-lg bg-violet-500/15 border border-violet-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <TrendingUp className="w-4 h-4 text-violet-400" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">Real-time Commissions</p>
                  <p className="text-xs text-slate-400 mt-0.5">Live tracking for affiliate seller conversions and course payouts.</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-lg bg-sky-500/15 border border-sky-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Shield className="w-4 h-4 text-sky-400" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">Google Protected Security</p>
                  <p className="text-xs text-slate-400 mt-0.5">Protected with industry-standard OAuth 2.0 and enterprise SSL encryption.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Trust Note */}
        <div className="relative z-10 pt-6">
          <p className="text-xs text-slate-500">
            Trusted by vendors & affiliate creators across India.
          </p>
        </div>
      </div>

      {/* Right Side - Optimized Google Sign-In Card */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-10 relative">
        <div className="w-full max-w-md">
          {/* Mobile Header Logo */}
          <div className="text-center lg:text-left mb-8">
            <Link href="/" className="inline-flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl overflow-hidden ring-1 ring-primary-200/60 shadow-sm flex items-center justify-center">
                <img src="/images/icon.jpeg" alt="Agent Croww" className="w-10 h-10 object-cover" />
              </div>
              <span className="brand-text text-2xl text-white">Agent Croww</span>
            </Link>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Sign In</h2>
            <p className="text-sm text-slate-400 mt-2">
              Sign in with your verified Google account to continue to Agent Croww
            </p>
          </div>

          {/* Main Auth Box */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-7 sm:p-8 backdrop-blur-sm shadow-2xl space-y-6">
            {/* Error Message */}
            {error && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm flex items-start gap-2.5">
                <span className="font-bold">!</span>
                <p>{error}</p>
              </div>
            )}

            {/* Google One-Click CTA */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading}
                className="w-full py-3.5 px-5 rounded-xl bg-white hover:bg-slate-100 active:scale-[0.99] text-slate-900 font-semibold flex items-center justify-center gap-3 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                {isGoogleLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin flex-shrink-0" />
                    <span>Connecting to Google...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                      />
                    </svg>
                    <span>Continue with Google</span>
                    <ArrowRight className="w-4 h-4 ml-1 text-slate-500" />
                  </>
                )}
              </button>

              <p className="text-xs text-center text-slate-400">
                Fast, secure sign-in. No passwords required.
              </p>
            </div>

            {/* Quick Benefits Card */}
            <div className="pt-4 border-t border-slate-800 space-y-2.5 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                <span>Single login access across Vendor and Seller tools</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                <span>Safe OAuth 2.0 authorization verified by Google</span>
              </div>
            </div>

            {/* Switch to Signup */}
            <div className="text-center pt-3 border-t border-slate-800">
              <p className="text-sm text-slate-400">
                New to Agent Croww?{' '}
                <Link
                  href="/auth/signup"
                  className="text-emerald-400 font-semibold hover:text-emerald-300 transition-colors"
                >
                  Create an account
                </Link>
              </p>
            </div>
          </div>

          {/* Footer note */}
          <p className="text-[11px] text-slate-500 text-center mt-6">
            By signing in, you agree to our{' '}
            <Link href="/terms" className="text-slate-400 hover:underline">Terms of Service</Link>
            {' '}and{' '}
            <Link href="/privacy" className="text-slate-400 hover:underline">Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
