'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import {
  AlertCircle,
  Save,
  Mail,
  LogOut,
  Store,
  User as UserIcon,
  CreditCard,
  Building2,
  CheckCircle2,
  Bell,
  ShieldCheck,
} from 'lucide-react';

export default function SellerSettings() {
  const router = useRouter();
  const { user, isLoading, updateUser, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form State
  const [storeName, setStoreName] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [upiId, setUpiId] = useState('');
  const [bankAccountHolder, setBankAccountHolder] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankIfscCode, setBankIfscCode] = useState('');

  // Notification Preferences
  const [notifyCustomerPurchase, setNotifyCustomerPurchase] = useState(true);
  const [notifyWithdrawalProcessed, setNotifyWithdrawalProcessed] = useState(true);

  useEffect(() => {
    if (!isLoading && user?.role !== 'seller') router.push('/');
    if (user) {
      const u = user as any;
      setStoreName(u.businessName || u.business_name || '');
      setFullName(u.name || '');
      setPhone(u.phone || '');
      if (u.account_number || u.accountNumber) setBankAccountNumber(u.account_number || u.accountNumber);
      if (u.ifsc_code || u.ifscCode) setBankIfscCode(u.ifsc_code || u.ifscCode);

      // Load extended settings from localStorage
      try {
        const saved = localStorage.getItem(`seller_settings_${user.id}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.upiId) setUpiId(parsed.upiId);
          if (parsed.bankAccountHolder) setBankAccountHolder(parsed.bankAccountHolder);
          if (parsed.bankAccountNumber) setBankAccountNumber(parsed.bankAccountNumber);
          if (parsed.bankIfscCode) setBankIfscCode(parsed.bankIfscCode);
          if (typeof parsed.notifyCustomerPurchase === 'boolean') {
            setNotifyCustomerPurchase(parsed.notifyCustomerPurchase);
          }
          if (typeof parsed.notifyWithdrawalProcessed === 'boolean') {
            setNotifyWithdrawalProcessed(parsed.notifyWithdrawalProcessed);
          }
        }
      } catch (e) {
        console.warn('Failed to parse seller settings from storage', e);
      }
    }
  }, [user, isLoading, router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      if (!storeName.trim()) throw new Error('Store Name / Display Name is required');
      if (!fullName.trim()) throw new Error('Full Name is required');
      if (!phone.trim()) throw new Error('Phone Number is required for verification');

      // Update core user in database (including bank account & IFSC on public.users)
      const res = await fetch(`/api/users/${user!.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fullName.trim(),
          phone: phone.trim(),
          business_name: storeName.trim(),
          account_number: bankAccountNumber.trim(),
          ifsc_code: bankIfscCode.trim().toUpperCase(),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to update seller profile');
      }

      // Persist extended seller settings locally
      const extendedSettings = {
        upiId: upiId.trim(),
        bankAccountHolder: bankAccountHolder.trim(),
        bankAccountNumber: bankAccountNumber.trim(),
        bankIfscCode: bankIfscCode.trim().toUpperCase(),
        notifyCustomerPurchase,
        notifyWithdrawalProcessed,
      };

      localStorage.setItem(`seller_settings_${user!.id}`, JSON.stringify(extendedSettings));

      updateUser({
        name: fullName.trim(),
        phone: phone.trim(),
        businessName: storeName.trim(),
        ...extendedSettings,
      });

      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } catch (err: any) {
      setError(err.message || 'Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (confirm('Are you sure you want to sign out of your seller account?')) {
      logout();
      router.push('/');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || user.role !== 'seller') return null;

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Seller Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Manage your referral storefront identity, payout destination, and notification alerts
        </p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="flex items-center gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2.5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-800">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
          <span>Settings and payout details updated successfully!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* 1. Public Profile & Storefront */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
            <Store className="w-4 h-4 text-violet-600" />
            <h2 className="text-base font-bold text-gray-900">Public Profile &amp; Storefront</h2>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Store / Display Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              placeholder="e.g. Sahil's Curated Courses"
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              required
            />
            <p className="text-xs text-gray-400 mt-1">
              What buyers see when landing on your product recommendations and referral transactions.
            </p>
          </div>
        </div>

        {/* 2. Contact Information */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
            <UserIcon className="w-4 h-4 text-violet-600" />
            <h2 className="text-base font-bold text-gray-900">Contact Information</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Sahil Verma"
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                required
              />
              <p className="text-xs text-gray-400 mt-1">Used for internal identity verification</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                WhatsApp / Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="9876543210"
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                required
              />
              <p className="text-xs text-gray-400 mt-1">For critical withdrawal updates &amp; payout support</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-gray-400" />
                Email Address (Read-Only)
              </span>
              <span className="text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Verified Google Account
              </span>
            </label>
            <input
              type="email"
              value={user.email || ''}
              disabled
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500 cursor-not-allowed font-medium"
            />
            <p className="text-xs text-gray-400 mt-1">Email is tied to your Google Auth login.</p>
          </div>
        </div>

        {/* 3. Payout Details (Critical) */}
        <div className="bg-white rounded-xl border-2 border-emerald-500/30 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              <h2 className="text-base font-bold text-gray-900">Payout Details</h2>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
              ₹0 Withdrawal Fees Above ₹500
            </span>
          </div>

          {/* UPI ID */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>UPI ID</span>
              <span className="text-[11px] font-normal text-emerald-600">Fastest for payouts under ₹10,000</span>
            </label>
            <input
              type="text"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              placeholder="e.g. sahil@okhdfcbank or 9876543210@paytm"
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
            />
            <p className="text-xs text-gray-400 mt-1">Instant settlements direct to Google Pay, PhonePe, or Paytm UPI.</p>
          </div>

          {/* Bank Details */}
          <div className="pt-2 border-t border-gray-100 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-600 uppercase tracking-wider">
              <Building2 className="w-3.5 h-3.5 text-gray-400" />
              Bank Account (For Larger Monthly Withdrawals)
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Account Holder Name</label>
              <input
                type="text"
                value={bankAccountHolder}
                onChange={(e) => setBankAccountHolder(e.target.value)}
                placeholder="Exact name as in bank passbook"
                className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Account Number</label>
                <input
                  type="text"
                  value={bankAccountNumber}
                  onChange={(e) => setBankAccountNumber(e.target.value)}
                  placeholder="e.g. 50100234567890"
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">IFSC Code</label>
                <input
                  type="text"
                  value={bankIfscCode}
                  onChange={(e) => setBankIfscCode(e.target.value.toUpperCase())}
                  placeholder="e.g. HDFC0001234"
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono uppercase"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 4. Commission Information (Read-Only) */}
        <div className="bg-slate-900 text-white rounded-xl p-5 sm:p-6 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <h2 className="text-base font-bold text-white">Commission Terms &amp; Settlement</h2>
            </div>
            <span className="text-xs font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2.5 py-0.5 rounded-full">
              Standard Seller Agreement
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 text-center">
            <div className="bg-slate-800/80 rounded-lg p-3 border border-slate-700/60">
              <span className="text-[11px] text-slate-400 block mb-1">Commission Rate</span>
              <span className="text-lg font-black text-emerald-400">10% Flat</span>
            </div>
            <div className="bg-slate-800/80 rounded-lg p-3 border border-slate-700/60">
              <span className="text-[11px] text-slate-400 block mb-1">Min. Withdrawal</span>
              <span className="text-lg font-black text-white">₹500</span>
            </div>
            <div className="bg-slate-800/80 rounded-lg p-3 border border-slate-700/60">
              <span className="text-[11px] text-slate-400 block mb-1">Payment Trigger</span>
              <span className="text-xs font-bold text-slate-200 mt-1 block">Course Access Grant</span>
            </div>
            <div className="bg-slate-800/80 rounded-lg p-3 border border-slate-700/60">
              <span className="text-[11px] text-slate-400 block mb-1">Payout Processing</span>
              <span className="text-xs font-bold text-emerald-400 mt-1 block">₹0 Fee (Free)</span>
            </div>
          </div>
          <p className="text-xs text-slate-400 pt-1 leading-relaxed">
            Commissions are credited directly into your in-app wallet the moment customer enrollment clears. Agent Croww covers 100% of payment gateway and IMPS transfer fees for withdrawals over ₹500.
          </p>
        </div>

        {/* 5. Notification Preferences */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6 shadow-xs space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
            <Bell className="w-4 h-4 text-violet-600" />
            <h2 className="text-base font-bold text-gray-900">Notification Preferences</h2>
          </div>

          <div className="divide-y divide-gray-100">
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-semibold text-gray-800">Customer Purchase Alerts</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Email me instantly when a customer completes a purchase through my link.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setNotifyCustomerPurchase(!notifyCustomerPurchase)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  notifyCustomerPurchase ? 'bg-violet-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    notifyCustomerPurchase ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-semibold text-gray-800">Withdrawal Processed Alerts</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Email me bank UTR confirmation when a payout withdrawal is completed.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setNotifyWithdrawalProcessed(!notifyWithdrawalProcessed)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  notifyWithdrawalProcessed ? 'bg-violet-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    notifyWithdrawalProcessed ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Submit Button - Highly Prominent */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto min-w-[240px] flex items-center justify-center gap-2.5 px-8 py-3.5 bg-violet-600 hover:bg-violet-700 active:bg-violet-800 disabled:opacity-50 text-white text-base font-bold rounded-xl transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 cursor-pointer"
          >
            <Save className="w-5 h-5" />
            {loading ? 'Saving Changes...' : 'Save Settings'}
          </button>
        </div>
      </form>

      {/* Account Danger Zone */}
      <div className="bg-white rounded-xl border border-red-200 p-5 sm:p-6 shadow-xs flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-gray-900">Sign Out</p>
          <p className="text-xs text-gray-400 mt-0.5">Safely log out of your seller account on this device</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
}