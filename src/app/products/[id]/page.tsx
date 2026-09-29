'use client';

import { Suspense, useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Check,
  ChevronLeft,
  Clock3,
  GraduationCap,
  ListChecks,
  BookOpen,
  ShieldCheck,
  BadgeCheck,
  Sparkles,
  Copy,
  Download,
  X,
  Lock,
  Phone,
  Mail,
  User,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency } from '@/utils/calculations';
import { showCartToast } from '@/components/shared/CartToast';

interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  base_price: number;
  sold_count: number;
  is_active: boolean;
  images: string[];
  specifications: Record<string, any>;
  course_duration?: string;
  prerequisites?: string[];
  learning_outcomes?: string[];
  curriculum?: Array<{
    module?: number;
    title?: string;
    lessons?: number;
    duration?: string;
  }>;
  vendor_id: string;
  created_at: string;
  brochure_url?: string;
  syllabus_url?: string;
}

function ProductDetailContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const guestRoleParam = (searchParams.get('guestRole') || '').toLowerCase();
  const isGuestVendorOrSeller =
    !user?.id && (guestRoleParam === 'vendor' || guestRoleParam === 'seller');

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasReferral, setHasReferral] = useState(false);
  const [referralId, setReferralId] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isGuestModalOpen, setIsGuestModalOpen] = useState(false);
  const [guestName, setGuestName] = useState(user?.name || '');
  const [guestEmail, setGuestEmail] = useState(user?.email || '');
  const [guestPhone, setGuestPhone] = useState(user?.phone || '');
  const [guestError, setGuestError] = useState<string | null>(null);
  const [guestSubmitting, setGuestSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      if (user.name && !guestName) setGuestName(user.name);
      if (user.email && !guestEmail) setGuestEmail(user.email);
      if (user.phone && !guestPhone) setGuestPhone(user.phone);
    }
  }, [user]);

  const backHref = (() => {
    if (user?.role === 'seller') {
      return '/seller/marketplace';
    }
    if (guestRoleParam === 'seller' || guestRoleParam === 'vendor') {
      return `/seller/marketplace?guestRole=${encodeURIComponent(guestRoleParam)}`;
    }
    return '/products';
  })();

  useEffect(() => {
    const rawRef =
      searchParams.get('ref') ||
      searchParams.get('referral') ||
      searchParams.get('code') ||
      '';

    const normalizedParam = rawRef.trim();

    if (normalizedParam) {
      const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
      const attributionData = {
        ref: normalizedParam,
        expiresAt: Date.now() + thirtyDaysMs,
        savedAt: Date.now(),
      };
      try {
        localStorage.setItem('referral_attribution', JSON.stringify(attributionData));
        localStorage.setItem('referralCode', normalizedParam.toUpperCase());
      } catch (e) {
        console.warn('Failed to store referral in localStorage:', e);
      }
      setHasReferral(true);
      setReferralId(normalizedParam);
    } else {
      try {
        const stored = localStorage.getItem('referral_attribution');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed?.expiresAt && parsed.expiresAt > Date.now() && parsed.ref) {
            setHasReferral(true);
            setReferralId(parsed.ref);
          } else if (parsed?.expiresAt && parsed.expiresAt <= Date.now()) {
            localStorage.removeItem('referral_attribution');
            localStorage.removeItem('referralCode');
            setHasReferral(false);
            setReferralId(null);
          }
        } else {
          const legacyCode = localStorage.getItem('referralCode');
          if (legacyCode) {
            setHasReferral(true);
            setReferralId(legacyCode);
          }
        }
      } catch (err) {
        console.warn('Error reading referral attribution:', err);
      }
    }
  }, [searchParams]);

  const handleCopyReferralLink = async () => {
    if (!product || !user?.id) return;
    const url = `${window.location.origin}/products/${product.id}?ref=${user.id}`;
    try {
      await navigator.clipboard.writeText(url);
      setIsCopied(true);
      showCartToast('Referral link copied to clipboard!');
      setTimeout(() => setIsCopied(false), 3000);
    } catch (e) {
      console.error('Failed to copy referral link', e);
      showCartToast('Referral link: ' + url);
    }
  };

  const handleDownloadBrochure = () => {
    const specs = (product?.specifications || {}) as Record<string, any>;
    const brochureUrl =
      product?.brochure_url ||
      product?.syllabus_url ||
      specs.brochure_url ||
      specs.syllabus_url ||
      specs.brochureUrl ||
      specs.syllabusUrl ||
      specs.pdf_url;

    if (brochureUrl && typeof brochureUrl === 'string' && brochureUrl.startsWith('http')) {
      window.open(brochureUrl, '_blank');
    } else {
      showCartToast('Brochure / Syllabus PDF will be uploaded soon by the creator.');
    }
  };

  const handleSubmitGuestCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;

    const trimmedName = guestName.trim();
    const trimmedEmail = guestEmail.trim().toLowerCase();
    const cleanPhone = guestPhone.replace(/\D/g, '').slice(-10);

    if (!trimmedName) {
      setGuestError('Full name is required');
      return;
    }

    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setGuestError('Please enter a valid email address');
      return;
    }

    if (cleanPhone.length !== 10 || !/^[6-9]/.test(cleanPhone)) {
      setGuestError('Please enter a valid 10-digit Indian WhatsApp mobile number');
      return;
    }

    setGuestSubmitting(true);
    setGuestError(null);

    try {
      let activeRef = referralId;
      if (!activeRef) {
        try {
          const stored = localStorage.getItem('referral_attribution');
          if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed?.expiresAt && parsed.expiresAt > Date.now() && parsed.ref) {
              activeRef = parsed.ref;
            }
          }
        } catch {}
      }
      if (!activeRef) {
        activeRef = localStorage.getItem('referralCode');
      }

      const orderId = `ORD-${Date.now()}`;
      const payload = {
        id: orderId,
        customerId: user?.id || null,
        vendorId: product.vendor_id,
        productId: product.id,
        quantity: 1,
        sellerId: activeRef || null,
        referralCode: activeRef || null,
        customerDetails: {
          name: trimmedName,
          email: trimmedEmail,
          phone: cleanPhone,
        },
        deliveryAddress: {
          address: 'Digital Access',
          city: 'Online',
          state: 'Online',
          pincode: '000000',
        },
        paymentMethod: 'upi',
        orderStatus: 'pending',
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to complete order. Please try again.');
      }

      const order = await res.json();
      window.location.href = `/order-confirmation?orderId=${order.id}`;
    } catch (err: any) {
      console.error('Guest enrollment error:', err);
      setGuestError(err.message || 'Failed to enroll. Please try again.');
      setGuestSubmitting(false);
    }
  };

  // Fetch product details
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/products/${params.id}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
          throw new Error('Product not found');
        }

        const data = await response.json();
        setProduct(data);
      } catch (error) {
        console.error('Failed to fetch product:', error);
        setError((error as Error).message);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchProduct();
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <p className="text-slate-400 text-lg">Loading product...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-lg mb-4">{error || 'Product not found'}</p>
          <Link href={backHref} className="inline-flex items-center rounded-lg bg-sky-600 hover:bg-sky-500 text-white px-4 py-2 text-sm font-semibold transition-colors">
            Back to Products
          </Link>
        </div>
      </div>
    );
  }

  const specs = product.specifications || {};
  const highlightText = String(specs.highlights || '');
  const highlights = highlightText
    .split('|||')
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 8);

  const prerequisites = (Array.isArray(product.prerequisites) ? product.prerequisites : [])
    .map((item) => String(item).trim())
    .filter(Boolean)
    .slice(0, 10);

  const learningOutcomes = (Array.isArray(product.learning_outcomes) ? product.learning_outcomes : [])
    .map((item) => String(item).trim())
    .filter(Boolean)
    .slice(0, 12);

  const curriculum = (Array.isArray(product.curriculum) ? product.curriculum : [])
    .map((module) => ({
      module: Number(module?.module || 0),
      title: String(module?.title || '').trim(),
      lessons: Number(module?.lessons || 0),
      duration: String(module?.duration || '').trim(),
    }))
    .filter((module) => module.title);

  const courseDuration =
    (product.course_duration && String(product.course_duration).trim()) ||
    (specs.courseDuration && String(specs.courseDuration).trim()) ||
    (specs.course_duration && String(specs.course_duration).trim()) ||
    'Self-paced';

  const totalLessons = curriculum.reduce((sum, module) => sum + (module.lessons > 0 ? module.lessons : 0), 0);
  const isAuthenticatedSeller = user?.role === 'seller';
  const isPausedCourse = product.is_active === false;
  const publishedOn = product.created_at
    ? new Date(product.created_at).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : 'Recently added';

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="bg-slate-900/90 border-b border-slate-800 px-4 py-3">
        <div className="max-w-7xl mx-auto">
          <Link href={backHref} className="inline-flex items-center gap-1 text-slate-400 hover:text-slate-100 text-sm font-medium transition-colors">
            <ChevronLeft className="w-4 h-4" />
            Back to Products
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 md:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="order-2 lg:order-2 lg:col-span-4 space-y-4 lg:sticky lg:top-24 self-start">
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 shadow-lg shadow-black/20">
              <h3 className="text-sm font-bold text-slate-100 mb-3">What You&apos;ll Get</h3>
              {learningOutcomes.length > 0 ? (
                <ul className="space-y-2">
                  {learningOutcomes.slice(0, 4).map((item, idx) => (
                    <li key={`${item}-${idx}`} className="text-sm text-slate-300 flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <span className="line-clamp-2">{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-400">Clear outcomes and practical modules included.</p>
              )}
            </div>
          </div>

          <div className="order-1 lg:order-1 lg:col-span-8 space-y-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg shadow-black/20">
              {/* Subtle Trust Badge when Referral is Present */}
              {hasReferral && (
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold mb-3">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Verified Partner Referral • Backed by 7-Day Guarantee</span>
                </div>
              )}

              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                {product.category}
              </p>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-100 leading-tight">
                {product.name}
              </h1>
              <div className="flex flex-wrap items-center gap-3 mt-4 text-sm">
                <span className="inline-flex items-center gap-1 text-amber-500 font-semibold">
                  {'★★★★★'}
                </span>
                {(product.sold_count || 0) >= 10 && (
                  <>
                    <span className="text-slate-400">{product.sold_count}+ enrolled learners</span>
                    <span className="text-slate-700">•</span>
                  </>
                )}
                <span className="inline-flex items-center gap-1 text-slate-300">
                  <Clock3 className="w-4 h-4 text-slate-500" />
                  {courseDuration}
                </span>
                <span className="text-slate-700">•</span>
                <span className="inline-flex items-center gap-1 text-slate-300">
                  <BookOpen className="w-4 h-4 text-slate-500" />
                  {curriculum.length} modules
                </span>
              </div>

              <div className="mt-5 pt-5 border-t border-slate-800">
                <p className="text-sm text-slate-400">Course Price</p>
                <div className="flex items-end gap-2 mt-1">
                  <span className="text-4xl font-bold text-slate-100">{formatCurrency(product.base_price)}</span>
                  <span className="text-xs text-emerald-400 font-semibold mb-1">Instant digital access</span>
                </div>
              </div>

              {isPausedCourse && (
                <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3">
                  <p className="text-sm text-amber-200">
                    This course is currently paused by the vendor. New purchases are disabled.
                  </p>
                </div>
              )}

              {isAuthenticatedSeller ? (
                <div className="mt-6 p-4 rounded-xl border border-violet-500/30 bg-violet-950/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-violet-400 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      Seller Partner Tools
                    </span>
                    <span className="text-xs text-slate-400">
                      Earn on Every Enrollment
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      onClick={handleCopyReferralLink}
                      className="w-full inline-flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-semibold py-3 px-4 rounded-lg text-sm transition-all shadow-lg shadow-violet-600/20"
                    >
                      {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {isCopied ? 'Link Copied!' : 'Copy Referral Link'}
                    </button>
                    <button
                      onClick={handleDownloadBrochure}
                      className="w-full inline-flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold py-3 px-4 rounded-lg text-sm transition-all"
                    >
                      <Download className="w-4 h-4" />
                      Download Brochure PDF
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-6">
                  <button
                    onClick={() => {
                      if (isGuestVendorOrSeller) {
                        alert('Checkout is disabled in guest seller/vendor browsing mode.');
                        return;
                      }
                      setIsGuestModalOpen(true);
                    }}
                    disabled={isGuestVendorOrSeller || isPausedCourse}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3.5 px-6 rounded-xl text-base transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <span>Enroll Now — {formatCurrency(product.base_price)}</span>
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">
                <div className="rounded-lg bg-slate-950 border border-slate-800 p-3">
                  <p className="text-xs text-slate-400">Published</p>
                  <p className="text-sm font-semibold text-slate-100 mt-1">{publishedOn}</p>
                </div>
                <div className="rounded-lg bg-slate-950 border border-slate-800 p-3">
                  <p className="text-xs text-slate-400">Modules</p>
                  <p className="text-sm font-semibold text-slate-100 mt-1">{curriculum.length}</p>
                </div>
                <div className="rounded-lg bg-slate-950 border border-slate-800 p-3">
                  <p className="text-xs text-slate-400">Lessons</p>
                  <p className="text-sm font-semibold text-slate-100 mt-1">{totalLessons}</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg shadow-black/20">
              <h2 className="text-lg font-bold text-slate-100 mb-3">About This Course</h2>
              <p className="text-slate-300 leading-relaxed text-sm md:text-base">{product.description}</p>

              {highlights.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-bold text-slate-100 mb-3 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-sky-500" />
                    Key Highlights
                  </h3>
                  <ul className="space-y-2">
                    {highlights.map((item, idx) => (
                      <li key={`${item}-${idx}`} className="text-sm text-slate-300 flex items-start gap-2">
                        <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg shadow-black/20">
                <h3 className="text-base font-bold text-slate-100 mb-3 flex items-center gap-2">
                  <ListChecks className="w-4 h-4 text-sky-500" />
                  Prerequisites
                </h3>
                {prerequisites.length > 0 ? (
                  <ul className="space-y-2">
                    {prerequisites.map((item, idx) => (
                      <li key={`${item}-${idx}`} className="text-sm text-slate-300 flex items-start gap-2">
                        <span className="mt-2 inline-block w-1.5 h-1.5 rounded-full bg-slate-500" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-400">No prerequisites. This is beginner friendly.</p>
                )}
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg shadow-black/20">
                <h3 className="text-base font-bold text-slate-100 mb-3 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-sky-500" />
                  What You&apos;ll Learn
                </h3>
                {learningOutcomes.length > 0 ? (
                  <ul className="space-y-2">
                    {learningOutcomes.map((item, idx) => (
                      <li key={`${item}-${idx}`} className="text-sm text-slate-300 flex items-start gap-2">
                        <BadgeCheck className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-400">Learning outcomes will be updated soon.</p>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg shadow-black/20">
              <h3 className="text-base font-bold text-slate-100 mb-4">Course Curriculum</h3>
              {curriculum.length > 0 ? (
                <div className="space-y-3">
                  {curriculum.map((module, idx) => (
                    <div key={`${module.title}-${idx}`} className="rounded-lg border border-slate-800 bg-slate-950 px-4 py-3">
                      <p className="text-sm font-semibold text-slate-100">
                        Module {idx + 1}: {module.title}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {module.lessons > 0 ? `${module.lessons} lessons` : 'Lessons not specified'}
                        {module.duration ? ` • ${module.duration}` : ''}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400">Curriculum details are not available yet.</p>
              )}
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg shadow-black/20">
              <h3 className="text-base font-bold text-slate-100 mb-4">Why Buy With Confidence</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex gap-2.5">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-slate-100">Secure Payments</p>
                    <p className="text-xs text-slate-400">Protected checkout and verified transactions.</p>
                  </div>
                </div>
                <div className="flex gap-2.5">
                  <Check className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-slate-100">Instant Access</p>
                    <p className="text-xs text-slate-400">Start learning right after successful payment.</p>
                  </div>
                </div>
                <div className="flex gap-2.5">
                  <BadgeCheck className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-slate-100">7-Day Guarantee</p>
                    <p className="text-xs text-slate-400">Refund support if the course is not a fit.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* 3-Field Guest Checkout Modal */}
      {isGuestModalOpen && product && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/70">
              <div>
                <h3 className="text-lg font-bold text-white">Instant Course Enrollment</h3>
                <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{product.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsGuestModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmitGuestCheckout} className="p-6 space-y-4">
              {guestError && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
                  {guestError}
                </div>
              )}

              {/* Course & Price Summary Bar */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-sm">
                <div>
                  <span className="text-xs text-slate-400 block">Total Due</span>
                  <span className="text-2xl font-bold text-emerald-400">
                    {formatCurrency(product.base_price)}
                  </span>
                </div>
                <div className="text-right text-xs text-slate-400">
                  <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                    <ShieldCheck className="w-3.5 h-3.5" /> Instant Activation
                  </span>
                  <p className="mt-0.5">7-Day Refund Guarantee</p>
                </div>
              </div>

              {/* Field 1: Full Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Full Name <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                  />
                </div>
              </div>

              {/* Field 2: Email Address */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Email Address <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Use the exact email where you want your course access unlocked
                </p>
              </div>

              {/* Field 3: WhatsApp Phone Number */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  WhatsApp Phone Number <span className="text-rose-400">*</span>
                </label>
                <div className="relative flex">
                  <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-slate-800 bg-slate-950/80 text-slate-400 text-sm font-medium">
                    +91
                  </span>
                  <div className="relative flex-1">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={guestPhone}
                      onChange={(e) => setGuestPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="9876543210"
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-r-lg bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                    />
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  10-digit Indian WhatsApp mobile number for instant course access links
                </p>
              </div>

              {/* Submit CTA */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={guestSubmitting}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 px-4 rounded-xl text-sm transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  {guestSubmitting
                    ? 'Securing Enrollment...'
                    : `Complete Enrollment • ${formatCurrency(product.base_price)}`}
                </button>
              </div>

              <div className="text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5 pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>256-Bit SSL Encrypted Checkout • Verified Partner Attribution</span>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProductDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
          <p className="text-slate-400 text-lg">Loading product...</p>
        </div>
      }
    >
      <ProductDetailContent />
    </Suspense>
  );
}
