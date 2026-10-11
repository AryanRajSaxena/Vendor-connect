'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Check, Clock3, Mail, ShieldCheck, ArrowRight } from 'lucide-react';
import { formatCurrency } from '@/utils/calculations';

interface OrderProduct {
  id?: string;
  name?: string;
  category?: string;
  course_duration?: string;
}

interface OrderRecord {
  id: string;
  order_status: string;
  payment_method: string;
  payment_status?: string;
  base_price?: number;
  final_price?: number;
  created_at?: string;
  product_id?: string;
  buyer_email?: string;
  buyer_name?: string;
  product?: OrderProduct | null;
  customer_details?: {
    name?: string;
    email?: string;
    phone?: string;
  };
}

function OrderConfirmationContent() {
  const searchParams = useSearchParams();
  const [order, setOrder] = useState<OrderRecord | null>(null);
  const [loading, setLoading] = useState(true);

  const orderId = searchParams.get('orderId') || '';

  const fetchOrder = async () => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/orders/${encodeURIComponent(orderId)}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        const data = await response.json();
        setOrder(data);
      }
    } catch (error) {
      console.error('Failed to fetch order:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-[80vh] bg-slate-950 flex flex-col items-center justify-center px-4">
        <div className="w-16 h-16 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin mb-4" />
        <h2 className="text-xl font-bold text-white mb-1">Verifying your enrollment...</h2>
        <p className="text-sm text-slate-400">Please hold on while we confirm your payment status.</p>
      </div>
    );
  }

  // Resolve buyer email from order object or fallback to localStorage
  const buyerEmail =
    order?.buyer_email ||
    order?.customer_details?.email ||
    (typeof window !== 'undefined' ? localStorage.getItem('last_checkout_email') || '' : '') ||
    'your email address';

  const buyerName =
    order?.buyer_name ||
    order?.customer_details?.name ||
    'Learner';

  const courseTitle = order?.product?.name || 'Your Course';
  const pricePaid = Number(order?.final_price || order?.base_price || 0);
  const isPaymentPaid =
    order?.payment_status === 'completed' ||
    order?.payment_status === 'PAID' ||
    order?.payment_status === 'paid' ||
    order?.order_status === 'confirmed';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12 md:py-16 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Main Success Container */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl shadow-black/40 text-center relative overflow-hidden">
          {/* Subtle Ambient Glow */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Large Success Checkmark */}
          <div className="relative inline-flex items-center justify-center w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-emerald-500/15 border-2 border-emerald-500/30 mb-6 shadow-lg shadow-emerald-500/20">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-emerald-500 flex items-center justify-center shadow-md">
              <Check className="w-9 h-9 sm:w-11 sm:h-11 text-white stroke-[3]" />
            </div>
          </div>

          {/* Headings */}
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
            Payment Successful!
          </h1>

          {/* 24-Hour SLA Subheading */}
          <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-xl mx-auto mb-6">
            Your seat is confirmed. The course creator has been notified and will email your unique access credentials to{' '}
            <strong className="text-white font-semibold underline decoration-emerald-500/60 decoration-2 underline-offset-4">
              {buyerEmail}
            </strong>{' '}
            within the next 24 hours.
          </p>

          {/* Reassuring Note Callout Box */}
          <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4 sm:p-5 text-left mb-8 flex items-start gap-3.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 flex-shrink-0 mt-0.5">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-400 mb-0.5">
                Important Email Note
              </p>
              <p className="text-sm text-slate-300 leading-relaxed">
                Please check your spam/promotions folder if you don&apos;t see it by tomorrow.
              </p>
            </div>
          </div>

          {/* Order Details Breakdown Card */}
          <div className="bg-slate-950/60 border border-slate-800/60 rounded-2xl p-5 sm:p-6 text-left space-y-4 mb-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Order Reference</span>
              <span className="font-mono text-sm font-bold text-slate-200 bg-slate-800 px-3 py-1 rounded-lg">
                {orderId || 'ORD-VERIFIED'}
              </span>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-start gap-4">
                <span className="text-slate-400">Course</span>
                <span className="font-semibold text-white text-right">{courseTitle}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-400">Learner</span>
                <span className="font-medium text-slate-200">{buyerName}</span>
              </div>

              {pricePaid > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Amount Paid</span>
                  <span className="font-bold text-emerald-400 text-base">{formatCurrency(pricePaid)}</span>
                </div>
              )}

              <div className="flex justify-between items-center">
                <span className="text-slate-400">Payment Status</span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {isPaymentPaid ? 'PAID • Confirmed' : (order?.payment_status || 'Paid')}
                </span>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-slate-800/50">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Clock3 className="w-4 h-4 text-sky-400" />
                  Estimated Delivery SLA
                </span>
                <span className="font-semibold text-sky-400 text-sm">Within 24 Hours</span>
              </div>
            </div>
          </div>

          {/* Trust Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left mb-8">
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/50">
              <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <div className="leading-tight">
                <p className="text-xs font-semibold text-slate-200">Buyer Protection</p>
                <p className="text-[11px] text-slate-400">Backed by our 7-day guarantee</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/50">
              <Mail className="w-5 h-5 text-sky-400 flex-shrink-0" />
              <div className="leading-tight">
                <p className="text-xs font-semibold text-slate-200">Dedicated Support</p>
                <p className="text-[11px] text-slate-400">team@agentcroww.com</p>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-2">
            <p className="text-xs text-slate-500 mb-4">
              Need assistance with your enrollment? Reply directly to your confirmation email or message our support desk.
            </p>
            {order?.product_id && (
              <Link
                href={`/products/${order.product_id}`}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-medium text-sm transition-all border border-slate-700"
              >
                <span>Return to Course Page</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OrderConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
          <p className="text-slate-400 text-sm">Loading order confirmation...</p>
        </div>
      }
    >
      <OrderConfirmationContent />
    </Suspense>
  );
}

