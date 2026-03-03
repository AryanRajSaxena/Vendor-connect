'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { isValidEmail } from '@/utils/auth';
import { X, Mail, Lock, User, Phone, Building2, FileText } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const router = useRouter();
  const { login, signup } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState<'vendor' | 'seller' | 'customer'>('customer');
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
    gstNumber: '',
    panNumber: '',
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
    if (!isLogin) {
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
        
        // Redirect based on the authenticated user's role from context
        setTimeout(() => {
          const handleRedirect = async () => {
            // Get the current auth context to check the role
            const storedAuth = localStorage.getItem('auth');
            if (storedAuth) {
              try {
                const user = JSON.parse(storedAuth);
                const redirectPath = getRolePath(user.role);
                onClose();
                router.push(redirectPath);
              } catch {
                onClose();
                window.location.reload();
              }
            }
          };
          handleRedirect();
        }, 500);
      } else {
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
          onClose();
          // For signup, we know the role from the form
          router.push(getRolePath(role));
        }, 500);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
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

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-large max-w-md w-full max-h-[90vh] overflow-y-auto animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {isLogin ? 'Login to continue' : 'Join VendorConnect today'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Error Message */}
          {error && (
            <div className="alert-error animate-slide-down">
              <div className="w-5 h-5 rounded-full bg-red-200 flex items-center justify-center flex-shrink-0">
                <span className="text-red-600 text-xs font-bold">!</span>
              </div>
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="alert-success animate-slide-down">
              <div className="w-5 h-5 rounded-full bg-green-200 flex items-center justify-center flex-shrink-0">
                <span className="text-green-600 text-xs font-bold">✓</span>
              </div>
              <p className="text-sm font-medium">{successMessage}</p>
            </div>
          )}

          {/* Role Selection (Sign Up only) */}
          {!isLogin && (
            <div className="space-y-2">
              <label className="label">I am a:</label>
              <div className="grid grid-cols-3 gap-2">
                {(['vendor', 'seller', 'customer'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`py-2.5 px-3 rounded-lg border-2 transition-all duration-200 text-sm font-semibold ${
                      role === r
                        ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-sm'
                        : 'border-gray-200 text-gray-700 hover:border-primary-300 hover:bg-gray-50'
                    }`}
                  >
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Email */}
          <div>
            <label className="label">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="you@example.com"
                className="input pl-11"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Name (Sign Up only) */}
          {!isLogin && (
            <div>
              <label className="label">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="John Doe"
                  className="input pl-11"
                  disabled={isLoading}
                />
              </div>
            </div>
          )}

          {/* Phone (Sign Up only) */}
          {!isLogin && (
            <div>
              <label className="label">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="9876543210"
                  className="input pl-11"
                  disabled={isLoading}
                />
              </div>
            </div>
          )}

          {/* Business Name (Vendor only) */}
          {!isLogin && role === 'vendor' && (
            <div>
              <label className="label">Business Name</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  name="businessName"
                  value={formData.businessName}
                  onChange={handleInputChange}
                  placeholder="Your Business Pvt Ltd"
                  className="input pl-11"
                  disabled={isLoading}
                />
              </div>
            </div>
          )}

          {/* GST Number (Vendor only) */}
          {!isLogin && role === 'vendor' && (
            <div>
              <label className="label">GST Number</label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  name="gstNumber"
                  value={formData.gstNumber}
                  onChange={handleInputChange}
                  placeholder="22AAAAA0000A1Z5"
                  className="input pl-11"
                  disabled={isLoading}
                />
              </div>
            </div>
          )}

          {/* PAN Number (Seller only) */}
          {!isLogin && role === 'seller' && (
            <div>
              <label className="label">PAN Number</label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  name="panNumber"
                  value={formData.panNumber}
                  onChange={handleInputChange}
                  placeholder="ABCDE1234F"
                  className="input pl-11"
                  disabled={isLoading}
                />
              </div>
            </div>
          )}

          {/* Password */}
          <div>
            <label className="label">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="••••••••"
                className="input pl-11"
                disabled={isLoading}
              />
            </div>
            {!isLogin && (
              <p className="text-xs text-gray-500 mt-1.5">Must be at least 6 characters</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full btn-primary btn-lg"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="spinner w-5 h-5"></div>
                Processing...
              </span>
            ) : isLogin ? (
              'Login to Account'
            ) : (
              'Create Account'
            )}
          </button>

          {/* Toggle Login/Signup */}
          <div className="text-center pt-2">
            <p className="text-sm text-gray-600">
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                  setSuccessMessage('');
                  setFormData({
                    email: '',
                    password: '',
                    name: '',
                    phone: '',
                    businessName: '',
                    gstNumber: '',
                    panNumber: '',
                  });
                }}
                className="text-primary-600 font-semibold hover:text-primary-700 hover:underline transition-colors"
              >
                {isLogin ? 'Sign Up' : 'Login'}
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
