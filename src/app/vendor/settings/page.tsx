'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { AlertCircle, Lock, Edit2 } from 'lucide-react';

export default function VendorSettings() {
  const router = useRouter();
  const { user, isLoading, updateUser, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [locked, setLocked] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    businessName: '',
    gstNumber: '',
    panNumber: '',
  });

  useEffect(() => {
    if (!isLoading && user?.role !== 'vendor') router.push('/');
    if (user) {
      const u = user as any;
      const data = {
        name: u.name ?? '',
        email: u.email ?? '',
        phone: u.phone ?? '',
        businessName: u.businessName ?? u.business_name ?? '',
        gstNumber: u.gstNumber ?? u.gst_number ?? '',
        panNumber: u.panNumber ?? u.pan_number ?? '',
      };
      setFormData(data);
      if (data.name && data.businessName && data.phone) setLocked(true);
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
      if (!formData.businessName.trim()) throw new Error('Business name is required');
      if (!formData.phone.trim()) throw new Error('Phone number is required');

      const res = await fetch(`/api/users/${user!.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          business_name: formData.businessName,
          gst_number: formData.gstNumber,
          pan_number: formData.panNumber,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Failed to save details');
      }
      updateUser({
        name: formData.name,
        phone: formData.phone,
        businessName: formData.businessName,
        gstNumber: formData.gstNumber,
        panNumber: formData.panNumber,
      });
      setSuccess(true);
      setLocked(true);
      setTimeout(() => setSuccess(false), 4000);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (confirm('Sign out of your account?')) {
      logout();
      router.push('/');
    }
  };

  if (isLoading) return null;
  if (!user || user.role !== 'vendor') return null;

  return (
    <div className="px-6 py-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your account and business details</p>
      </div>

      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg mb-5">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg mb-5">
          Details saved and locked successfully. Click Edit to make changes.
        </div>
      )}

      {/* Business info */}
      {locked ? (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-semibold text-gray-700">Business Information</h2>
            <button
              onClick={() => setLocked(false)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
              Edit
            </button>
          </div>
          <dl className="space-y-4">
            {[
              { label: 'Business Name', value: formData.businessName },
              { label: 'Owner / Manager Name', value: formData.name },
              { label: 'Phone', value: formData.phone },
              { label: 'GST Number', value: formData.gstNumber || '—' },
              { label: 'PAN Number', value: formData.panNumber || '—' },
              { label: 'Email', value: formData.email },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-start justify-between">
                <dt className="text-sm text-gray-500 w-40 flex-shrink-0">{label}</dt>
                <dd className="text-sm font-medium text-gray-900 text-right">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      ) : (
        <form onSubmit={handleSave}>
          <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4 mb-5">
            <h2 className="text-sm font-semibold text-gray-700">Business Information</h2>
            {[
              { label: 'Business Name', name: 'businessName', placeholder: 'Your business name', hint: 'Used for invoicing and marketplace display' },
              { label: 'Owner / Manager Name', name: 'name', placeholder: 'Your full name' },
              { label: 'Phone', name: 'phone', placeholder: '+91 9876543210', hint: 'For order notifications and support', type: 'tel' },
              { label: 'GST Number', name: 'gstNumber', placeholder: '27AABCT1234H1Z0', hint: 'GST registration number (optional)' },
              { label: 'PAN Number', name: 'panNumber', placeholder: 'AAAPA1234P', hint: 'For tax reporting (optional)' },
            ].map(({ label, name, placeholder, hint, type }) => (
              <div key={name}>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
                <input
                  type={type ?? 'text'}
                  name={name}
                  value={(formData as any)[name]}
                  onChange={handleChange}
                  placeholder={placeholder}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
              </div>
            ))}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
              <input
                type="email"
                value={formData.email}
                disabled
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
              />
              <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 hover:bg-gray-800 disabled:opacity-50 text-white text-sm font-medium rounded-md transition-colors"
            >
              <Lock className="w-4 h-4" />
              {loading ? 'Saving...' : 'Save & Lock'}
            </button>
            {formData.name && formData.businessName && formData.phone && (
              <button
                type="button"
                onClick={() => setLocked(true)}
                className="px-4 py-2.5 text-sm font-semibold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      )}

      {/* Danger zone */}
      <div className="mt-8 bg-white rounded-lg border border-red-100 p-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Account</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-800">Sign out</p>
            <p className="text-xs text-gray-400 mt-0.5">Log out from your vendor account</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm font-semibold text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
