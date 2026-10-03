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
  Lock,
  AlertTriangle,
  HelpCircle,
} from 'lucide-react';

export default function SellerSettings() {
  const router = useRouter();
  const { user, isLoading, updateUser, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

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
      if (u.upi_id || u.upiId) setUpiId(u.upi_id || u.upiId);

      // Check if previously locked
      const lockedStatus = localStorage.getItem(`seller_settings_locked_${user.id}`);
      if (lockedStatus === 'true' || (u.account_number && u.name && u.phone)) {
        setIsLocked(true);
      }

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

      // Fallback: Check seller's prior withdrawal requests for last-used upi_id
      fetch(`/api/withdrawals?sellerId=${user.id}`)
        .then((res) => res.json())
        .then((list) => {
          if (Array.isArray(list) && list.length > 0) {
            const previous = list.find((w: any) => w.upi_id);
            if (previous?.upi_id) {
              setUpiId((curr) => curr || previous.upi_id);
            }
          }
        })
        .catch(() => {});
    }
  }, [user, isLoading, router]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isLocked) return;

    if (!storeName.trim()) {
      setError('Store Name / Display Name is required');
      return;
    }
    if (!fullName.trim()) {
      setError('Full Name is required');
      return;
    }
    if (!phone.trim()) {
      setError('Phone Number is required for verification');
      return;
    }

    // Trigger irreversible warning confirmation modal before saving
    setShowConfirmModal(true);
  };

  const handleConfirmAndSave = async () => {
    setShowConfirmModal(false);
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Update core user in database (including bank account, IFSC, and UPI ID on public.users)
      const res = await fetch(`/api/users/${user!.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user?.email,
          role: 'seller',
          name: fullName.trim(),
          phone: phone.trim(),
          business_name: storeName.trim(),
          account_number: bankAccountNumber.trim(),
          ifsc_code: bankIfscCode.trim().toUpperCase(),
          upi_id: upiId.trim(),
          is_locked: true,
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
      localStorage.setItem(`seller_settings_locked_${user!.id}`, 'true');

      updateUser({
        name: fullName.trim(),
        phone: phone.trim(),
        businessName: storeName.trim(),
        account_number: bankAccountNumber.trim(),
        ifsc_code: bankIfscCode.trim().toUpperCase(),
        upi_id: upiId.trim(),
        ...extendedSettings,
      });

      setIsLocked(true);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 5000);
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
            Seller Settings
            {isLocked && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                <Lock className="w-3 h-3 text-emerald-700" />
                Locked &amp; Verified
              </span>
            )}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage your referral storefront identity, payout destination, and notification alerts
          </p>
        </div>

        {isLocked && (
          <a
            href="mailto:support@agentcroww.com?subject=Request%20to%20Update%20Seller%20Payout%20Details"
            className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5 text-gray-500" />
            Request Edit
          </a>
        )}
      </div>

      {/* Lock Notice Banner */}
      {isLocked && (
        <div className="flex items-start gap-3 p-4 bg-amber-50/90 border border-amber-200 rounded-xl text-amber-900 text-xs sm:text-sm">
          <Lock className="w-5 h-5 flex-shrink-0 text-amber-600 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-amber-950">Profile &amp; Payout Details are Locked</p>
            <p className="text-amber-800 leading-relaxed text-xs">
              To prevent commission diversion and unauthorized payout tampering, your identity and banking credentials are permanently locked. If you need to update your UPI ID or bank account, please contact{' '}
              <a href="mailto:support@agentcroww.com" className="font-semibold underline hover:text-amber-950">
                support@agentcroww.com
              </a>{' '}
              for identity verification.
            </p>
          </div>
        </div>
      )}

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
          <span>Settings and payout details saved and locked successfully!</span>
        </div>
      )}

      <form onSubmit={handleFormSubmit} className="space-y-6">
        {/* 1. Public Profile & Storefront */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Store className="w-4 h-4 text-violet-600" />
              <h2 className="text-base font-bold text-gray-900">Public Profile &amp; Storefront</h2>
            </div>
            {isLocked && <Lock className="w-3.5 h-3.5 text-gray-400" />}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Store / Display Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              disabled={isLocked}
              placeholder="e.g. Sahil's Curated Courses"
              className={`w-full px-3.5 py-2.5 border rounded-lg text-sm transition-all ${
                isLocked
                  ? 'bg-gray-50 border-gray-200 text-gray-700 cursor-not-allowed select-none'
                  : 'bg-white border-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-500'
              }`}
              required
            />
            <p className="text-xs text-gray-400 mt-1">
              What buyers see when landing on your product recommendations and referral transactions.
            </p>
          </div>
        </div>

        {/* 2. Contact Information */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <UserIcon className="w-4 h-4 text-violet-600" />
              <h2 className="text-base font-bold text-gray-900">Contact Information</h2>
            </div>
            {isLocked && <Lock className="w-3.5 h-3.5 text-gray-400" />}
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
                disabled={isLocked}
                placeholder="Sahil Verma"
                className={`w-full px-3.5 py-2.5 border rounded-lg text-sm transition-all ${
                  isLocked
                    ? 'bg-gray-50 border-gray-200 text-gray-700 cursor-not-allowed select-none'
                    : 'bg-white border-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-500'
                }`}
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
                disabled={isLocked}
                placeholder="9876543210"
                className={`w-full px-3.5 py-2.5 border rounded-lg text-sm transition-all ${
                  isLocked
                    ? 'bg-gray-50 border-gray-200 text-gray-700 cursor-not-allowed select-none'
                    : 'bg-white border-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-500'
                }`}
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
            <div className="flex items-center gap-2">
              {isLocked && (
                <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Lock className="w-3 h-3 text-gray-500" /> Locked
                </span>
              )}
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                ₹0 Withdrawal Fees Above ₹500
              </span>
            </div>
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
              disabled={isLocked}
              placeholder="e.g. sahil@okhdfcbank or 9876543210@paytm"
              className={`w-full px-3.5 py-2.5 border rounded-lg text-sm font-mono transition-all ${
                isLocked
                  ? 'bg-gray-50 border-gray-200 text-gray-700 cursor-not-allowed select-none'
                  : 'bg-white border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500'
              }`}
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
                disabled={isLocked}
                placeholder="Exact name as in bank passbook"
                className={`w-full px-3.5 py-2 border rounded-lg text-sm transition-all ${
                  isLocked
                    ? 'bg-gray-50 border-gray-200 text-gray-700 cursor-not-allowed select-none'
                    : 'bg-white border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500'
                }`}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Account Number</label>
                <input
                  type="text"
                  value={bankAccountNumber}
                  onChange={(e) => setBankAccountNumber(e.target.value)}
                  disabled={isLocked}
                  placeholder="e.g. 50100234567890"
                  className={`w-full px-3.5 py-2 border rounded-lg text-sm font-mono transition-all ${
                    isLocked
                      ? 'bg-gray-50 border-gray-200 text-gray-700 cursor-not-allowed select-none'
                      : 'bg-white border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500'
                  }`}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">IFSC Code</label>
                <input
                  type="text"
                  value={bankIfscCode}
                  onChange={(e) => setBankIfscCode(e.target.value.toUpperCase())}
                  disabled={isLocked}
                  placeholder="e.g. HDFC0001234"
                  className={`w-full px-3.5 py-2 border rounded-lg text-sm font-mono uppercase transition-all ${
                    isLocked
                      ? 'bg-gray-50 border-gray-200 text-gray-700 cursor-not-allowed select-none'
                      : 'bg-white border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500'
                  }`}
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

        {/* Submit or Locked Action Controls */}
        <div className="pt-2">
          {isLocked ? (
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 bg-gray-100 text-gray-500 font-bold rounded-xl border border-gray-200 select-none">
                <Lock className="w-5 h-5 text-gray-400" />
                Settings Locked &amp; Saved
              </div>
              <a
                href="mailto:support@agentcroww.com?subject=Request%20to%20Update%20Seller%20Payout%20Details"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-white text-gray-700 hover:text-gray-900 border border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors"
              >
                <HelpCircle className="w-4 h-4 text-gray-500" />
                Contact Support to Request Edit
              </a>
            </div>
          ) : (
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto min-w-[240px] flex items-center justify-center gap-2.5 px-8 py-3.5 bg-violet-600 hover:bg-violet-700 active:bg-violet-800 disabled:opacity-50 text-white text-base font-bold rounded-xl transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 cursor-pointer"
            >
              <Save className="w-5 h-5" />
              {loading ? 'Saving Changes...' : 'Save Settings'}
            </button>
          )}
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

      {/* Warning Confirmation Modal Before Permanent Lock */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-5">
            <div className="flex items-start gap-3.5">
              <div className="p-3 bg-amber-100 text-amber-700 rounded-xl flex-shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Warning: Permanent Lock</h3>
                <p className="text-xs text-gray-500 mt-0.5">Please review your credentials carefully.</p>
              </div>
            </div>

            <div className="p-3.5 bg-amber-50/80 border border-amber-200/80 rounded-xl text-xs text-amber-900 leading-relaxed">
              <strong>You will not be able to edit these fields after saving.</strong>
              <p className="mt-1 text-amber-800">
                To protect your earnings against unauthorized changes and payout diversion, your banking information and identity details will be permanently locked upon confirmation.
              </p>
            </div>

            {/* Snapshot of details being locked */}
            <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Store / Display Name:</span>
                <span className="font-semibold text-gray-800">{storeName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Full Name:</span>
                <span className="font-semibold text-gray-800">{fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Phone Number:</span>
                <span className="font-semibold text-gray-800">{phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">UPI ID:</span>
                <span className="font-mono font-semibold text-gray-800">{upiId || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Bank Account:</span>
                <span className="font-mono font-semibold text-gray-800">
                  {bankAccountNumber ? `•••• ${bankAccountNumber.slice(-4)}` : '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">IFSC Code:</span>
                <span className="font-mono font-semibold text-gray-800">{bankIfscCode || '—'}</span>
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold text-gray-600 hover:text-gray-800 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Go Back &amp; Edit
              </button>
              <button
                type="button"
                onClick={handleConfirmAndSave}
                disabled={loading}
                className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold text-white bg-violet-600 hover:bg-violet-700 active:bg-violet-800 rounded-xl shadow-sm transition-colors flex items-center justify-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5" />
                {loading ? 'Locking & Saving...' : 'Confirm & Lock Details'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}