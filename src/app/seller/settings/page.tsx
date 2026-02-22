'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { AlertCircle, Save, Home, Lock, Mail, Store } from 'lucide-react';

export default function SellerSettings() {
  const router = useRouter();
  const { user, isLoading, updateUser, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    businessName: '',
  });

  useEffect(() => {
    if (!isLoading && user?.role !== 'seller') {
      router.push('/');
    }

    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        businessName: user.businessName || '',
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
      if (!formData.businessName.trim()) {
        throw new Error('Store name is required');
      }

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
    if (confirm('Are you sure you want to logout?')) {
      logout();
      router.push('/');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!user || user.role !== 'seller') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/seller/dashboard" className="text-primary hover:underline mb-4 inline-flex items-center gap-1">
            <Home className="w-4 h-4" /> Back to Dashboard
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-gray-600">Manage your seller account and store details</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Success Alert */}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-600 p-4 rounded-lg mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <p>Profile updated successfully!</p>
          </div>
        )}

        {/* Store Settings */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Store className="w-6 h-6" /> Store Information
          </h2>

          <form onSubmit={handleSaveProfile} className="space-y-6">
            {/* Store Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Store Name</label>
              <input
                type="text"
                name="businessName"
                value={formData.businessName}
                onChange={handleInputChange}
                placeholder="Your Store Name"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="text-xs text-gray-500 mt-1">Display name for your reselling store</p>
            </div>

            {/* Manager Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Your Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Your Full Name"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="text-xs text-gray-500 mt-1">Name of store owner/manager</p>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Business Phone</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="+91 9876543210"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="text-xs text-gray-500 mt-1">Contact number for customer inquiries</p>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <Mail className="w-4 h-4" /> Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">Email cannot be changed. Contact support if needed.</p>
            </div>

            {/* Save Button */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-primary text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 font-semibold"
              >
                <Save className="w-5 h-5" />
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>

        {/* Earnings & Payouts Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Earnings & Payouts</h2>

          <div className="space-y-6">
            {/* Commission Info */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Commission Rate</h3>
              <p className="text-sm text-gray-600 mb-3">You earn 10% commission on each sale</p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-gray-700">
                  <strong>Example:</strong> If a product sells for ₹1,250, you earn ₹125
                </p>
              </div>
            </div>

            <hr className="my-6" />

            {/* Payout Settings */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Payout Method</h3>
              <p className="text-sm text-gray-600 mb-3">Manage where you receive payments</p>
              <Link
                href="/seller/earnings"
                className="px-4 py-2 bg-blue-100 text-primary rounded-lg hover:bg-blue-200 font-semibold"
              >
                Update Payout Details
              </Link>
            </div>
          </div>
        </div>

        {/* Account Settings */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Account Security</h2>

          <div className="space-y-6">
            {/* Change Password */}
            <div>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <Lock className="w-5 h-5 text-gray-400 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Change Password</h3>
                    <p className="text-sm text-gray-600 mt-1">Update your account password</p>
                  </div>
                </div>
                <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                  Update
                </button>
              </div>
            </div>

            <hr className="my-6" />

            {/* Account Info */}
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">Account Type</h3>
                  <p className="text-sm text-gray-600 mt-1">Seller Account</p>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                  Active
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-red-900 mb-6">Danger Zone</h2>

          <div className="space-y-4">
            {/* Logout */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">Logout From All Devices</h3>
                <p className="text-sm text-gray-600 mt-1">Sign out from your account</p>
              </div>
              <button
                onClick={handleLogout}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold"
              >
                Logout
              </button>
            </div>

            <hr className="my-4" />

            {/* Deactivate Store */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">Deactivate Store</h3>
                <p className="text-sm text-gray-600 mt-1">Temporarily close your seller store</p>
              </div>
              <button className="px-6 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 font-semibold">
                Deactivate
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
