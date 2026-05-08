'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { isValidEmail } from '@/utils/auth';
import { Mail, Lock, ArrowRight, GraduationCap, ShieldCheck, Wallet, CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const getErrorMessage = (error: unknown) => {
    if (error instanceof Error && error.message) {
      return error.message;
    }
    return 'An error occurred';
  };

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
        router.push('/products');
      }, 500);
    } catch (error: unknown) {
      setError(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#08131c] text-slate-100 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,rgba(22,163,74,0.22),transparent_35%),radial-gradient(circle_at_85%_12%,rgba(14,165,233,0.2),transparent_35%),radial-gradient(circle_at_60%_85%,rgba(249,115,22,0.16),transparent_30%)]" />

      <div className="relative z-10 min-h-screen grid lg:grid-cols-[1.05fr_0.95fr]">
        <section className="hidden lg:flex p-12 xl:p-16 flex-col">
          <Link href="/" className="inline-flex items-center gap-3 mb-14">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-sky-500 flex items-center justify-center shadow-lg shadow-sky-500/20">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl brand-money-font text-white">Agent Croww</span>
          </Link>

          <div className="max-w-xl">
            <p className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-400/30 text-emerald-200 text-sm bg-emerald-500/10">
              <CheckCircle2 className="w-4 h-4" />
              Trusted by high-performing course teams
            </p>
            <h1 className="mt-6 text-5xl leading-tight tracking-tight font-semibold text-white" style={{ fontFamily: 'Outfit, Inter, sans-serif' }}>
              Log in and keep your course store moving.
            </h1>
            <p className="mt-5 text-lg text-slate-300">
              Access products, checkout data, and growth tools in one clean dashboard built for digital course commerce.
            </p>

            <div className="mt-10 grid grid-cols-1 gap-4">
              <div className="rounded-2xl border border-slate-700/70 bg-slate-900/55 p-4 flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-300 flex items-center justify-center">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-slate-100">Course-first workflows</p>
                  <p className="text-sm text-slate-400">Manage digital products, pricing, and enrollments with speed.</p>
                </div>
              </div>
              <div className="rounded-2xl border border-slate-700/70 bg-slate-900/55 p-4 flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-slate-100">Revenue visibility</p>
                  <p className="text-sm text-slate-400">Track orders, seller earnings, and conversion health in real time.</p>
                </div>
              </div>
              <div className="rounded-2xl border border-slate-700/70 bg-slate-900/55 p-4 flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-300 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-slate-100">Secure operations</p>
                  <p className="text-sm text-slate-400">Protected authentication and stable infrastructure for scale.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="p-5 sm:p-8 lg:p-12 flex items-center justify-center">
          <div className="w-full max-w-md rounded-3xl border border-slate-700/70 bg-slate-900/70 backdrop-blur-xl p-6 sm:p-8 shadow-[0_22px_70px_rgba(2,6,23,0.55)]">
            <div className="lg:hidden mb-7">
              <Link href="/" className="inline-flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-sky-500 flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl brand-money-font text-white">Agent Croww</span>
              </Link>
            </div>

            <div>
              <h2 className="text-3xl font-semibold text-white" style={{ fontFamily: 'Outfit, Inter, sans-serif' }}>Welcome Back</h2>
              <p className="text-slate-400 mt-2">Log in to your account and continue selling courses.</p>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              {error && (
                <div className="p-3.5 rounded-xl bg-red-500/12 border border-red-400/30 animate-slide-down">
                  <p className="text-red-200 text-sm font-medium">{error}</p>
                </div>
              )}

              {successMessage && (
                <div className="p-3.5 rounded-xl bg-emerald-500/12 border border-emerald-400/30 animate-slide-down">
                  <p className="text-emerald-200 text-sm font-medium">{successMessage}</p>
                </div>
              )}

              <div>
                <label className="text-sm font-semibold text-slate-200 mb-2 block">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="you@example.com"
                    className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-slate-950/65 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500/60 focus:ring-2 focus:ring-sky-500/20 transition-all"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-200 mb-2 block">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="••••••••"
                    className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-slate-950/65 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500/60 focus:ring-2 focus:ring-sky-500/20 transition-all"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-sky-600 hover:from-emerald-500 hover:to-sky-500 text-white font-semibold flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-sky-600/25"
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

              {/* Signup link removed — login only */}

              <div className="text-center pt-3">
                <Link href="/" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">
                  Back to Home
                </Link>
              </div>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}
