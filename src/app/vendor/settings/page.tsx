'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { AlertCircle, Lock, Edit2, ShieldCheck, LogOut, CalendarDays, Hash, BadgeCheck } from 'lucide-react';

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
    ifscCode: '',
    accountNumber: '',
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
        ifscCode: u.ifscCode ?? u.ifsc_code ?? '',
        accountNumber: u.accountNumber ?? u.account_number ?? '',
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
          ifsc_code: formData.ifscCode,
          account_number: formData.accountNumber,
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
        ifscCode: formData.ifscCode,
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

  const requiredFilled = [formData.name, formData.email, formData.phone, formData.businessName].filter(Boolean).length;
  const profileCompletion = Math.round((requiredFilled / 4) * 100);
  const joinedAt = user?.createdAt ? new Date(user.createdAt) : null;
  const summaryFields = [
    { label: 'Verification', value: user.isVerified ? 'Verified' : 'Not verified', icon: BadgeCheck },
    { label: 'Profile complete', value: `${profileCompletion}%`, icon: ShieldCheck },
    { label: 'Joined', value: joinedAt && !Number.isNaN(joinedAt.getTime()) ? joinedAt.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : '—', icon: CalendarDays },
    { label: 'Vendor ID', value: user.id.slice(0, 8).toUpperCase(), icon: Hash },
  ];

  const detailFields = [
    { label: 'IFSC Code', value: formData.ifscCode || '—' },
    { label: 'Account Number', value: formData.accountNumber || '—' },
  ];

  const generalFields = [
    { label: 'Business Name', name: 'businessName', placeholder: 'Your business name', hint: 'Used for invoicing and marketplace display' },
    { label: 'Owner / Manager Name', name: 'name', placeholder: 'Your full name' },
    { label: 'Phone', name: 'phone', placeholder: 'Phone number', hint: 'For order notifications and support', type: 'tel' },
  ];

  const payoutFields = [
    { label: 'IFSC Code', name: 'ifscCode', placeholder: 'SBIN0001234', hint: 'Bank IFSC code for payouts (optional)' },
    { label: 'Account Number', name: 'accountNumber', placeholder: 'e.g., 1234567890', hint: 'Bank account number for payouts (optional)' },
  ];

  return (
    <div className="px-4 sm:px-6 py-8 max-w-5xl mx-auto">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-500 shadow-sm">
            <ShieldCheck className="w-3.5 h-3.5" />
            Vendor account
          </div>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-gray-900">Settings</h1>
          <p className="mt-1 text-sm text-gray-500">Manage your business profile, tax details, and account access.</p>
        </div>
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 rounded-full px-0 py-0">
            <ShieldCheck className="w-3.5 h-3.5 text-gray-400" />
            <h1 className="ml-2 text-2xl font-semibold tracking-tight text-gray-900">Settings</h1>
          </div>
          <p className="mt-2 text-sm text-gray-500">Manage your business profile and account access.</p>
        </div>
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

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <aside className="space-y-5 md:sticky md:top-28">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900">Account</h2>
            <p className="mt-1 text-sm text-gray-500">Log out when you are done managing your store.</p>
            <div className="mt-4 grid grid-cols-1 gap-3">
              {summaryFields.map((s) => {
                const Icon = s.icon as any;
                return (
                  <div key={s.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">{s.label}</p>
                        <p className="text-sm font-semibold text-gray-900">{s.value}</p>
                      </div>
                    </div>
                  </div>
                );
              })}

              <div>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
                >
                  <LogOut className="w-4 h-4" />
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </aside>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Business information</h2>
              <p className="mt-1 text-sm text-gray-500">Keep your business details accurate for payouts, invoicing, and support.</p>
            </div>
            <button
              onClick={() => setLocked((prev) => !prev)}
              aria-label={locked ? 'Edit details' : 'Lock view'}
              className="inline-flex items-center justify-center h-9 w-9 rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          </div>

          {locked ? (
            <dl className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {[
                ...generalFields.map((f) => ({ label: f.label, value: (formData as any)[f.name] })),
                ...detailFields,
                { label: 'Email', value: formData.email },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between gap-4 border-b border-gray-100 pb-3 last:border-b-0 last:pb-0">
                  <dt className="text-sm text-gray-500">{label}</dt>
                  <dd className={`text-right text-sm font-medium text-gray-900 break-all ${label === 'Account Number' ? 'font-mono' : ''}`}>{value}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <form onSubmit={handleSave} className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {generalFields.map(({ label, name, placeholder, hint, type }) => (
                <div key={name} className="min-w-0">
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">{label}</label>
                  <input
                    type={type ?? 'text'}
                    name={name}
                    value={(formData as any)[name]}
                    onChange={handleChange}
                    placeholder={placeholder}
                    className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
                </div>
              ))}

              <div className="md:col-span-2 mt-1 pt-1 border-t border-gray-100">
                <h3 className="mt-4 mb-2 text-sm font-semibold text-gray-800">Payout details</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {payoutFields.map(({ label, name, placeholder, hint }) => (
                    <div key={name}>
                      <label className="mb-1.5 block text-sm font-semibold text-gray-700">{label}</label>
                      <input
                        name={name}
                        value={(formData as any)[name]}
                        onChange={handleChange}
                        placeholder={placeholder}
                        className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
                    </div>
                  ))}
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  disabled
                  className="w-full cursor-not-allowed rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-400"
                />
                <p className="mt-1 text-xs text-gray-400">Email cannot be changed</p>
              </div>

              <div className="md:col-span-2 flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
                >
                  <Lock className="w-4 h-4" />
                  {loading ? 'Saving...' : 'Save & Lock'}
                </button>
                {formData.name && formData.businessName && formData.phone && (
                  <button
                    type="button"
                    onClick={() => setLocked(true)}
                    className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          )}
        </section>
      </div>
    </div>
  );
}
