'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { isValidEmail } from '@/utils/auth';
import { X, Mail, Lock, User, Phone, Building2, FileText, ArrowRight, Sparkles } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRole?: 'vendor' | 'seller' | 'customer';
}

export default function AuthModal({ isOpen, onClose, defaultRole = 'customer' }: AuthModalProps) {
  const router = useRouter();
  const { login, signup } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState<'vendor' | 'seller' | 'customer'>(defaultRole);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
    businessName: '',
    ifscCode: '',
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
    if (!isLogin) {
      if (!formData.name.trim()) {
        setError('Please enter your name');
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
      if (isLogin) {
        await login(formData.email, formData.password);
        setSuccessMessage('Login successful! Redirecting...');

        setTimeout(() => {
          onClose();
          router.push('/products');
        }, 500);
      } else {
        await signup({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          role: role,
          phone: formData.phone,
          businessName: role === 'vendor' ? formData.businessName : undefined,
          ifscCode: formData.ifscCode || undefined,
        });
        setSuccessMessage('Account created successfully! Redirecting...');
        setTimeout(() => {
          onClose();
          // For signup, we know the role from the form
          router.push(getRolePath(role));
        }, 500);
      }
    } catch (error: unknown) {
      setError(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const getRolePath = (userRole: string): string => {
    switch (userRole) {
      case 'vendor':
        return '/vendor/dashboard';
      case 'seller':
        return '/seller/dashboard';
      case 'admin':
        return '/admin/dashboard';
      case 'customer':
      default:
        return '/products';
    }
  };

  if (!isOpen) return null;

  const inputClass =
    'w-full pl-12 pr-4 py-3.5 rounded-xl bg-slate-950/65 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500/60 focus:ring-2 focus:ring-sky-500/20 transition-all';
  const labelClass = 'text-sm font-semibold text-slate-200 mb-2 block';

  return (
    <div className="fixed inset-0 bg-black/65 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="w-full max-w-md rounded-3xl border border-slate-700/70 bg-slate-900/90 shadow-[0_22px_70px_rgba(2,6,23,0.55)] max-h-[92vh] overflow-y-auto animate-scale-in">
        <div className="p-6 border-b border-slate-700/70 flex items-start justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-2 text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-400/20 text-emerald-200">
              <Sparkles className="w-3.5 h-3.5" />
              Course Commerce
            </p>
            <h2 className="text-2xl mt-3 font-semibold text-white" style={{ fontFamily: 'Outfit, Inter, sans-serif' }}>
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              {isLogin ? 'Log in to continue managing your courses' : 'Join Agent Croww and start growing'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-all duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-500/12 border border-red-400/30 animate-slide-down">
              <p className="text-sm font-medium text-red-200">{error}</p>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-500/12 border border-emerald-400/30 animate-slide-down">
              <p className="text-sm font-medium text-emerald-200">{successMessage}</p>
            </div>
          )}

          {!isLogin && (
            <div>
              <label className={labelClass}>I am a:</label>
              <div className="grid grid-cols-3 gap-2">
                {(['vendor', 'seller', 'customer'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`py-2.5 px-3 rounded-lg border transition-all duration-200 text-sm font-semibold ${
                      role === r
                        ? 'border-sky-400/70 bg-sky-500/15 text-sky-200 shadow-md shadow-sky-500/10'
                        : 'border-slate-700 text-slate-300 hover:border-slate-500 bg-slate-950/60'
                    }`}
                  >
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className={labelClass}>Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="you@example.com"
                className={inputClass}
                disabled={isLoading}
              />
            </div>
          </div>

          {!isLogin && (
            <div>
              <label className={labelClass}>Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="John Doe"
                  className={inputClass}
                  disabled={isLoading}
                />
              </div>
            </div>
          )}

          {!isLogin && (
            <div>
              <label className={labelClass}>Phone Number <span className="text-slate-500 font-normal">(optional)</span></label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="9876543210"
                  className={inputClass}
                  disabled={isLoading}
                />
              </div>
            </div>
          )}

          {!isLogin && role === 'vendor' && (
            <div>
              <label className={labelClass}>Business Name <span className="text-slate-500 font-normal">(optional)</span></label>
              <div className="relative">
                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="text"
                  name="businessName"
                  value={formData.businessName}
                  onChange={handleInputChange}
                  placeholder="Your Business Pvt Ltd"
                  className={inputClass}
                  disabled={isLoading}
                />
              </div>
            </div>
          )}

          {!isLogin && (role === 'vendor' || role === 'seller') && (
            <div>
              <label className={labelClass}>IFSC Code <span className="text-slate-500 font-normal">(optional)</span></label>
              <div className="relative">
                <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="text"
                  name="ifscCode"
                  value={formData.ifscCode}
                  onChange={handleInputChange}
                  placeholder="SBIN0001234"
                  className={inputClass}
                  disabled={isLoading}
                />
              </div>
            </div>
          )}

          <div>
            <label className={labelClass}>Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="••••••••"
                className={inputClass}
                disabled={isLoading}
              />
            </div>
            {!isLogin && <p className="text-xs text-slate-500 mt-1.5">Must be at least 6 characters</p>}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-sky-600 hover:from-emerald-500 hover:to-sky-500 text-white font-semibold flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-sky-600/25"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Processing...
              </span>
            ) : (
              <span className="inline-flex items-center gap-2">
                {isLogin ? 'Login to Account' : 'Create Account'}
                <ArrowRight className="w-4 h-4" />
              </span>
            )}
          </button>

          {/* Signup toggle removed — modal shows login only */}
        </form>
      </div>
    </div>
  );
}
