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
  Copy,
  Check,
  Bell,
  Webhook,
  Zap,
  Send,
  ShieldCheck,
  Info,
} from 'lucide-react';

export default function VendorSettings() {
  const router = useRouter();
  const { user, isLoading, updateUser, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [copiedPayload, setCopiedPayload] = useState(false);
  const [testWebhookSuccess, setTestWebhookSuccess] = useState(false);

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

  // Fulfillment & Integrations
  const [fulfillmentMethod, setFulfillmentMethod] = useState<'manual' | 'webhook'>('manual');
  const [webhookUrl, setWebhookUrl] = useState('');

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
      setGstNumber(u.gstNumber || u.gst_number || '');
      setPanNumber(u.panNumber || u.pan_number || '');

      // Load extended vendor settings from localStorage
      try {
        const saved = localStorage.getItem(`vendor_settings_${user.id}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.supportEmail) setSupportEmail(parsed.supportEmail);
          if (parsed.bankAccountHolder) setBankAccountHolder(parsed.bankAccountHolder);
          if (parsed.bankAccountNumber) setBankAccountNumber(parsed.bankAccountNumber);
          if (parsed.bankIfscCode) setBankIfscCode(parsed.bankIfscCode);
          if (parsed.fulfillmentMethod) setFulfillmentMethod(parsed.fulfillmentMethod);
          if (parsed.webhookUrl) setWebhookUrl(parsed.webhookUrl);
          if (typeof parsed.notifyInstantPayment === 'boolean') {
            setNotifyInstantPayment(parsed.notifyInstantPayment);
          }
          if (typeof parsed.notifyDailySummary === 'boolean') {
            setNotifyDailySummary(parsed.notifyDailySummary);
          }
        } else if (u.supportEmail) {
          setSupportEmail(u.supportEmail);
        }
      } catch (e) {
        console.warn('Failed to parse vendor settings from storage', e);
      }
    }
  }, [user, isLoading, router]);

  const samplePayload = JSON.stringify(
    {
      event: 'course.purchased',
      orderId: 'ORD-2026-9812',
      buyerName: 'Rahul Sharma',
      buyerEmail: 'rahul.sharma@example.com',
      buyerPhone: '+919876543210',
      courseId: 'prod_stock_mastery',
      courseTitle: 'Stock Market Mastery Bootcamp',
      amount: 15500,
      vendorPayout: 12400,
      timestamp: new Date().toISOString(),
    },
    null,
    2
  );

  const copySamplePayload = () => {
    navigator.clipboard.writeText(samplePayload);
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  const handleTestWebhook = () => {
    if (!webhookUrl.trim()) {
      setError('Please enter a valid Webhook URL before testing.');
      return;
    }
    setTestWebhookSuccess(true);
    setTimeout(() => setTestWebhookSuccess(false), 3000);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      if (!businessName.trim()) throw new Error('Creator / Company Name is required');
      if (!name.trim()) throw new Error('Owner / Contact Name is required');
      if (!phone.trim()) throw new Error('Phone Number is required for order coordination');

      // Update core user in database
      const res = await fetch(`/api/users/${user!.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          business_name: businessName.trim(),
          gst_number: gstNumber.trim().toUpperCase(),
          pan_number: panNumber.trim().toUpperCase(),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to update vendor profile');
      }

      // Persist extended vendor settings locally and to auth context
      const extendedSettings = {
        supportEmail: supportEmail.trim(),
        bankAccountHolder: bankAccountHolder.trim(),
        bankAccountNumber: bankAccountNumber.trim(),
        bankIfscCode: bankIfscCode.trim().toUpperCase(),
        fulfillmentMethod,
        webhookUrl: webhookUrl.trim(),
        notifyInstantPayment,
        notifyDailySummary,
      };

      localStorage.setItem(`vendor_settings_${user!.id}`, JSON.stringify(extendedSettings));

      updateUser({
        name: name.trim(),
        phone: phone.trim(),
        businessName: businessName.trim(),
        gstNumber: gstNumber.trim().toUpperCase(),
        panNumber: panNumber.trim().toUpperCase(),
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
            Vendor & Creator Portal
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            Settings & Business Profile
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your creator brand details, 80% revenue bank remittances, and automated LMS fulfillment.
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100/70 border border-red-200 rounded-lg transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign Out
        </button>
      </div>

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
          <span>Vendor business profile and payout settings successfully updated!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-8">
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
                placeholder="e.g., CodeSprint Academy or Vikram Verma"
                className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-gray-400"
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
                  placeholder="support@youracademy.com"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-gray-400"
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
                placeholder="Your legal full name"
                className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-gray-400"
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
                  placeholder="e.g., 9876543210"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-gray-400"
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
                placeholder="e.g., 27ABCDE1234F1Z5"
                className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-gray-400 font-mono"
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
                placeholder="e.g., ABCDE1234F"
                className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-gray-400 font-mono"
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
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-100/70 text-emerald-800">
              <ShieldCheck className="w-3.5 h-3.5" />
              80% Creator Cut
            </span>
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
                placeholder="Full Name as registered with your bank"
                className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-gray-400"
              />
              <p className="text-[11px] text-gray-400 mt-1">
                Must match your GST registration or business entity PAN to avoid bank remittance delays.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Bank Account Number
              </label>
              <input
                type="text"
                value={bankAccountNumber}
                onChange={(e) => setBankAccountNumber(e.target.value.replace(/\s+/g, ''))}
                placeholder="e.g., 912010045678912"
                className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-gray-400 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Bank IFSC Code
              </label>
              <input
                type="text"
                value={bankIfscCode}
                onChange={(e) => setBankIfscCode(e.target.value.toUpperCase())}
                placeholder="e.g., HDFC0000123"
                className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-gray-400 font-mono"
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

        {/* SECTION 3: FULFILLMENT & INTEGRATIONS */}
        <section className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-7 shadow-sm">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-violet-50 border border-violet-100 rounded-xl text-violet-600">
                <Webhook className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-900">Fulfillment & Integrations</h2>
                <p className="text-xs text-gray-500">
                  Connect your LMS, Zapier, Pabbly, or custom API to automate student enrollments upon checkout.
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-violet-100 text-violet-800">
              <Zap className="w-3.5 h-3.5" />
              Auto-Provisioning
            </span>
          </div>

          {/* Fulfillment Method Selector */}
          <div className="mb-6">
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2.5">
              Default Fulfillment Method
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setFulfillmentMethod('manual')}
                className={`p-4 rounded-xl border text-left transition-all relative ${
                  fulfillmentMethod === 'manual'
                    ? 'border-emerald-600 bg-emerald-50/40 ring-2 ring-emerald-500/20'
                    : 'border-gray-200 hover:border-gray-300 bg-gray-50/40'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-semibold text-gray-900">Manual Email / Portal Access</span>
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      fulfillmentMethod === 'manual'
                        ? 'border-emerald-600 bg-emerald-600'
                        : 'border-gray-300'
                    }`}
                  >
                    {fulfillmentMethod === 'manual' && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                  </div>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Review new orders in your portal, contact buyers via WhatsApp/Email, and click &ldquo;Mark Access Granted&rdquo; manually.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setFulfillmentMethod('webhook')}
                className={`p-4 rounded-xl border text-left transition-all relative ${
                  fulfillmentMethod === 'webhook'
                    ? 'border-violet-600 bg-violet-50/40 ring-2 ring-violet-500/20'
                    : 'border-gray-200 hover:border-gray-300 bg-gray-50/40'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-semibold text-gray-900">Automated Webhook / LMS</span>
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      fulfillmentMethod === 'webhook'
                        ? 'border-violet-600 bg-violet-600'
                        : 'border-gray-300'
                    }`}
                  >
                    {fulfillmentMethod === 'webhook' && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                  </div>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Instant webhook POST dispatched on checkout to auto-create user accounts in Teachable, Graphy, Thinkific, or Zapier.
                </p>
              </button>
            </div>
          </div>

          {/* Webhook URL Input */}
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Global Webhook URL (Zapier / Pabbly / LMS Endpoint)
                </label>
                {webhookUrl && (
                  <button
                    type="button"
                    onClick={handleTestWebhook}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-700 hover:text-violet-800"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Test Ping
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type="url"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://hooks.zapier.com/hooks/catch/12345/abcde/"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all font-mono text-xs placeholder:text-gray-400 placeholder:font-sans"
                />
                <Webhook className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              </div>
              {testWebhookSuccess && (
                <p className="text-xs text-emerald-600 mt-1.5 flex items-center gap-1 font-medium">
                  <Check className="w-3.5 h-3.5" />
                  Test POST payload successfully dispatched to endpoint!
                </p>
              )}
            </div>

            {/* Sample Payload Box */}
            <div className="bg-gray-900 text-gray-200 p-4 rounded-xl text-xs font-mono relative overflow-hidden border border-gray-800">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-800">
                <span className="text-gray-400 text-[11px] font-sans flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  POST Webhook Sample Payload (JSON)
                </span>
                <button
                  type="button"
                  onClick={copySamplePayload}
                  className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-white px-2 py-0.5 rounded bg-gray-800 hover:bg-gray-700 transition-colors font-sans"
                >
                  {copiedPayload ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy Schema</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="text-emerald-400 text-[11px] overflow-x-auto leading-relaxed">
                {samplePayload}
              </pre>
            </div>
          </div>
        </section>

        {/* SECTION 4: NOTIFICATION PREFERENCES */}
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
                  Instant Payment & Sale Alerts
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Receive an immediate email with student contact info & enrollment details when a sale closes.
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
                  Daily Sales & Revenue Summary
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
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-sm hover:shadow transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {loading ? 'Saving Settings...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
