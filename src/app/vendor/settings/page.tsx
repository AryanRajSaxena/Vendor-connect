'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import {
  AlertCircle,
  Save,
  Mail,
  LogOut,
  Building2,
  Phone,
  CreditCard,
  CheckCircle2,
  Bell,
  ShieldCheck,
  Info,
  Lock,
  AlertTriangle,
  HelpCircle,
} from 'lucide-react';

export default function VendorSettings() {
  const router = useRouter();
  const { user, isLoading, updateUser, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Business Profile
  const [businessName, setBusinessName] = useState('');
  const [name, setName] = useState('');
  const [supportEmail, setSupportEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [panNumber, setPanNumber] = useState('');

  // Payout Details
  const [bankAccountHolder, setBankAccountHolder] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankIfscCode, setBankIfscCode] = useState('');

  // Notification Preferences
  const [notifyInstantPayment, setNotifyInstantPayment] = useState(true);
  const [notifyDailySummary, setNotifyDailySummary] = useState(true);

  useEffect(() => {
    if (!isLoading && user?.role !== 'vendor') router.push('/');
    if (user) {
      const u = user as any;
      setBusinessName(u.businessName || u.business_name || '');
      setName(u.name || '');
      setPhone(u.phone || '');
      if (u.supportEmail || u.support_email) setSupportEmail(u.supportEmail || u.support_email);
      if (u.gstNumber || u.gst_number) setGstNumber(u.gstNumber || u.gst_number);
      if (u.panNumber || u.pan_number) setPanNumber(u.panNumber || u.pan_number);
      if (u.bankAccountHolder || u.bank_account_holder) setBankAccountHolder(u.bankAccountHolder || u.bank_account_holder);
      if (u.account_number || u.accountNumber) setBankAccountNumber(u.account_number || u.accountNumber);
      if (u.ifsc_code || u.ifscCode) setBankIfscCode(u.ifsc_code || u.ifscCode);

      // Check if locked
      if (u.is_locked || u.isLocked) {
        setIsLocked(true);
      } else {
        const lockedStatus = localStorage.getItem(`vendor_settings_locked_${user.id}`);
        if (lockedStatus === 'true' || (u.account_number && u.name && u.phone && (u.businessName || u.business_name))) {
          setIsLocked(true);
        }
      }

      // Load extended vendor settings from localStorage fallback
      try {
        const saved = localStorage.getItem(`vendor_settings_${user.id}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.supportEmail && !u.support_email) setSupportEmail(parsed.supportEmail);
          if (parsed.gstNumber && !u.gst_number) setGstNumber(parsed.gstNumber);
          if (parsed.panNumber && !u.pan_number) setPanNumber(parsed.panNumber);
          if (parsed.bankAccountHolder && !u.bank_account_holder) setBankAccountHolder(parsed.bankAccountHolder);
          if (parsed.bankAccountNumber && !u.account_number) setBankAccountNumber(parsed.bankAccountNumber);
          if (parsed.bankIfscCode && !u.ifsc_code) setBankIfscCode(parsed.bankIfscCode);
          if (typeof parsed.notifyInstantPayment === 'boolean') {
            setNotifyInstantPayment(parsed.notifyInstantPayment);
          }
          if (typeof parsed.notifyDailySummary === 'boolean') {
            setNotifyDailySummary(parsed.notifyDailySummary);
          }
        }
      } catch (e) {
        console.warn('Failed to parse vendor settings from storage', e);
      }
    }
  }, [user, isLoading, router]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isLocked) return;

    if (!businessName.trim()) {
      setError('Creator / Company Name is required');
      return;
    }
    if (!name.trim()) {
      setError('Owner / Contact Name is required');
      return;
    }
    if (!phone.trim()) {
      setError('Phone Number is required for order coordination');
      return;
    }
    if (!bankAccountNumber.trim()) {
      setError('Bank Account Number is required for 80% revenue remittances');
      return;
    }
    if (!bankIfscCode.trim()) {
      setError('Bank IFSC Code is required');
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
      const payload = {
        name: name.trim(),
        phone: phone.trim(),
        business_name: businessName.trim(),
        support_email: supportEmail.trim(),
        gst_number: gstNumber.trim().toUpperCase(),
        pan_number: panNumber.trim().toUpperCase(),
        bank_account_holder: bankAccountHolder.trim(),
        account_number: bankAccountNumber.trim(),
        ifsc_code: bankIfscCode.trim().toUpperCase(),
        is_locked: true,
      };

      // Update in database (saves to public.users and public.vendors)
      const res = await fetch(`/api/users/${user!.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to update vendor profile');
      }

      // Persist extended vendor settings locally
      const extendedSettings = {
        businessName: businessName.trim(),
        supportEmail: supportEmail.trim(),
        gstNumber: gstNumber.trim().toUpperCase(),
        panNumber: panNumber.trim().toUpperCase(),
        bankAccountHolder: bankAccountHolder.trim(),
        bankAccountNumber: bankAccountNumber.trim(),
        bankIfscCode: bankIfscCode.trim().toUpperCase(),
        notifyInstantPayment,
        notifyDailySummary,
        isLocked: true,
      };

      localStorage.setItem(`vendor_settings_${user!.id}`, JSON.stringify(extendedSettings));
      localStorage.setItem(`vendor_settings_locked_${user!.id}`, 'true');

      updateUser({
        name: name.trim(),
        phone: phone.trim(),
        account_number: bankAccountNumber.trim(),
        ifsc_code: bankIfscCode.trim().toUpperCase(),
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
    if (confirm('Are you sure you want to sign out of your vendor account?')) {
      logout();
      router.push('/');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || user.role !== 'vendor') return null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-gray-200">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 mb-2">
            <Building2 className="w-3.5 h-3.5" />
            Vendor &amp; Creator Portal
            {isLocked && (
              <span className="ml-1 inline-flex items-center gap-1 text-emerald-800 font-bold">
                • <Lock className="w-3 h-3" /> Locked &amp; Verified
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            Settings &amp; Business Profile
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your creator brand details, tax identification, and 80% revenue bank remittances.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {isLocked && (
            <a
              href="mailto:support@agentcroww.com?subject=Request%20to%20Update%20Vendor%20Business%20Details"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors"
            >
              <HelpCircle className="w-3.5 h-3.5 text-gray-500" />
              Request Edit
            </a>
          )}
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100/70 border border-red-200 rounded-lg transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Lock Notice Banner */}
      {isLocked && (
        <div className="flex items-start gap-3 p-4 bg-amber-50/90 border border-amber-200 rounded-xl text-amber-900 text-xs sm:text-sm">
          <Lock className="w-5 h-5 flex-shrink-0 text-amber-600 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-amber-950">Creator &amp; Payout Details are Locked</p>
            <p className="text-amber-800 leading-relaxed text-xs">
              To safeguard your 80% revenue share bank remittances and protect your creator storefront against unauthorized modification, these fields are permanently locked. If you need to update bank account, GSTIN, PAN, or company registration details, contact{' '}
              <a href="mailto:support@agentcroww.com" className="font-semibold underline hover:text-amber-950">
                support@agentcroww.com
              </a>{' '}
              for identity verification.
            </p>
          </div>
        </div>
      )}

      {/* Notifications / Alerts */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" />
          <span>Vendor business profile and payout settings saved and locked successfully!</span>
        </div>
      )}

      <form onSubmit={handleFormSubmit} className="space-y-8">
        {/* SECTION 1: BUSINESS PROFILE */}
        <section className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-7 shadow-sm">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-600">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-900">Business Profile</h2>
                <p className="text-xs text-gray-500">
                  Your official brand identity displayed across the Agent Croww digital course marketplace.
                </p>
              </div>
            </div>
            {isLocked && <Lock className="w-4 h-4 text-gray-400" />}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Creator / Company Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                disabled={isLocked}
                placeholder="e.g., CodeSprint Academy or Vikram Verma"
                className={`w-full px-3.5 py-2.5 border rounded-xl text-sm transition-all ${
                  isLocked
                    ? 'bg-gray-50 border-gray-200 text-gray-700 cursor-not-allowed select-none'
                    : 'bg-gray-50/50 border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500'
                }`}
                required
              />
              <p className="text-[11px] text-gray-400 mt-1">
                The official creator/brand name shown to buyers and outbound sellers.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Support Email (Buyer-Facing)
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={supportEmail}
                  onChange={(e) => setSupportEmail(e.target.value)}
                  disabled={isLocked}
                  placeholder="support@youracademy.com"
                  className={`w-full pl-9 pr-3.5 py-2.5 border rounded-xl text-sm transition-all ${
                    isLocked
                      ? 'bg-gray-50 border-gray-200 text-gray-700 cursor-not-allowed select-none'
                      : 'bg-gray-50/50 border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500'
                  }`}
                />
                <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              </div>
              <p className="text-[11px] text-gray-400 mt-1">
                The contact email students see for login credentials or LMS onboarding questions.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Owner / Manager Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLocked}
                placeholder="Your legal full name"
                className={`w-full px-3.5 py-2.5 border rounded-xl text-sm transition-all ${
                  isLocked
                    ? 'bg-gray-50 border-gray-200 text-gray-700 cursor-not-allowed select-none'
                    : 'bg-gray-50/50 border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500'
                }`}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Contact Phone / WhatsApp <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={isLocked}
                  placeholder="e.g., 9876543210"
                  className={`w-full pl-9 pr-3.5 py-2.5 border rounded-xl text-sm transition-all ${
                    isLocked
                      ? 'bg-gray-50 border-gray-200 text-gray-700 cursor-not-allowed select-none'
                      : 'bg-gray-50/50 border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500'
                  }`}
                  required
                />
                <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              </div>
              <p className="text-[11px] text-gray-400 mt-1">
                Used for urgent order fulfillment escalations and bank settlement alerts.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                GSTIN / Tax ID <span className="text-xs font-normal text-gray-400 lowercase">(optional)</span>
              </label>
              <input
                type="text"
                value={gstNumber}
                onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
                disabled={isLocked}
                placeholder="e.g., 27ABCDE1234F1Z5"
                className={`w-full px-3.5 py-2.5 border rounded-xl text-sm font-mono transition-all ${
                  isLocked
                    ? 'bg-gray-50 border-gray-200 text-gray-700 cursor-not-allowed select-none'
                    : 'bg-gray-50/50 border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500'
                }`}
              />
              <p className="text-[11px] text-gray-400 mt-1">
                For Indian GST compliance and B2B invoice generation as your sales scale.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                PAN Number <span className="text-xs font-normal text-gray-400 lowercase">(optional)</span>
              </label>
              <input
                type="text"
                value={panNumber}
                onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                disabled={isLocked}
                placeholder="e.g., ABCDE1234F"
                className={`w-full px-3.5 py-2.5 border rounded-xl text-sm font-mono transition-all ${
                  isLocked
                    ? 'bg-gray-50 border-gray-200 text-gray-700 cursor-not-allowed select-none'
                    : 'bg-gray-50/50 border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500'
                }`}
              />
              <p className="text-[11px] text-gray-400 mt-1">
                Required for annual TDS reporting on marketplace sales disbursements.
              </p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Account Login Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full pl-9 pr-3.5 py-2.5 bg-gray-100/80 border border-gray-200 rounded-xl text-sm text-gray-500 cursor-not-allowed select-none"
                />
                <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              </div>
              <p className="text-[11px] text-gray-400 mt-1">
                Authenticated primary account login. Contact support to update login credentials.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 2: PAYOUT DETAILS */}
        <section className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-7 shadow-sm">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-600">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-900">Payout Details (80% Revenue Share)</h2>
                <p className="text-xs text-gray-500">
                  Where you receive your 80% direct earnings via NEFT/RTGS bank transfers for all course sales.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isLocked && (
                <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Lock className="w-3 h-3 text-gray-500" /> Locked
                </span>
              )}
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-100/70 text-emerald-800">
                <ShieldCheck className="w-3.5 h-3.5" />
                80% Creator Cut
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Bank Account Holder Name
              </label>
              <input
                type="text"
                value={bankAccountHolder}
                onChange={(e) => setBankAccountHolder(e.target.value)}
                disabled={isLocked}
                placeholder="Full Name as registered with your bank"
                className={`w-full px-3.5 py-2.5 border rounded-xl text-sm transition-all ${
                  isLocked
                    ? 'bg-gray-50 border-gray-200 text-gray-700 cursor-not-allowed select-none'
                    : 'bg-gray-50/50 border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500'
                }`}
              />
              <p className="text-[11px] text-gray-400 mt-1">
                Must match your GST registration or business entity PAN to avoid bank remittance delays.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Bank Account Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={bankAccountNumber}
                onChange={(e) => setBankAccountNumber(e.target.value.replace(/\s+/g, ''))}
                disabled={isLocked}
                placeholder="e.g., 912010045678912"
                className={`w-full px-3.5 py-2.5 border rounded-xl text-sm font-mono transition-all ${
                  isLocked
                    ? 'bg-gray-50 border-gray-200 text-gray-700 cursor-not-allowed select-none'
                    : 'bg-gray-50/50 border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500'
                }`}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Bank IFSC Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={bankIfscCode}
                onChange={(e) => setBankIfscCode(e.target.value.toUpperCase())}
                disabled={isLocked}
                placeholder="e.g., HDFC0000123"
                className={`w-full px-3.5 py-2.5 border rounded-xl text-sm font-mono uppercase transition-all ${
                  isLocked
                    ? 'bg-gray-50 border-gray-200 text-gray-700 cursor-not-allowed select-none'
                    : 'bg-gray-50/50 border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500'
                }`}
                required
              />
              <p className="text-[11px] text-gray-400 mt-1">11-character Indian Financial System Code.</p>
            </div>
          </div>

          <div className="mt-5 p-3.5 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between text-xs text-gray-600">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>
                <strong>Automatic 80% Distribution:</strong> Settle directly into this bank account upon student access confirmation.
              </span>
            </div>
            <span className="font-semibold text-emerald-700 hidden sm:inline">₹0 Processing Fee</span>
          </div>
        </section>

        {/* SECTION 3: NOTIFICATION PREFERENCES */}
        <section className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-7 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-blue-50 border border-blue-100 rounded-xl text-blue-600">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">Notification Preferences</h2>
              <p className="text-xs text-gray-500">Choose how and when you receive enrollment alerts.</p>
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            <div className="py-4 flex items-center justify-between first:pt-0">
              <div className="pr-4">
                <p className="text-sm font-semibold text-gray-900">
                  Instant Payment &amp; Sale Alerts
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Receive an immediate email with student contact info &amp; enrollment details when a sale closes.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                <input
                  type="checkbox"
                  checked={notifyInstantPayment}
                  onChange={(e) => setNotifyInstantPayment(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            <div className="py-4 flex items-center justify-between last:pb-0">
              <div className="pr-4">
                <p className="text-sm font-semibold text-gray-900">
                  Daily Sales &amp; Revenue Summary
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Get a consolidated evening digest of total student signups, revenue generated, and seller activity.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                <input
                  type="checkbox"
                  checked={notifyDailySummary}
                  onChange={(e) => setNotifyDailySummary(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>
          </div>
        </section>

        {/* Form Action Controls */}
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3">
          {isLocked ? (
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 bg-gray-100 text-gray-500 font-bold rounded-xl border border-gray-200 select-none">
                <Lock className="w-5 h-5 text-gray-400" />
                Settings Locked &amp; Saved
              </div>
              <a
                href="mailto:support@agentcroww.com?subject=Request%20to%20Update%20Vendor%20Business%20Details"
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
              className="w-full sm:w-auto min-w-[240px] inline-flex items-center justify-center gap-2.5 px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-base font-bold rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-5 h-5" />
              {loading ? 'Saving Settings...' : 'Save All Changes'}
            </button>
          )}
        </div>
      </form>

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
                To safeguard your 80% revenue remittances and protect your creator storefront against unauthorized modification, your business identity and bank payout details will be permanently locked upon confirmation.
              </p>
            </div>

            {/* Snapshot of details being locked */}
            <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Creator / Brand:</span>
                <span className="font-semibold text-gray-800">{businessName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Support Email:</span>
                <span className="font-semibold text-gray-800">{supportEmail || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Owner Name:</span>
                <span className="font-semibold text-gray-800">{name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Phone Number:</span>
                <span className="font-semibold text-gray-800">{phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">GSTIN / Tax ID:</span>
                <span className="font-mono font-semibold text-gray-800">{gstNumber || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">PAN Number:</span>
                <span className="font-mono font-semibold text-gray-800">{panNumber || '—'}</span>
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
                className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl shadow-sm transition-colors flex items-center justify-center gap-1.5"
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
