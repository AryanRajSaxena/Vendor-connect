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
  const [savedFields, setSavedFields] = useState<{
    storeName?: string;
    fullName?: string;
    phone?: string;
    upiId?: string;
    bankAccountHolder?: string;
    bankAccountNumber?: string;
    bankIfscCode?: string;
  }>({});
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

  // Field locking rules: ONLY lock a field if it was filled with a non-empty value and saved
  const isStoreNameLocked = Boolean(savedFields.storeName?.trim());
  const isFullNameLocked = Boolean(savedFields.fullName?.trim());
  const isPhoneLocked = Boolean(savedFields.phone?.trim());
  const isUpiLocked = Boolean(savedFields.upiId?.trim());
  const isBankAccountHolderLocked = Boolean(savedFields.bankAccountHolder?.trim());
  const isBankAccountNumberLocked = Boolean(savedFields.bankAccountNumber?.trim());
  const isBankIfscCodeLocked = Boolean(savedFields.bankIfscCode?.trim());

  const allFieldsLocked =
    isStoreNameLocked &&
    isFullNameLocked &&
    isPhoneLocked &&
    isUpiLocked &&
    isBankAccountHolderLocked &&
    isBankAccountNumberLocked &&
    isBankIfscCodeLocked;

  const hasAnyLocked =
    isStoreNameLocked ||
    isFullNameLocked ||
    isPhoneLocked ||
    isUpiLocked ||
    isBankAccountHolderLocked ||
    isBankAccountNumberLocked ||
    isBankIfscCodeLocked;

  useEffect(() => {
    if (!isLoading && user?.role !== 'seller') router.push('/');
    if (user) {
      const u = user as any;
      const initialStoreName = (u.businessName || u.business_name || u.store_name || '').trim();
      const initialFullName = (u.name || '').trim();
      const initialPhone = (u.phone || '').trim();
      let initialUpi = (u.upi_id || u.upiId || '').trim();
      let initialHolder = (u.bank_account_holder || u.bankAccountHolder || '').trim();
      let initialAccountNum = (u.account_number || u.accountNumber || '').trim();
      let initialIfsc = (u.ifsc_code || u.ifscCode || '').trim();

      // Load extended settings from localStorage
      try {
        const saved = localStorage.getItem(`seller_settings_${user.id}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (!initialUpi && parsed.upiId) initialUpi = parsed.upiId.trim();
          if (!initialHolder && parsed.bankAccountHolder) initialHolder = parsed.bankAccountHolder.trim();
          if (!initialAccountNum && parsed.bankAccountNumber) initialAccountNum = parsed.bankAccountNumber.trim();
          if (!initialIfsc && parsed.bankIfscCode) initialIfsc = parsed.bankIfscCode.trim();
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

      setStoreName(initialStoreName);
      setFullName(initialFullName);
      setPhone(initialPhone);
      setUpiId(initialUpi);
      setBankAccountHolder(initialHolder);
      setBankAccountNumber(initialAccountNum);
      setBankIfscCode(initialIfsc);

      // Only lock fields that have a non-empty saved value in the database/storage
      const savedMap: Record<string, string> = {};
      if (initialStoreName) savedMap.storeName = initialStoreName;
      if (initialFullName) savedMap.fullName = initialFullName;
      if (initialPhone) savedMap.phone = initialPhone;
      if (initialUpi) savedMap.upiId = initialUpi;
      if (initialHolder) savedMap.bankAccountHolder = initialHolder;
      if (initialAccountNum) savedMap.bankAccountNumber = initialAccountNum;
      if (initialIfsc) savedMap.bankIfscCode = initialIfsc;
      setSavedFields(savedMap);

      // Fresh sync from /api/users/${user.id}
      fetch(`/api/users/${user.id}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((dbUser) => {
          if (dbUser) {
            const dbStoreName = (dbUser.business_name || dbUser.store_name || dbUser.businessName || '').trim();
            const dbFullName = (dbUser.name || '').trim();
            const dbPhone = (dbUser.phone || '').trim();
            const dbUpi = (dbUser.upi_id || dbUser.upiId || '').trim();
            const dbHolder = (dbUser.bank_account_holder || dbUser.bankAccountHolder || '').trim();
            const dbAccountNum = (dbUser.account_number || dbUser.accountNumber || '').trim();
            const dbIfsc = (dbUser.ifsc_code || dbUser.ifscCode || '').trim();

            setSavedFields((prev) => {
              const updated = { ...prev };
              if (dbStoreName) { updated.storeName = dbStoreName; setStoreName((s) => s || dbStoreName); }
              if (dbFullName) { updated.fullName = dbFullName; setFullName((s) => s || dbFullName); }
              if (dbPhone) { updated.phone = dbPhone; setPhone((s) => s || dbPhone); }
              if (dbUpi) { updated.upiId = dbUpi; setUpiId((s) => s || dbUpi); }
              if (dbHolder) { updated.bankAccountHolder = dbHolder; setBankAccountHolder((s) => s || dbHolder); }
              if (dbAccountNum) { updated.bankAccountNumber = dbAccountNum; setBankAccountNumber((s) => s || dbAccountNum); }
              if (dbIfsc) { updated.bankIfscCode = dbIfsc; setBankIfscCode((s) => s || dbIfsc); }
              return updated;
            });
          }
        })
        .catch(() => {});

      // Fallback: Check seller's prior withdrawal requests for last-used upi_id
      fetch(`/api/withdrawals?sellerId=${user.id}`)
        .then((res) => res.json())
        .then((list) => {
          if (Array.isArray(list) && list.length > 0) {
            const previous = list.find((w: any) => w.upi_id);
            if (previous?.upi_id?.trim()) {
              const prevUpi = previous.upi_id.trim();
              setUpiId((curr) => curr || prevUpi);
              setSavedFields((prev) => (prev.upiId ? prev : { ...prev, upiId: prevUpi }));
            }
          }
        })
        .catch(() => {});
    }
  }, [user, isLoading, router]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (allFieldsLocked) return;

    if (!isStoreNameLocked && !storeName.trim()) {
      setError('Store Name / Display Name is required');
      return;
    }
    if (!isFullNameLocked && !fullName.trim()) {
      setError('Full Name is required');
      return;
    }
    if (!isPhoneLocked && !phone.trim()) {
      setError('Phone Number is required for verification');
      return;
    }

    if (!isBankAccountNumberLocked && bankAccountNumber.trim() && !bankIfscCode.trim()) {
      setError('Please provide Bank IFSC Code for your bank account');
      return;
    }

    // Check if there are any new fields entered that need to be saved
    const hasNewStoreName = !isStoreNameLocked && Boolean(storeName.trim());
    const hasNewFullName = !isFullNameLocked && Boolean(fullName.trim());
    const hasNewPhone = !isPhoneLocked && Boolean(phone.trim());
    const hasNewUpi = !isUpiLocked && Boolean(upiId.trim());
    const hasNewHolder = !isBankAccountHolderLocked && Boolean(bankAccountHolder.trim());
    const hasNewAccountNum = !isBankAccountNumberLocked && Boolean(bankAccountNumber.trim());
    const hasNewIfsc = !isBankIfscCodeLocked && Boolean(bankIfscCode.trim());

    const hasNewChanges =
      hasNewStoreName ||
      hasNewFullName ||
      hasNewPhone ||
      hasNewUpi ||
      hasNewHolder ||
      hasNewAccountNum ||
      hasNewIfsc;

    if (!hasNewChanges) {
      setError('No new details entered. Please fill in the unlocked fields before saving.');
      return;
    }

    // Trigger confirmation modal before saving and locking the newly entered details
    setShowConfirmModal(true);
  };

  const handleConfirmAndSave = async () => {
    setShowConfirmModal(false);
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const payload: Record<string, any> = {
        email: user?.email,
        role: 'seller',
      };

      if (storeName.trim()) payload.business_name = storeName.trim();
      if (fullName.trim()) payload.name = fullName.trim();
      if (phone.trim()) payload.phone = phone.trim();
      if (upiId.trim()) payload.upi_id = upiId.trim();
      if (bankAccountHolder.trim()) payload.bank_account_holder = bankAccountHolder.trim();
      if (bankAccountNumber.trim()) payload.account_number = bankAccountNumber.trim();
      if (bankIfscCode.trim()) payload.ifsc_code = bankIfscCode.trim().toUpperCase();

      const res = await fetch(`/api/users/${user!.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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
        account_number: bankAccountNumber.trim(),
        ifsc_code: bankIfscCode.trim().toUpperCase(),
        upi_id: upiId.trim(),
        ...extendedSettings,
      });

      // Update savedFields so filled fields are now locked
      setSavedFields((prev) => {
        const next = { ...prev };
        if (storeName.trim()) next.storeName = storeName.trim();
        if (fullName.trim()) next.fullName = fullName.trim();
        if (phone.trim()) next.phone = phone.trim();
        if (upiId.trim()) next.upiId = upiId.trim();
        if (bankAccountHolder.trim()) next.bankAccountHolder = bankAccountHolder.trim();
        if (bankAccountNumber.trim()) next.bankAccountNumber = bankAccountNumber.trim();
        if (bankIfscCode.trim()) next.bankIfscCode = bankIfscCode.trim().toUpperCase();
        return next;
      });

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
            {allFieldsLocked ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                <Lock className="w-3 h-3 text-emerald-700" />
                All Details Locked
              </span>
            ) : hasAnyLocked ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                <Lock className="w-3 h-3 text-amber-700" />
                Partially Locked
              </span>
            ) : null}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage your referral storefront identity, payout destination, and notification alerts
          </p>
        </div>

        {hasAnyLocked && (
          <a
            href="mailto:team@agentcroww.com?subject=Request%20to%20Update%20Seller%20Payout%20Details"
            className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5 text-gray-500" />
            Request Edit
          </a>
        )}
      </div>

      {/* Lock Notice Banner */}
      {allFieldsLocked ? (
        <div className="flex items-start gap-3 p-4 bg-amber-50/90 border border-amber-200 rounded-xl text-amber-900 text-xs sm:text-sm">
          <Lock className="w-5 h-5 flex-shrink-0 text-amber-600 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-amber-950">All Profile &amp; Payout Details are Locked</p>
            <p className="text-amber-800 leading-relaxed text-xs">
              To prevent commission diversion and unauthorized payout tampering, your identity and banking credentials are permanently locked. If you need to update any details, please contact{' '}
              <a href="mailto:team@agentcroww.com" className="font-semibold underline hover:text-amber-950">
                team@agentcroww.com
              </a>{' '}
              for identity verification.
            </p>
          </div>
        </div>
      ) : hasAnyLocked ? (
        <div className="flex items-start gap-3 p-4 bg-amber-50/90 border border-amber-200 rounded-xl text-amber-900 text-xs sm:text-sm">
          <Lock className="w-5 h-5 flex-shrink-0 text-amber-600 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-amber-950">Saved Details are Permanently Locked</p>
            <p className="text-amber-800 leading-relaxed text-xs">
              Your saved identity and payout details are locked for security. You can still fill and save any remaining unlocked fields below.
            </p>
          </div>
        </div>
      ) : null}

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
            {isStoreNameLocked && <Lock className="w-3.5 h-3.5 text-gray-400" />}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Store / Display Name <span className="text-red-500">*</span></span>
              {isStoreNameLocked && (
                <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded flex items-center gap-1 font-semibold">
                  <Lock className="w-2.5 h-2.5" /> Locked
                </span>
              )}
            </label>
            <input
              type="text"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              disabled={isStoreNameLocked}
              placeholder="e.g. Sahil's Curated Courses"
              className={`w-full px-3.5 py-2.5 border rounded-lg text-sm transition-all ${
                isStoreNameLocked
                  ? 'bg-gray-50 border-gray-200 text-gray-700 cursor-not-allowed select-none'
                  : 'bg-white border-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-500'
              }`}
              required
            />
            <p className="text-xs text-gray-400 mt-1">
              {isStoreNameLocked
                ? 'Store name is verified and locked to protect referral integrity.'
                : 'What buyers see when landing on your product recommendations and referral transactions.'}
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
            {isFullNameLocked && isPhoneLocked && <Lock className="w-3.5 h-3.5 text-gray-400" />}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>Full Name <span className="text-red-500">*</span></span>
                {isFullNameLocked && (
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded flex items-center gap-1 font-semibold">
                    <Lock className="w-2.5 h-2.5" /> Locked
                  </span>
                )}
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={isFullNameLocked}
                placeholder="Sahil Verma"
                className={`w-full px-3.5 py-2.5 border rounded-lg text-sm transition-all ${
                  isFullNameLocked
                    ? 'bg-gray-50 border-gray-200 text-gray-700 cursor-not-allowed select-none'
                    : 'bg-white border-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-500'
                }`}
                required
              />
              <p className="text-xs text-gray-400 mt-1">Used for internal identity verification</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>WhatsApp / Phone Number <span className="text-red-500">*</span></span>
                {isPhoneLocked && (
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded flex items-center gap-1 font-semibold">
                    <Lock className="w-2.5 h-2.5" /> Locked
                  </span>
                )}
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={isPhoneLocked}
                placeholder="9876543210"
                className={`w-full px-3.5 py-2.5 border rounded-lg text-sm transition-all ${
                  isPhoneLocked
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
              {(isUpiLocked || isBankAccountNumberLocked) && (
                <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Lock className="w-3 h-3 text-gray-500" /> Locked &amp; Saved
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
              <span className="flex items-center gap-1.5">
                UPI ID
                {isUpiLocked && (
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded flex items-center gap-1 font-semibold">
                    <Lock className="w-2.5 h-2.5" /> Locked
                  </span>
                )}
              </span>
              <span className="text-[11px] font-normal text-emerald-600">Fastest for payouts under ₹10,000</span>
            </label>
            <input
              type="text"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              disabled={isUpiLocked}
              placeholder="e.g. sahil@okhdfcbank or 9876543210@paytm"
              className={`w-full px-3.5 py-2.5 border rounded-lg text-sm font-mono transition-all ${
                isUpiLocked
                  ? 'bg-gray-50 border-gray-200 text-gray-700 cursor-not-allowed select-none'
                  : 'bg-white border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500'
              }`}
            />
            <p className="text-xs text-gray-400 mt-1">
              {isUpiLocked
                ? 'UPI ID is verified and locked to guarantee payout delivery.'
                : 'Settlements processed within 48 working hours direct to Google Pay, PhonePe, or Paytm UPI.'}
            </p>
          </div>

          {/* Bank Details */}
          <div className="pt-2 border-t border-gray-100 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-600 uppercase tracking-wider">
              <Building2 className="w-3.5 h-3.5 text-gray-400" />
              Bank Account (For Larger Monthly Withdrawals)
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1 flex items-center justify-between">
                <span>Account Holder Name</span>
                {isBankAccountHolderLocked && (
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded flex items-center gap-1 font-semibold">
                    <Lock className="w-2.5 h-2.5" /> Locked
                  </span>
                )}
              </label>
              <input
                type="text"
                value={bankAccountHolder}
                onChange={(e) => setBankAccountHolder(e.target.value)}
                disabled={isBankAccountHolderLocked}
                placeholder="Exact name as in bank passbook"
                className={`w-full px-3.5 py-2 border rounded-lg text-sm transition-all ${
                  isBankAccountHolderLocked
                    ? 'bg-gray-50 border-gray-200 text-gray-700 cursor-not-allowed select-none'
                    : 'bg-white border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500'
                }`}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1 flex items-center justify-between">
                  <span>Account Number</span>
                  {isBankAccountNumberLocked && (
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded flex items-center gap-1 font-semibold">
                      <Lock className="w-2.5 h-2.5" /> Locked
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  value={bankAccountNumber}
                  onChange={(e) => setBankAccountNumber(e.target.value)}
                  disabled={isBankAccountNumberLocked}
                  placeholder="e.g. 50100234567890"
                  className={`w-full px-3.5 py-2 border rounded-lg text-sm font-mono transition-all ${
                    isBankAccountNumberLocked
                      ? 'bg-gray-50 border-gray-200 text-gray-700 cursor-not-allowed select-none'
                      : 'bg-white border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500'
                  }`}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1 flex items-center justify-between">
                  <span>IFSC Code</span>
                  {isBankIfscCodeLocked && (
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded flex items-center gap-1 font-semibold">
                      <Lock className="w-2.5 h-2.5" /> Locked
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  value={bankIfscCode}
                  onChange={(e) => setBankIfscCode(e.target.value.toUpperCase())}
                  disabled={isBankIfscCodeLocked}
                  placeholder="e.g. HDFC0001234"
                  className={`w-full px-3.5 py-2 border rounded-lg text-sm font-mono uppercase transition-all ${
                    isBankIfscCodeLocked
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
          {allFieldsLocked ? (
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 bg-gray-100 text-gray-500 font-bold rounded-xl border border-gray-200 select-none">
                <Lock className="w-5 h-5 text-gray-400" />
                All Settings Locked &amp; Saved
              </div>
              <a
                href="mailto:team@agentcroww.com?subject=Request%20to%20Update%20Seller%20Payout%20Details"
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
              <strong>Filled fields will be permanently locked upon saving.</strong>
              <p className="mt-1 text-amber-800">
                To protect your earnings against unauthorized changes and payout diversion, filled banking information and identity details will be permanently locked upon confirmation.
              </p>
            </div>

            {/* Snapshot of details being locked */}
            <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-200 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Store / Display Name:</span>
                <span className="font-semibold text-gray-800 flex items-center gap-1">
                  {storeName || '—'} {isStoreNameLocked && <Lock className="w-3 h-3 text-gray-400" />}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Full Name:</span>
                <span className="font-semibold text-gray-800 flex items-center gap-1">
                  {fullName || '—'} {isFullNameLocked && <Lock className="w-3 h-3 text-gray-400" />}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Phone Number:</span>
                <span className="font-semibold text-gray-800 flex items-center gap-1">
                  {phone || '—'} {isPhoneLocked && <Lock className="w-3 h-3 text-gray-400" />}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">UPI ID:</span>
                <span className="font-mono font-semibold text-gray-800 flex items-center gap-1">
                  {upiId || '—'} {isUpiLocked && <Lock className="w-3 h-3 text-gray-400" />}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Bank Account:</span>
                <span className="font-mono font-semibold text-gray-800 flex items-center gap-1">
                  {bankAccountNumber ? `•••• ${bankAccountNumber.slice(-4)}` : '—'} {isBankAccountNumberLocked && <Lock className="w-3 h-3 text-gray-400" />}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">IFSC Code:</span>
                <span className="font-mono font-semibold text-gray-800 flex items-center gap-1">
                  {bankIfscCode || '—'} {isBankIfscCodeLocked && <Lock className="w-3 h-3 text-gray-400" />}
                </span>
              </div>
            </div>
            <p className="text-[11px] text-gray-500 italic">
              Note: Unfilled fields will remain unlocked and can be completed whenever you choose.
            </p>

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