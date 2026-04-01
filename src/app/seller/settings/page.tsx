'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { AlertCircle, Save, Mail, LogOut, Lock, LockOpen } from 'lucide-react';

interface LockedFields {
  name: boolean;
  phone: boolean;
  panNumber: boolean;
  accountNumber: boolean;
}

export default function SellerSettings() {
  const router = useRouter();
  const { user, isLoading, updateUser, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [lockedFields, setLockedFields] = useState<LockedFields>({
    name: false,
    phone: false,
    panNumber: false,
    accountNumber: false,
  });
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    panNumber: '',
    accountNumber: '',
  });

  useEffect(() => {
    if (!isLoading && user?.role !== 'seller') router.push('/');
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        panNumber: user.panNumber || '',
        accountNumber: user.accountNumber || '',
      });
      // Determine which fields are locked (have values)
      setLockedFields({
        name: !!user.name,
        phone: !!user.phone,
        panNumber: !!user.panNumber,
        accountNumber: !!user.accountNumber,
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
      if (!formData.panNumber.trim()) throw new Error('PAN number is required');
      if (!formData.accountNumber.trim()) throw new Error('Account number is required');

      // Update user
      updateUser({
        name: formData.name,
        phone: formData.phone,
        panNumber: formData.panNumber,
        accountNumber: formData.accountNumber,
      });

      // Lock fields that now have values after saving
      setLockedFields({
        name: !!formData.name,
        phone: !!formData.phone,
        panNumber: !!formData.panNumber,
        accountNumber: !!formData.accountNumber,
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

  const fields = [
    { label: 'Name', name: 'name', placeholder: 'Full name', hint: 'Your legal name', required: true },
    { label: 'Phone', name: 'phone', placeholder: 'Phone number', hint: 'Contact number', type: 'tel' },
    { label: 'PAN Number', name: 'panNumber', placeholder: 'ABCDE1234F', hint: 'Your PAN for payments', required: true },
    { label: 'Account Number', name: 'accountNumber', placeholder: '0123456789', hint: 'Bank account for payouts', required: true },
  ];

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage your seller account details</p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg mb-5 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg mb-5 text-sm text-green-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          Profile updated successfully
        </div>
      )}

      {/* Account information */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Account Information</h2>
        <form onSubmit={handleSave} className="space-y-4">
          {fields.map(({ label, name, placeholder, hint, required, type }) => {
            const isLocked = (lockedFields as any)[name];
            return (
              <div key={name}>
                <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                  {label}
                  {required && <span className="text-red-500">*</span>}
                  {isLocked && (
                    <span className="flex items-center gap-1 text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded">
                      <Lock className="w-3 h-3" />
                      Locked
                    </span>
                  )}
                </label>
                <input
                  type={type ?? 'text'}
                  name={name}
                  value={(formData as any)[name]}
                  onChange={handleChange}
                  placeholder={placeholder}
                  disabled={isLocked}
                  className={`w-full px-3.5 py-2.5 border rounded-lg text-sm focus:outline-none transition-colors ${
                    isLocked
                      ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                      : 'border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent'
                  }`}
                />
                {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
              </div>
            );
          })}

          {/* Email (locked) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
              <Mail className="w-3.5 h-3.5" />
              Email Address
              <span className="flex items-center gap-1 text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded">
                <Lock className="w-3 h-3" />
                Locked
              </span>
            </label>
            <input
              type="email"
              value={user.email || ''}
              disabled
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
            />
            <p className="text-xs text-gray-400 mt-1">Email cannot be changed. Contact support if needed.</p>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || Object.values(lockedFields).every(Boolean)}
              className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 hover:bg-gray-800 disabled:opacity-50 text-white text-sm font-medium rounded-md transition-colors"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
            {Object.values(lockedFields).every(Boolean) && (
              <p className="text-xs text-amber-600 mt-2">All fields are locked. No changes can be made.</p>
            )}
          </div>
        </form>
      </div>

      {/* Commission info */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Commission Details</h2>
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">Your commission rate</span>
            <span className="font-semibold text-gray-900">10% per sale</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">Payment method</span>
            <span className="font-semibold text-gray-900">Automatic</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-gray-600">Payment trigger</span>
            <span className="font-semibold text-gray-900">On order delivery</span>
          </div>
          <p className="text-xs text-gray-400 pt-1">
            Commissions are calculated on the final customer price and processed automatically when orders are delivered.
          </p>
        </div>
      </div>

      {/* Account danger zone */}
      <div className="bg-white rounded-lg border border-red-100 p-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Account</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">Sign out</p>
            <p className="text-xs text-gray-400 mt-0.5">Sign out of your seller account</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-md hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}