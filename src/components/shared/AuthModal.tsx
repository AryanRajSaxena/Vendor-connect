'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { X, Store, TrendingUp, Shield, ArrowRight } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRole?: 'vendor' | 'seller' | 'customer';
}

export default function AuthModal({ isOpen, onClose, defaultRole = 'vendor' }: AuthModalProps) {
  const { signInWithGoogle } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState<'vendor' | 'seller'>(
    defaultRole === 'seller' ? 'seller' : 'vendor'
  );
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleAuth = async () => {
    setError('');
    setIsGoogleLoading(true);
    try {
      await signInWithGoogle(!isLogin ? role : undefined);
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate with Google');
      setIsGoogleLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden text-slate-100">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-950/60">
          <div>
            <h2 className="text-xl font-bold text-white">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {isLogin ? 'Sign in with your verified Google account' : 'Select role and continue with Google'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Error Message */}
          {error && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
              {error}
            </div>
          )}

          {/* Role Selection (Sign Up only) */}
          {!isLogin && (
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 block">
                Select Your Role:
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setRole('vendor')}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${
                    role === 'vendor'
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-200'
                      : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <Store className={`w-4 h-4 mb-1.5 ${role === 'vendor' ? 'text-emerald-400' : 'text-slate-500'}`} />
                  <p className="font-semibold text-xs text-white">Vendor</p>
                  <p className="text-[10px] text-slate-400">80% course payout</p>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('seller')}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${
                    role === 'seller'
                      ? 'border-violet-500 bg-violet-500/10 text-violet-200'
                      : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <TrendingUp className={`w-4 h-4 mb-1.5 ${role === 'seller' ? 'text-violet-400' : 'text-slate-500'}`} />
                  <p className="font-semibold text-xs text-white">Seller</p>
                  <p className="text-[10px] text-slate-400">10% referral share</p>
                </button>
              </div>
            </div>
          )}

          {/* Google Auth Button */}
          <div className="space-y-2.5 pt-1">
            <button
              type="button"
              onClick={handleGoogleAuth}
              disabled={isGoogleLoading}
              className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-100 active:scale-[0.99] text-slate-900 font-semibold flex items-center justify-center gap-3 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
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
                  <span>
                    {isLogin
                      ? 'Continue with Google'
                      : `Sign up with Google as ${role === 'vendor' ? 'Vendor' : 'Seller'}`}
                  </span>
                  <ArrowRight className="w-4 h-4 ml-1 text-slate-500" />
                </>
              )}
            </button>
            <p className="text-[11px] text-center text-slate-400">
              One-click Google authentication. No password needed.
            </p>
          </div>

          {/* Quick trust note */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>256-Bit SSL Encrypted & OAuth 2.0 Protected</span>
          </div>

          {/* Toggle Login / Signup */}
          <div className="text-center pt-2 border-t border-slate-800">
            <p className="text-xs text-slate-400">
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                }}
                className="text-emerald-400 font-semibold hover:text-emerald-300 hover:underline transition-colors ml-1"
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
