'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { isValidEmail } from '@/utils/auth';
import { Mail, Lock, User, Phone, Building2, FileText, TrendingUp, Zap, Shield, ArrowRight, CreditCard } from 'lucide-react';

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
    accountNumber: '',
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
      if (!formData.accountNumber.trim()) {
        setError('Please enter account number');
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
        accountNumber: role === 'seller' ? formData.accountNumber : undefined,
      });
      setSuccessMessage('Account created successfully! Redirecting...');
      setTimeout(() => {
        const redirectPath = role === 'vendor' ? '/vendor/dashboard' : '/seller/dashboard';
        router.push(redirectPath);
      }, 500);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const focusBg = 'focus:border-violet-500/50 focus:ring-violet-500/20';

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 flex-col justify-between p-12 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl -mr-48 -mt-48"></div>
        <div className={`absolute bottom-0 left-0 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl -ml-48 -mb-48`}></div>

        {/* Logo/Branding */}
        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-2 mb-12">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-emerald-500 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">Agent Croww</span>
          </Link>

          <div className="space-y-8">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                {role === 'vendor' ? 'Start Selling' : 'Become a Seller'}
              </h1>
              <p className="text-lg text-slate-300">
                {role === 'vendor' 
                  ? 'List your products and reach thousands of customers'
                  : 'Earn commissions by promoting products'}
              </p>
            </div>

            {/* Features List */}
            <div className="space-y-4 pt-8">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-500/30 flex items-center justify-center flex-shrink-0 mt-1">
                  <Zap className="w-3 h-3 text-emerald-400" />
                </div>
                <div>
                  <p className="text-white font-semibold">Quick Setup</p>
                  <p className="text-sm text-slate-400">Get your account ready in minutes</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-violet-500/30 flex items-center justify-center flex-shrink-0 mt-1">
                  <TrendingUp className="w-3 h-3 text-violet-400" />
                </div>
                <div>
                  <p className="text-white font-semibold">Grow Your Income</p>
                  <p className="text-sm text-slate-400">
                    {role === 'vendor' 
                      ? 'List unlimited products and maximize revenue'
                      : 'Unlimited earning potential on every sale'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-cyan-500/30 flex items-center justify-center flex-shrink-0 mt-1">
                  <Shield className="w-3 h-3 text-cyan-400" />
                </div>
                <div>
                  <p className="text-white font-semibold">Secure & Transparent</p>
                  <p className="text-sm text-slate-400">Real-time tracking and secure payments</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Quote */}
        <div className="relative z-10">
          <p className="text-slate-400 italic">
            {role === 'vendor'
              ? '"Agent Croww helped us scale from 0 to 10K orders in just 6 months."'
              : '"I earn ₹50K+ monthly just by promoting quality products."'}
          </p>
          <p className="text-sm text-slate-500 mt-3">
            {role === 'vendor' ? '— Success Vendor' : '— Top Seller'}
          </p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 bg-slate-950 flex items-center justify-center p-6">
        <div className="w-full max-w-md max-h-[90vh] overflow-y-auto">
          {/* Mobile Header */}
          <div className="lg:hidden mb-8">
            <Link href="/" className="inline-flex items-center gap-2 mb-6">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-emerald-500 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-white">Agent Croww</span>
            </Link>
            <h1 className="text-3xl font-bold text-white">
              {role === 'vendor' ? 'Start Selling' : 'Become a Seller'}
            </h1>
            <p className="text-slate-400 mt-2">Create your account now</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error Message */}
            {error && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 animate-slide-down">
                <p className="text-red-300 text-sm font-medium">{error}</p>
              </div>
            )}

            {/* Success Message */}
            {successMessage && (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 animate-slide-down">
                <p className="text-emerald-300 text-sm font-medium">{successMessage}</p>
              </div>
            )}

            {/* Role Selection */}
            <div>
              <label className="text-sm font-semibold text-slate-200 mb-3 block">I am a:</label>
              <div className="grid grid-cols-2 gap-3">
                {(['vendor', 'seller'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`py-3 px-4 rounded-xl border-2 transition-all font-semibold ${
                      role === r
                        ? 'border-violet-500 bg-violet-500/10 text-violet-300 shadow-lg shadow-violet-500/20'
                        : 'border-slate-700 text-slate-300 hover:border-slate-600 bg-slate-900/50'
                    }`}
                  >
                    {r === 'vendor' ? '🏪 Vendor' : '📢 Seller'}
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-2">
                {role === 'vendor' 
                  ? 'List your own products directly' 
                  : 'Promote and earn commissions'}
              </p>
            </div>

            {/* Email Input */}
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
                  className={`w-full pl-12 pr-4 py-3 rounded-xl bg-slate-900/50 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 ${focusBg} transition-all`}
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Full Name Input */}
            <div>
              <label className="text-sm font-semibold text-slate-200 mb-2.5 block">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="John Doe"
                  className={`w-full pl-12 pr-4 py-3 rounded-xl bg-slate-900/50 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 ${focusBg} transition-all`}
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Phone Input */}
            <div>
              <label className="text-sm font-semibold text-slate-200 mb-2.5 block">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="9876543210"
                  className={`w-full pl-12 pr-4 py-3 rounded-xl bg-slate-900/50 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 ${focusBg} transition-all`}
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Business Name (Vendor only) */}
            {role === 'vendor' && (
              <div>
                <label className="text-sm font-semibold text-slate-200 mb-2.5 block">Business Name</label>
                <div className="relative">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="text"
                    name="businessName"
                    value={formData.businessName}
                    onChange={handleInputChange}
                    placeholder="Your Business Pvt Ltd"
                    className={`w-full pl-12 pr-4 py-3 rounded-xl bg-slate-900/50 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 ${focusBg} transition-all`}
                    disabled={isLoading}
                  />
                </div>
              </div>
            )}

            {/* GST Number (Vendor only) */}
            {role === 'vendor' && (
              <div>
                <label className="text-sm font-semibold text-slate-200 mb-2.5 block">GST Number</label>
                <div className="relative">
                  <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="text"
                    name="gstNumber"
                    value={formData.gstNumber}
                    onChange={handleInputChange}
                    placeholder="22AAAAA0000A1Z5"
                    className={`w-full pl-12 pr-4 py-3 rounded-xl bg-slate-900/50 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 ${focusBg} transition-all`}
                    disabled={isLoading}
                  />
                </div>
              </div>
            )}

            {/* PAN Number (Seller only) */}
            {role === 'seller' && (
              <div>
                <label className="text-sm font-semibold text-slate-200 mb-2.5 block">PAN Number</label>
                <div className="relative">
                  <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="text"
                    name="panNumber"
                    value={formData.panNumber}
                    onChange={handleInputChange}
                    placeholder="ABCDE1234F"
                    className={`w-full pl-12 pr-4 py-3 rounded-xl bg-slate-900/50 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 ${focusBg} transition-all`}
                    disabled={isLoading}
                  />
                </div>
              </div>
            )}

            {/* Account Number (Seller only) */}
            {role === 'seller' && (
              <div>
                <label className="text-sm font-semibold text-slate-200 mb-2.5 block">Account Number</label>
                <div className="relative">
                  <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="text"
                    name="accountNumber"
                    value={formData.accountNumber}
                    onChange={handleInputChange}
                    placeholder="0123456789"
                    className={`w-full pl-12 pr-4 py-3 rounded-xl bg-slate-900/50 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 ${focusBg} transition-all`}
                    disabled={isLoading}
                  />
                </div>
              </div>
            )}

            {/* Password Input */}
            <div>
              <label className="text-sm font-semibold text-slate-200 mb-2.5 block">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  className={`w-full pl-12 pr-4 py-3 rounded-xl bg-slate-900/50 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 ${focusBg} transition-all`}
                  disabled={isLoading}
                />
              </div>
              <p className="text-xs text-slate-500 mt-2">Minimum 6 characters</p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-violet-700 hover:from-violet-500 hover:to-violet-600 text-white font-semibold flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-violet-600/20"
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

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-800"></div>
              <span className="text-xs text-slate-500">OR</span>
              <div className="flex-1 h-px bg-slate-800"></div>
            </div>

            {/* Login Link */}
            <div className="text-center pt-2">
              <p className="text-slate-400">
                Already have an account?{' '}
                <Link href="/auth/login" className="font-semibold text-violet-400 hover:text-violet-300 transition-colors">
                  Sign in
                </Link>
              </p>
            </div>
          </form>

          {/* Footer Text */}
          <p className="text-xs text-slate-500 text-center mt-8">
            By creating an account, you agree to our{' '}
            <Link href="#" className="text-slate-400 hover:text-slate-300 transition-colors">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="#" className="text-slate-400 hover:text-slate-300 transition-colors">
              Privacy Policy
            </Link>
          </p>
        </div>
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
