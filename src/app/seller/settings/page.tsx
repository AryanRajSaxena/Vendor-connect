'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { AlertCircle, Save, Mail, LogOut } from 'lucide-react';

export default function SellerSettings() {
  const router = useRouter();
  const { user, isLoading, updateUser, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    businessName: '',
  });

  useEffect(() => {
    if (!isLoading && user?.role !== 'seller') router.push('/');
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        businessName: user.businessName || '',
      });
    }
  }, [user, isLoading, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      if (!formData.name.trim()) throw new Error('Name is required');
      if (!formData.businessName.trim()) throw new Error('Store name is required');
      updateUser({
        name: formData.name,
        phone: formData.phone,
        businessName: formData.businessName,
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (confirm('Are you sure you want to sign out?')) {
      logout();
      router.push('/');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!user || user.role !== 'seller') return null;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6 rounded-2xl border border-emerald-400/20 bg-gradient-to-r from-slate-900 to-slate-800 p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Seller Profile</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-100">Settings</h1>
        <p className="text-sm text-slate-300 mt-1">Manage your seller profile, payout context, and account preferences.</p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-500/12 border border-red-400/30 rounded-lg mb-5 text-sm text-red-200">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 p-3 bg-emerald-500/12 border border-emerald-400/30 rounded-lg mb-5 text-sm text-emerald-200">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          Profile updated successfully
        </div>
      )}

      {/* Store information */}
      <div className="bg-slate-900/80 rounded-xl border border-slate-700/80 p-6 mb-5">
        <h2 className="text-sm font-semibold text-slate-200 mb-4">Store Information</h2>
        <form onSubmit={handleSave} className="space-y-4">
          {[
            { label: 'Store Name', name: 'businessName', placeholder: 'Your store name', hint: 'Display name for your reselling store', required: true },
            { label: 'Your Name', name: 'name', placeholder: 'Full name', hint: 'Store owner or manager name', required: true },
            { label: 'Phone', name: 'phone', placeholder: 'Phone number', hint: 'Contact number', type: 'tel' },
          ].map(({ label, name, placeholder, hint, required, type }) => (
            <div key={name}>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                {label} {required && <span className="text-red-500">*</span>}
              </label>
              <input
                type={type ?? 'text'}
                name={name}
                value={(formData as any)[name]}
                onChange={handleChange}
                placeholder={placeholder}
                className="w-full px-3.5 py-2.5 border border-slate-700 bg-slate-950 text-slate-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              {hint && <p className="text-xs text-slate-500 mt-1">{hint}</p>}
            </div>
          ))}

          {/* Email (locked) */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" />
              Email Address
            </label>
            <input
              type="email"
              value={user.email || ''}
              disabled
              className="w-full px-3.5 py-2.5 border border-slate-700 rounded-lg text-sm bg-slate-950/70 text-slate-500 cursor-not-allowed"
            />
            <p className="text-xs text-slate-500 mt-1">Email cannot be changed. Contact support if needed.</p>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white text-sm font-medium rounded-md transition-colors"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* Commission info */}
      <div className="bg-slate-900/80 rounded-xl border border-slate-700/80 p-6 mb-5">
        <h2 className="text-sm font-semibold text-slate-200 mb-4">Commission Details</h2>
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between py-2 border-b border-slate-800">
            <span className="text-slate-400">Your commission rate</span>
            <span className="font-semibold text-slate-100">10% per sale</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-slate-800">
            <span className="text-slate-400">Payment method</span>
            <span className="font-semibold text-slate-100">Automatic</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-slate-400">Payment trigger</span>
            <span className="font-semibold text-slate-100">On order delivery</span>
          </div>
          <p className="text-xs text-slate-500 pt-1">
            Commissions are calculated on the final customer price and processed automatically when orders are delivered.
          </p>
        </div>
      </div>

      {/* Account danger zone */}
      <div className="bg-slate-900/80 rounded-xl border border-red-400/20 p-6">
        <h2 className="text-sm font-semibold text-slate-200 mb-4">Account</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-100">Sign out</p>
            <p className="text-xs text-slate-500 mt-0.5">Sign out of your seller account</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-300 border border-red-400/30 rounded-md hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}