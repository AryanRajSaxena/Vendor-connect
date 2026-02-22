'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Settings, AlertCircle, Save, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface AdminSettings {
  platformMarkupPercentage: number;
  sellerCommissionPercentage: number;
  minimumWithdrawalAmount: number;
  platformCommissionPercentage: number;
  taxPercentage: number;
}

export default function AdminSettingsPage() {
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();
  const [settings, setSettings] = useState<AdminSettings>({
    platformMarkupPercentage: 25,
    sellerCommissionPercentage: 10,
    minimumWithdrawalAmount: 500,
    platformCommissionPercentage: 15,
    taxPercentage: 0,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!isLoading && user?.role !== 'admin') {
      router.push('/');
      return;
    }

    if (user?.id) {
      fetchSettings();
    }
  }, [user, isLoading, router]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setError(null);
      setSaving(true);

      // Validation
      if (settings.platformMarkupPercentage < 0 || settings.platformMarkupPercentage > 100) {
        throw new Error('Platform markup must be between 0-100%');
      }

      if (settings.sellerCommissionPercentage < 0 || settings.sellerCommissionPercentage > 100) {
        throw new Error('Seller commission must be between 0-100%');
      }

      if (settings.minimumWithdrawalAmount < 0) {
        throw new Error('Minimum withdrawal must be positive');
      }

      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
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

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Unauthorized access</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/admin/dashboard" className="text-primary hover:underline mb-2 inline-block">
            ← Back to Dashboard
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <Settings className="w-8 h-8 text-gray-900" />
            <h1 className="text-3xl font-bold text-gray-900">Platform Settings</h1>
          </div>
          <p className="text-gray-600">Configure commission percentages and platform fees</p>
        </div>

        {/* Alerts */}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-lg mb-6">
            ✓ Settings saved successfully!
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Settings Sections */}
        <div className="space-y-6">
          {/* Commission Structure */}
          <div className="bg-white rounded-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Commission Structure</h2>

            <div className="space-y-6">
              <div>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700">Platform Markup %</label>
                    <p className="text-xs text-gray-500 mt-1">
                      Markup added on vendor's base price (visible to customers)
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">{settings.platformMarkupPercentage}%</p>
                  </div>
                </div>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={settings.platformMarkupPercentage}
                  onChange={(e) =>
                    setSettings({ ...settings, platformMarkupPercentage: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                  <strong>Example:</strong> If vendor sets base price ₹2000 and markup is 25%, customer pays ₹2500
                </p>
              </div>

              <div className="border-t pt-6">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700">Seller Commission %</label>
                    <p className="text-xs text-gray-500 mt-1">
                      Commission sellers earn on each sale
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-600">{settings.sellerCommissionPercentage}%</p>
                  </div>
                </div>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={settings.sellerCommissionPercentage}
                  onChange={(e) =>
                    setSettings({ ...settings, sellerCommissionPercentage: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-900">
                  <strong>Example:</strong> If customer pays ₹2500 for item and seller commission is 10%, seller earns ₹250
                </p>
              </div>

              <div className="border-t pt-6">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700">Platform Commission %</label>
                    <p className="text-xs text-gray-500 mt-1">
                      Commission platform keeps from each sale
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-purple-600">{settings.platformCommissionPercentage}%</p>
                  </div>
                </div>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={settings.platformCommissionPercentage}
                  onChange={(e) =>
                    setSettings({ ...settings, platformCommissionPercentage: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          {/* Withdrawal Settings */}
          <div className="bg-white rounded-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Withdrawal Settings</h2>

            <div className="space-y-6">
              <div>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700">Minimum Withdrawal Amount (₹)</label>
                    <p className="text-xs text-gray-500 mt-1">
                      Minimum balance sellers must have to request withdrawal
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">₹{settings.minimumWithdrawalAmount}</p>
                  </div>
                </div>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={settings.minimumWithdrawalAmount}
                  onChange={(e) =>
                    setSettings({ ...settings, minimumWithdrawalAmount: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          {/* Tax Settings */}
          <div className="bg-white rounded-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Additional Settings</h2>

            <div className="space-y-6">
              <div>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700">Tax/GST % (Optional)</label>
                    <p className="text-xs text-gray-500 mt-1">
                      Additional tax added on top of final price (currently not applied)
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">{settings.taxPercentage}%</p>
                  </div>
                </div>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={settings.taxPercentage}
                  onChange={(e) =>
                    setSettings({ ...settings, taxPercentage: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="font-bold text-gray-900 mb-4">How Money Flows (Example)</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Customer pays:</span>
                <span className="font-semibold">₹2500 (Vendor base ₹2000 + {settings.platformMarkupPercentage}% markup)</span>
              </div>
              <div className="border-t border-gray-300 pt-2 mt-2 flex justify-between">
                <span className="text-gray-600">Seller commission ({settings.sellerCommissionPercentage}%):</span>
                <span className="font-semibold text-green-600">₹{(2500 * settings.sellerCommissionPercentage / 100).toFixed(0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Platform commission ({settings.platformCommissionPercentage}%):</span>
                <span className="font-semibold text-purple-600">₹{(2500 * settings.platformCommissionPercentage / 100).toFixed(0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Vendor receives:</span>
                <span className="font-semibold text-blue-600">
                  ₹{(2500 - (2500 * settings.sellerCommissionPercentage / 100) - (2500 * settings.platformCommissionPercentage / 100)).toFixed(0)}
                </span>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex gap-3">
            <Link href="/admin/dashboard" className="btn btn-outline flex-1">
              Cancel
            </Link>
            <button onClick={handleUpdate} disabled={saving} className="btn btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50">
              <Save className="w-5 h-5" />
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>

          {/* Danger Zone */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mt-8">
            <h3 className="text-lg font-bold text-red-900 mb-4">Account</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-900">Logout From All Devices</p>
                <p className="text-sm text-gray-600 mt-1">Sign out from your admin account</p>
              </div>
              <button
                onClick={handleLogout}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  async function handleUpdate() {
    await handleSave();
  }
}
