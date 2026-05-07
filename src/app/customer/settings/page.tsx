'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { AlertCircle, Save, Home, Lock, Mail, LogOut, Trash2 } from 'lucide-react';

export default function CustomerSettings() {
  const router = useRouter();
  const { user, isLoading, updateUser, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });

  useEffect(() => {
    if (!isLoading && user?.role !== 'customer') {
      router.push('/');
    }

    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
      });
    }
  }, [user, isLoading, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      if (!formData.name.trim()) {
        throw new Error('Name is required');
      }

      updateUser({
        name: formData.name,
        phone: formData.phone,
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
    if (confirm('Are you sure you want to logout?')) {
      logout();
      router.push('/');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 flex items-center justify-center">
        <p className="text-slate-400">Loading...</p>
      </div>
    );
  }

  if (!user || user.role !== 'customer') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/customer/dashboard" className="text-sky-400 hover:text-sky-300 mb-4 inline-flex items-center gap-1 transition">
            <Home className="w-4 h-4" /> Back to Dashboard
          </Link>
          <h1 className="text-4xl font-bold text-slate-100 mb-2">Settings</h1>
          <p className="text-slate-400">Manage your account and preferences</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-500/10 border border-red-400/30 text-red-300 p-4 rounded-xl mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Success Alert */}
        {success && (
          <div className="bg-emerald-500/10 border border-emerald-400/30 text-emerald-300 p-4 rounded-xl mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <p className="text-sm">Profile updated successfully!</p>
          </div>
        )}

        {/* Profile Settings */}
        <div className="bg-slate-900/80 rounded-xl border border-slate-700/80 p-8 mb-8">
          <h2 className="text-2xl font-bold text-slate-100 mb-6">Profile Information</h2>

          <form onSubmit={handleSaveProfile} className="space-y-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-700 text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/60 transition"
              />
              <p className="text-xs text-slate-500 mt-1">Your display name across the platform</p>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
                <Mail className="w-4 h-4" /> Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                disabled
                className="w-full px-4 py-3 bg-slate-950/60 border border-slate-700/60 text-slate-500 rounded-lg cursor-not-allowed"
              />
              <p className="text-xs text-slate-500 mt-1">Email cannot be changed. Contact support if needed.</p>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Phone Number</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="+91 XXXXX XXXXX"
                className="w-full px-4 py-3 bg-slate-950 border border-slate-700 text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/60 placeholder:text-slate-600 transition"
              />
              <p className="text-xs text-slate-500 mt-1">Optional - for order notifications</p>
            </div>

            {/* Save Button */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg flex items-center justify-center gap-2 font-semibold transition"
              >
                <Save className="w-5 h-5" />
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>

        {/* Account Settings */}
        <div className="bg-slate-900/80 rounded-xl border border-slate-700/80 p-8 mb-8">
          <h2 className="text-2xl font-bold text-slate-100 mb-6">Account Security</h2>

          <div className="space-y-6">
            {/* Change Password */}
            <div>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <Lock className="w-5 h-5 text-sky-400 mt-1" />
                  <div>
                    <h3 className="font-semibold text-slate-100">Change Password</h3>
                    <p className="text-sm text-slate-400 mt-1">Update your account password</p>
                  </div>
                </div>
                <button className="px-4 py-2 border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-800/50 transition">
                  Update
                </button>
              </div>
            </div>

            <div className="border-t border-slate-700/50"></div>

            {/* Account Info */}
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-slate-100">Account Type</h3>
                  <p className="text-sm text-slate-400 mt-1">Customer Account</p>
                </div>
                <span className="px-3 py-1 bg-emerald-500/15 text-emerald-300 text-xs font-semibold rounded-full border border-emerald-400/30">
                  Active
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-red-500/5 border border-red-400/20 rounded-xl p-8">
          <h2 className="text-2xl font-bold text-red-400 mb-6">Danger Zone</h2>

          <div className="space-y-4">
            {/* Logout */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-100">Logout From All Devices</h3>
                <p className="text-sm text-slate-400 mt-1">Sign out from your account</p>
              </div>
              <button
                onClick={handleLogout}
                className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-semibold transition flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>

            <div className="border-t border-red-400/10"></div>

            {/* Delete Account */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-100">Delete Account</h3>
                <p className="text-sm text-slate-400 mt-1">Permanently delete your account and data</p>
              </div>
              <button className="px-6 py-2 border border-red-400/30 text-red-400 hover:bg-red-500/10 rounded-lg font-semibold transition flex items-center gap-2">
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
