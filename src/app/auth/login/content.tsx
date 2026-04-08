'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { isValidEmail } from '@/utils/auth';
import { Mail, Lock, TrendingUp, Zap, Shield, ArrowRight } from 'lucide-react';

export default function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const selectedRole = searchParams.get('role');
  const role = selectedRole === 'vendor' || selectedRole === 'seller' ? selectedRole : null;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const validateForm = () => {
    if (!isValidEmail(formData.email)) {
      setError('Please enter a valid email');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await login(formData.email, formData.password);
      setSuccessMessage('Login successful! Redirecting...');

      setTimeout(() => {
        try {
          const storedAuth = localStorage.getItem('auth');
          if (storedAuth) {
            const user = JSON.parse(storedAuth);
            const redirectPath = getRolePath(user.role);
            router.push(redirectPath);
          } else {
            router.push('/products');
          }
        } catch (error) {
          console.error('Redirect error:', error);
          router.push('/products');
        }
      }, 600);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      setIsLoading(false);
    }
  };

  const getRolePath = (userRole: string): string => {
    switch (userRole) {
      case 'vendor':
        return '/vendor/dashboard';
      case 'seller':
        return '/seller/dashboard';
      case 'customer':
        return '/products';
      default:
        return '/products';
    }
  };

  const signupHref = role ? `/auth/signup?role=${role}` : '/auth/signup';

  return (
    <div className="min-h-screen bg-slate-950 flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl -mr-48 -mt-48"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -ml-48 -mb-48"></div>

        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-2 mb-12">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-emerald-500 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">Agent Croww</span>
          </Link>

          <div className="space-y-8">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Welcome Back</h1>
              <p className="text-lg text-slate-300">
                {role === 'vendor' && 'Vendor login to manage your products and track earnings'}
                {role === 'seller' && 'Seller login to manage your marketplace and commissions'}
                {!role && 'Sign in to manage your products and track earnings'}
              </p>
            </div>

            <div className="space-y-4 pt-8">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-500/30 flex items-center justify-center flex-shrink-0 mt-1">
                  <Zap className="w-3 h-3 text-emerald-400" />
                </div>
                <div>
                  <p className="text-white font-semibold">Real-time Analytics</p>
                  <p className="text-sm text-slate-400">Track clicks, sales, and earnings instantly</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-violet-500/30 flex items-center justify-center flex-shrink-0 mt-1">
                  <TrendingUp className="w-3 h-3 text-violet-400" />
                </div>
                <div>
                  <p className="text-white font-semibold">Grow Your Revenue</p>
                  <p className="text-sm text-slate-400">Access thousands of products and buyers</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-cyan-500/30 flex items-center justify-center flex-shrink-0 mt-1">
                  <Shield className="w-3 h-3 text-cyan-400" />
                </div>
                <div>
                  <p className="text-white font-semibold">Secure & Reliable</p>
                  <p className="text-sm text-slate-400">Enterprise-grade security for your data</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-slate-400 italic">"Agent Croww has helped us reach thousands of customers and scale our business."</p>
          <p className="text-sm text-slate-500 mt-3">- Happy Vendor</p>
        </div>
      </div>

      <div className="w-full lg:w-1/2 bg-slate-950 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8">
            <Link href="/" className="inline-flex items-center gap-2 mb-6">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-emerald-500 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-white">Agent Croww</span>
            </Link>
            <h1 className="text-3xl font-bold text-white">Welcome Back</h1>
            <p className="text-slate-400 mt-2">
              {role === 'vendor' && 'Sign in to your vendor account'}
              {role === 'seller' && 'Sign in to your seller account'}
              {!role && 'Sign in to your account'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 animate-slide-down">
                <p className="text-red-300 text-sm font-medium">{error}</p>
              </div>
            )}

            {successMessage && (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 animate-slide-down">
                <p className="text-emerald-300 text-sm font-medium">{successMessage}</p>
              </div>
            )}

            <div>
              <label className="text-sm font-semibold text-slate-200 mb-2.5 block">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="you@example.com"
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-900/50 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-200 mb-2.5 block">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="........"
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-900/50 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Link href="#" className="text-sm text-violet-400 hover:text-violet-300 transition-colors">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-violet-700 hover:from-violet-500 hover:to-violet-600 text-white font-semibold flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-violet-600/20"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-800"></div>
              <span className="text-xs text-slate-500">OR</span>
              <div className="flex-1 h-px bg-slate-800"></div>
            </div>

            <div className="text-center">
              <p className="text-slate-400 text-sm">
                Don't have an account?{' '}
                <Link href={signupHref} className="text-violet-400 hover:text-violet-300 font-semibold transition-colors">
                  Sign up
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
