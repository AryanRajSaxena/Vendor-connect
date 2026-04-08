'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Save, CheckCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import {
  Card,
  CardHeader,
  CardContent,
  Button,
  Input,
  AlertBanner,
} from '@/components/customer';

export default function CustomerSettings() {
  const router = useRouter();
  const { user, isLoading, logout, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });

  useEffect(() => {
    if (!isLoading && user?.role !== 'customer') {
      router.push('/');
      return;
    }

    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
      });
    }
  }, [user, isLoading, router]);

  const handleUpdateProfile = async () => {
    try {
      setError(null);
      setSuccess(null);

      if (!formData.name?.trim()) {
        setError('Name is required');
        return;
      }

      if (!formData.email?.trim()) {
        setError('Email is required');
        return;
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        setError('Please enter a valid email address');
        return;
      }

      if (!formData.phone?.trim()) {
        setError('Phone number is required');
        return;
      }

      if (!/^[0-9]{10}$/.test(formData.phone.replace(/\D/g, ''))) {
        setError('Please enter a valid 10-digit phone number');
        return;
      }

      setLoading(true);

      // In a real app, this would update the database
      // For now, we'll just update the local state
      updateUser({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
      });

      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (confirm('Are you sure you want to log out?')) {
      logout();
      router.push('/');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-920 to-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-3 border-primary-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-300">Loading settings...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'customer') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-920 to-gray-950">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Account Settings</h1>
          <p className="text-gray-400 mt-2">Manage your account information and preferences</p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6">
            <AlertBanner
              variant="error"
              message={error}
              onClose={() => setError(null)}
            />
          </div>
        )}

        {success && (
          <div className="mb-6">
            <AlertBanner
              variant="success"
              message={success}
              onClose={() => setSuccess(null)}
            />
          </div>
        )}

        <div className="space-y-6">
          {/* Profile Information */}
          <Card>
            <CardHeader title="Profile Information" subtitle="Update your personal details" />
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">Full Name</label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Your full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Email Address</label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Phone Number</label>
                <Input
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="10-digit number"
                  maxLength={10}
                />
              </div>

              <div className="pt-4 border-t border-gray-800 flex gap-3">
                <Button
                  onClick={handleUpdateProfile}
                  isLoading={loading}
                  icon={<Save className="w-4 h-4" />}
                  fullWidth
                >
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Account Status */}
          <Card>
            <CardHeader title="Account Status" />
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                  <p className="text-sm text-gray-400 mb-1">Account Status</p>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-white font-medium">Active</span>
                  </div>
                </div>

                <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                  <p className="text-sm text-gray-400 mb-1">Verification Status</p>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-white font-medium">
                      {user.isVerified ? 'Verified' : 'Unverified'}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Member Since</label>
                <p className="text-white">
                  {new Date().toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Links */}
          <Card className="hover:shadow-lg transition cursor-pointer">
            <a href="/customer/dashboard" className="block">
              <h3 className="text-lg font-bold text-white mb-1">My Orders</h3>
              <p className="text-sm text-gray-400">View and track your orders</p>
            </a>
          </Card>

          {/* Danger Zone */}
          <Card className="border-red-800 bg-red-900/10">
            <CardHeader
              title="Danger Zone"
              subtitle="Irreversible and destructive actions"
            />
            <CardContent>
              <Button
                onClick={handleLogout}
                variant="danger"
                icon={<LogOut className="w-4 h-4" />}
                fullWidth
              >
                Log Out
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
