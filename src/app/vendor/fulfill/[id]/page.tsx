'use client';

import { Suspense, useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircle2,
  Clock,
  ShieldCheck,
  ExternalLink,
  Mail,
  User,
  Phone,
  ArrowRight,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react';
import { formatCurrency } from '@/utils/calculations';

interface OrderFulfillData {
  orderId: string;
  vendorId?: string;
  orderStatus: string;
  isFulfilled: boolean;
  isTokenValid: boolean;
  fulfilledAt?: string;
  courseName: string;
  defaultAccessUrl: string;
  savedAccessNote?: string;
  buyer: {
    name: string;
    email: string;
    phone?: string;
  };
  netPayout: number;
  createdAt: string;
}

function VendorFulfillContent() {
  const params = useParams();
  const searchParams = useSearchParams();

  const orderId = params.id as string;
  const token = searchParams.get('token') || '';

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [data, setData] = useState<OrderFulfillData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  // Form inputs
  const [accessUrl, setAccessUrl] = useState('');
  const [accessNote, setAccessNote] = useState('');

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId, token]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const url = token
        ? `/api/orders/${encodeURIComponent(orderId)}/fulfill?token=${encodeURIComponent(token)}`
        : `/api/orders/${encodeURIComponent(orderId)}/fulfill`;

      const res = await fetch(url);
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || 'Failed to load order for fulfillment');
      }

      setData(json);
      setAccessUrl(json.defaultAccessUrl || '');
      setAccessNote(
        json.savedAccessNote ||
          'Access enabled on your registered email. Please use "Forgot Password" or login with OTP on our course portal.'
      );
      if (json.isFulfilled) {
        setSuccess(true);
      }
    } catch (err: any) {
      console.error('Fetch fulfill order error:', err);
      setError(err.message || 'Unable to load fulfillment page');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessUrl.trim()) {
      setError('Please provide the Course Login Portal URL');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}/fulfill`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          accessUrl: accessUrl.trim(),
          accessNote: accessNote.trim(),
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to submit fulfillment proof');
      }

      setSuccess(true);
      if (data) {
        setData({
          ...data,
          isFulfilled: true,
          orderStatus: 'fulfilled',
          fulfilledAt: json.fulfilledAt,
        });
      }
    } catch (err: any) {
      console.error('Submit fulfillment error:', err);
      setError(err.message || 'Failed to submit proof of delivery');
    } finally {
      setSubmitting(false);
    }
  };

  const copyEmail = () => {
    if (!data?.buyer?.email) return;
    navigator.clipboard.writeText(data.buyer.email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin mb-4" />
        <p className="text-slate-300 text-sm font-medium">Verifying fulfillment authorization...</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-center">
        <div className="max-w-md w-full bg-slate-900 border border-red-500/30 rounded-2xl p-8">
          <div className="w-14 h-14 rounded-full bg-red-500/15 border border-red-500/30 text-red-400 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Invalid Fulfillment Link</h1>
          <p className="text-sm text-slate-300 mb-6">{error}</p>
          <Link
            href="/vendor/dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            Go to Vendor Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header Branding */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-5">
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden ring-1 ring-emerald-500/40">
              <img src="/images/icon.jpeg" alt="Agent Croww" className="w-10 h-10 object-cover" />
            </div>
            <span className="brand-text text-xl text-white">Agent Croww</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" /> 1-Click Proof of Delivery
            </span>
          </div>
        </div>

        {/* Success State */}
        {success ? (
          <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl p-8 sm:p-10 shadow-2xl text-center space-y-5">
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Course Access Granted &amp; Verified!
              </h1>
              <p className="text-sm text-slate-300 max-w-lg mx-auto">
                Agent Croww has automatically dispatched the access link and login instructions to{' '}
                <strong className="text-white">{data?.buyer.email}</strong>.
              </p>
            </div>

            {/* Proof Card */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 text-left text-xs space-y-2.5 max-w-md mx-auto">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Order ID:</span>
                <span className="font-mono text-slate-200">#{orderId.slice(-8)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Course Portal:</span>
                <a
                  href={accessUrl.startsWith('http') ? accessUrl : `https://${accessUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-400 hover:underline flex items-center gap-1 font-medium truncate max-w-[200px]"
                >
                  <span>{accessUrl}</span>
                  <ExternalLink className="w-3 h-3 flex-shrink-0" />
                </a>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Fulfillment Status:</span>
                <span className="text-emerald-400 font-bold uppercase">FULFILLED (Proof Logged)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Net Payout Clock:</span>
                <span className="text-emerald-400 font-semibold">48h Safety Net Activated</span>
              </div>
            </div>

            <div className="pt-2">
              <Link
                href="/vendor/dashboard"
                className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-sm transition-all shadow-lg shadow-emerald-600/20"
              >
                Back to Vendor Dashboard <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : (
          /* Fulfillment Form Card */
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 border border-amber-500/30 text-amber-400 mb-3">
                <Clock className="w-3 h-3" /> 24-Hour SLA Fulfillment
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Grant Access for {data?.courseName}
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Add the buyer to your LMS (Teachable, Graphy, Kajabi, etc.) and submit proof below.
              </p>
            </div>

            {/* Error Callout */}
            {error && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}

            {/* Buyer Details Snapshot */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Student Enrollment Info
                </span>
                <span className="text-xs font-bold text-emerald-400">
                  Net Payout: {formatCurrency(data?.netPayout || 0)}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-slate-500 flex-shrink-0" />
                  <div>
                    <p className="text-slate-400">Full Name</p>
                    <p className="text-white font-semibold text-sm">{data?.buyer.name}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                  <div className="flex items-center gap-2 min-w-0">
                    <Mail className="w-4 h-4 text-slate-500 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-slate-400 text-[10px]">Student Email</p>
                      <p className="text-white font-semibold truncate text-xs">{data?.buyer.email}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={copyEmail}
                    className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    title="Copy student email"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {data?.buyer.phone && (
                  <div className="flex items-center gap-2 sm:col-span-2">
                    <Phone className="w-4 h-4 text-slate-500 flex-shrink-0" />
                    <div>
                      <p className="text-slate-400">WhatsApp / Phone</p>
                      <a
                        href={`https://wa.me/91${data.buyer.phone.slice(-10)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-400 font-semibold hover:underline"
                      >
                        +91 {data.buyer.phone}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* The 1-Click Proof of Delivery Inputs */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Input 1: Course Login URL */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                  Course Login Portal URL <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="url"
                    required
                    value={accessUrl}
                    onChange={(e) => setAccessUrl(e.target.value)}
                    placeholder="https://courses.yoursite.com/login"
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-mono"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  Pre-filled from your course settings. Student will click this button directly in their receipt email.
                </p>
              </div>

              {/* Input 2: Access Note / Temporary Password */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                  Access Note / Login Instructions
                </label>
                <textarea
                  rows={3}
                  value={accessNote}
                  onChange={(e) => setAccessNote(e.target.value)}
                  placeholder="e.g. Access enabled on your registered email; use 'Forgot Password' or login with OTP"
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all resize-none"
                />
                <p className="text-[11px] text-slate-400 mt-1.5">
                  Provide temporary credentials, OTP instructions, or batch details.
                </p>
              </div>

              {/* Submit CTA */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center justify-center gap-2 transition-all duration-200 shadow-lg shadow-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed text-base"
                >
                  {submitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Transmitting Credentials &amp; Locking Proof...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      <span>Submit Proof &amp; Send Credentials to Student</span>
                    </>
                  )}
                </button>
              </div>

              {/* Chargeback Immunity Note */}
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 flex items-start gap-3 text-xs text-slate-400">
                <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong className="text-slate-300">Chargeback Immunity Protection:</strong> When you hit submit, Agent Croww logs your timestamp, IP, and the exact credentials sent to the student. This acts as verified proof of delivery for payment gateway disputes and activates your payout timeline.
                </p>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VendorFulfillPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
          <p className="text-slate-400 text-sm">Loading fulfillment interface...</p>
        </div>
      }
    >
      <VendorFulfillContent />
    </Suspense>
  );
}
