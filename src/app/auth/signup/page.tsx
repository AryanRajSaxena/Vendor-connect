'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { isValidEmail } from '@/utils/auth';
import {
  Mail,
  Lock,
  User,
  Phone,
  Building2,
  FileText,
  ArrowRight,
  GraduationCap,
  ShieldCheck,
  Sparkles,
  Wallet,
  CheckCircle2,
} from 'lucide-react';

function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signup } = useAuth();

  const [role, setRole] = useState<'vendor' | 'seller'>('vendor');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
    businessName: '',
    gstNumber: '',
    panNumber: '',
  });

  useEffect(() => {
    const roleParam = searchParams.get('role');
    if (roleParam && ['vendor', 'seller'].includes(roleParam)) {
      setRole(roleParam as 'vendor' | 'seller');
    }
  }, [searchParams]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const getErrorMessage = (error: unknown) => {
    if (error instanceof Error && error.message) {
      return error.message;
    }
    return 'An error occurred';
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
    if (!formData.name.trim()) {
      setError('Please enter your name');
      return false;
    }
    if (!formData.phone.trim()) {
      setError('Please enter your phone number');
      return false;
    }
    if (role === 'vendor') {
      if (!formData.businessName.trim()) {
        setError('Please enter business name');
        return false;
      }
      if (!formData.gstNumber.trim()) {
        setError('Please enter GST number');
        return false;
      }
    }
    if (role === 'seller') {
      if (!formData.panNumber.trim()) {
        setError('Please enter PAN number');
        return false;
      }
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
      await signup({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        role: role,
        phone: formData.phone,
        businessName: role === 'vendor' ? formData.businessName : undefined,
        gstNumber: role === 'vendor' ? formData.gstNumber : undefined,
        panNumber: role === 'seller' ? formData.panNumber : undefined,
      });
      setSuccessMessage('Account created successfully! Redirecting...');
      setTimeout(() => {
        const redirectPath = role === 'vendor' ? '/vendor/dashboard' : '/seller/dashboard';
        router.push(redirectPath);
      }, 500);
    } catch (error: unknown) {
      setError(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const focusBg = 'focus:border-sky-500/60 focus:ring-sky-500/20';

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
              <Sparkles className="w-4 h-4" />
              Build your course commerce engine
            </p>
            <h1 className="mt-6 text-5xl leading-tight tracking-tight font-semibold text-white" style={{ fontFamily: 'Outfit, Inter, sans-serif' }}>
              {role === 'vendor' ? 'Create your vendor account.' : 'Create your seller account.'}
            </h1>
            <p className="mt-5 text-lg text-slate-300">
              {role === 'vendor'
                ? 'Publish and sell your courses with full control over catalog and pricing.'
                : 'Promote high-converting courses and earn transparent commissions.'}
            </p>

            <div className="mt-10 grid grid-cols-1 gap-4">
              <div className="rounded-2xl border border-slate-700/70 bg-slate-900/55 p-4 flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-300 flex items-center justify-center">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-slate-100">Course-ready storefront</p>
                  <p className="text-sm text-slate-400">Launch products fast and optimize your listing quality.</p>
                </div>
              </div>
              <div className="rounded-2xl border border-slate-700/70 bg-slate-900/55 p-4 flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-slate-100">Predictable earnings</p>
                  <p className="text-sm text-slate-400">Payout tracking and attribution for every successful order.</p>
                </div>
              </div>
              <div className="rounded-2xl border border-slate-700/70 bg-slate-900/55 p-4 flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-300 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-slate-100">Secure onboarding</p>
                  <p className="text-sm text-slate-400">Identity details stay protected with strict account controls.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="p-5 sm:p-8 lg:p-12 flex items-center justify-center">
          <div className="w-full max-w-md rounded-3xl border border-slate-700/70 bg-slate-900/70 backdrop-blur-xl p-6 sm:p-8 shadow-[0_22px_70px_rgba(2,6,23,0.55)] max-h-[92vh] overflow-y-auto">
            <div className="lg:hidden mb-7">
              <Link href="/" className="inline-flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-sky-500 flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl brand-money-font text-white">Agent Croww</span>
              </Link>
            </div>

            <div>
              <h2 className="text-3xl font-semibold text-white" style={{ fontFamily: 'Outfit, Inter, sans-serif' }}>Create Account</h2>
              <p className="text-slate-400 mt-2">Start selling or promoting courses in minutes.</p>
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
                <label className="text-sm font-semibold text-slate-200 mb-2.5 block">Choose Role</label>
                <div className="grid grid-cols-2 gap-3">
                  {(['vendor', 'seller'] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`py-3 px-4 rounded-xl border transition-all font-semibold ${
                        role === r
                          ? 'border-sky-400/70 bg-sky-500/15 text-sky-200 shadow-md shadow-sky-500/10'
                          : 'border-slate-700 text-slate-300 hover:border-slate-500 bg-slate-950/60'
                      }`}
                    >
                      {r === 'vendor' ? 'Vendor' : 'Seller'}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-slate-500 mt-2 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {role === 'vendor' ? 'Sell your own courses and digital products.' : 'Promote marketplace courses for commission.'}
                </p>
              </div>

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
                    className={`w-full pl-12 pr-4 py-3.5 rounded-xl bg-slate-950/65 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 ${focusBg} transition-all`}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-200 mb-2 block">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="John Doe"
                    className={`w-full pl-12 pr-4 py-3.5 rounded-xl bg-slate-950/65 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 ${focusBg} transition-all`}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-200 mb-2 block">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="9876543210"
                    className={`w-full pl-12 pr-4 py-3.5 rounded-xl bg-slate-950/65 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 ${focusBg} transition-all`}
                    disabled={isLoading}
                  />
                </div>
              </div>

              {role === 'vendor' && (
                <div>
                  <label className="text-sm font-semibold text-slate-200 mb-2 block">Business Name</label>
                  <div className="relative">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input
                      type="text"
                      name="businessName"
                      value={formData.businessName}
                      onChange={handleInputChange}
                      placeholder="Your Business Pvt Ltd"
                      className={`w-full pl-12 pr-4 py-3.5 rounded-xl bg-slate-950/65 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 ${focusBg} transition-all`}
                      disabled={isLoading}
                    />
                  </div>
                </div>
              )}

              {role === 'vendor' && (
                <div>
                  <label className="text-sm font-semibold text-slate-200 mb-2 block">GST Number</label>
                  <div className="relative">
                    <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input
                      type="text"
                      name="gstNumber"
                      value={formData.gstNumber}
                      onChange={handleInputChange}
                      placeholder="22AAAAA0000A1Z5"
                      className={`w-full pl-12 pr-4 py-3.5 rounded-xl bg-slate-950/65 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 ${focusBg} transition-all`}
                      disabled={isLoading}
                    />
                  </div>
                </div>
              )}

              {role === 'seller' && (
                <div>
                  <label className="text-sm font-semibold text-slate-200 mb-2 block">PAN Number</label>
                  <div className="relative">
                    <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input
                      type="text"
                      name="panNumber"
                      value={formData.panNumber}
                      onChange={handleInputChange}
                      placeholder="ABCDE1234F"
                      className={`w-full pl-12 pr-4 py-3.5 rounded-xl bg-slate-950/65 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 ${focusBg} transition-all`}
                      disabled={isLoading}
                    />
                  </div>
                </div>
              )}

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
                    className={`w-full pl-12 pr-4 py-3.5 rounded-xl bg-slate-950/65 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 ${focusBg} transition-all`}
                    disabled={isLoading}
                  />
                </div>
                <p className="text-xs text-slate-500 mt-2">Minimum 6 characters.</p>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-sky-600 hover:from-emerald-500 hover:to-sky-500 text-white font-semibold flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-sky-600/25"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Creating account...
                  </>
                ) : (
                  <>
                    Create Account
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-center pt-1">
                <p className="text-slate-400">
                  Already have an account?{' '}
                  <Link href="/auth/login" className="font-semibold text-sky-300 hover:text-sky-200 transition-colors">
                    Sign in
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
          <p className="text-slate-400">Loading signup...</p>
        </div>
      }
    >
      <SignupContent />
    </Suspense>
  );
}
