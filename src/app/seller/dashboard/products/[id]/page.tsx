'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Trash2,
  Copy,
  CheckCircle2,
  Share2,
  Clock3,
  GraduationCap,
  ListChecks,
  BookOpen,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency, getImageUrl } from '@/utils/calculations';

interface SellerProduct {
  id: string;
  productId: string;
  product_name: string;
  description: string;
  base_price: number;
  category: string;
  referral_code: string;
  sold_count: number;
  clicks: number;
  earnings: number;
  is_active?: boolean;
  images?: string[];
  specifications?: Record<string, any>;
  course_duration?: string;
  prerequisites?: string[];
  learning_outcomes?: string[];
  curriculum?: Array<{
    module?: number;
    title?: string;
    lessons?: number;
    duration?: string;
  }>;
  created_at: string;
}

export default function SellerProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const productId = params.id as string;

  const [product, setProduct] = useState<SellerProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (!isLoading && user?.role !== 'seller') router.push('/');
  }, [user, isLoading, router]);

  useEffect(() => {
    if (productId && user?.id) fetchProduct();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, user?.id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/seller-products/${productId}`);
      if (!res.ok) throw new Error('Failed to fetch product');
      const data = await res.json();
      if (data.sellerId !== user?.id && data.seller_id !== user?.id) {
        router.push('/seller/dashboard');
        return;
      }
      setProduct({
        id: data.id,
        productId: data.product_id || data.productId,
        product_name: data.product_name || data.name || '',
        description: data.description || '',
        base_price: data.base_price || 0,
        category: data.category || '',
        referral_code: data.referral_code || '',
        sold_count: data.sold_count || 0,
        clicks: data.clicks || 0,
        earnings: data.earnings || 0,
        is_active: data.is_active !== false,
        images: data.images || [],
        specifications: data.specifications || {},
        course_duration: data.course_duration || data.courseDuration || '',
        prerequisites: data.prerequisites || [],
        learning_outcomes: data.learning_outcomes || data.learningOutcomes || [],
        curriculum: data.curriculum || [],
        created_at: data.created_at || '',
      });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Remove this product from your store?')) return;
    try {
      setDeleting(true);
      const res = await fetch(`/api/seller-products/${productId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to remove product');
      router.push('/seller/dashboard');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setDeleting(false);
    }
  };

  const copyCode = () => {
    if (!product?.referral_code) return;
    navigator.clipboard.writeText(product.referral_code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const copyLink = () => {
    if (!product?.referral_code) return;
    const link = `${window.location.origin}/products?ref=${product.referral_code}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <h2 className="font-semibold text-red-900">Error loading product</h2>
          </div>
          <p className="text-sm text-red-700 mb-4">{error || 'Product not found'}</p>
          <Link href="/seller/dashboard" className="text-sm text-red-700 font-medium flex items-center gap-1 hover:underline">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const imgUrl = getImageUrl(product.images?.[0]);
  const referralLink = typeof window !== 'undefined'
    ? `${window.location.origin}/products?ref=${product.referral_code}`
    : `/products?ref=${product.referral_code}`;
  const highlightText = String(product.specifications?.highlights || '');
  const features = highlightText
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
    .slice(0, 10);
  const curriculum = (Array.isArray(product.curriculum) ? product.curriculum : [])
    .map((module: any) => ({
      title: String(module?.title || '').trim(),
      lessons: Number(module?.lessons || 0),
      duration: String(module?.duration || '').trim(),
    }))
    .filter((module) => module.title);
  const effectivePrice = product.base_price;
  const isPausedCourse = product.is_active === false;
  const sellerCommission = effectivePrice * 0.1;
  const totalLessons = curriculum.reduce((sum, module) => sum + (module.lessons > 0 ? module.lessons : 0), 0);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 rounded-xl border border-gray-200 bg-white p-4 md:p-5">
        <div className="flex items-center gap-3">
          <Link href="/seller/dashboard" className="text-gray-400 hover:text-gray-700 transition-colors rounded-md border border-gray-200 p-1.5">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-400">My Store / Course Details</p>
            <h1 className="text-xl md:text-2xl font-semibold text-gray-900 leading-tight">{product.product_name}</h1>
            <div className="mt-0.5 flex items-center gap-2">
              <p className="text-xs text-gray-500">{product.category || 'Online Course'}</p>
              {isPausedCourse && (
                <span className="text-[10px] font-semibold uppercase tracking-wide text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                  Paused by vendor
                </span>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="flex items-center gap-1.5 px-3 py-2 text-sm text-red-600 border border-red-200 rounded-md hover:bg-red-50 disabled:opacity-50 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          {deleting ? 'Removing...' : 'Remove'}
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="rounded-lg border border-gray-200 bg-white p-3.5">
          <p className="text-[11px] uppercase tracking-wide text-gray-400">Course Price</p>
          <p className="text-lg font-semibold text-gray-900 mt-1">{formatCurrency(effectivePrice)}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-3.5">
          <p className="text-[11px] uppercase tracking-wide text-gray-400">Your Commission</p>
          <p className="text-lg font-semibold text-emerald-600 mt-1">{formatCurrency(sellerCommission)}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-3.5">
          <p className="text-[11px] uppercase tracking-wide text-gray-400">Curriculum</p>
          <p className="text-lg font-semibold text-gray-900 mt-1">{curriculum.length} modules</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-3.5">
          <p className="text-[11px] uppercase tracking-wide text-gray-400">Learning Outcomes</p>
          <p className="text-lg font-semibold text-gray-900 mt-1">{learningOutcomes.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Product info */}
        <div className="lg:col-span-2 space-y-5">
          {/* Product info */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            {/* Cover image */}
            <div className="h-56 bg-gradient-to-br from-gray-100 to-gray-50 relative overflow-hidden">
              {imgUrl ? (
                <img
                  src={imgUrl}
                  alt={product.product_name}
                  className="w-full h-full object-cover"
                  loading="eager"
                  fetchPriority="high"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              ) : null}
              <div className="absolute top-3 right-3">
                <span className="text-xs bg-white/90 text-gray-500 px-2 py-1 rounded-full border border-gray-200">
                  Vendor managed
                </span>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <p className="text-xs font-medium text-gray-400 mb-1">Course Name</p>
                <p className="text-base font-semibold text-gray-900">{product.product_name}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-400 mb-1">Description</p>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {product.description || 'No description available.'}
                </p>
              </div>

              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs font-medium text-gray-500 mb-2">Features</p>
                {features.length > 0 ? (
                  <ul className="space-y-1.5">
                    {features.map((feature, index) => (
                      <li key={`${feature}-${index}`} className="text-sm text-gray-700 flex items-start gap-2">
                        <span className="mt-1 inline-block w-1.5 h-1.5 rounded-full bg-gray-400" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">No features added for this course yet.</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <p className="text-xs text-gray-500 mb-1 flex items-center gap-1.5">
                    <Clock3 className="w-3.5 h-3.5" />
                    Course Duration
                  </p>
                  <p className="text-sm font-medium text-gray-900">
                    {product.course_duration?.trim() || 'Self-paced'}
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <p className="text-xs text-gray-500 mb-1 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" />
                    Curriculum Modules
                  </p>
                  <p className="text-sm font-medium text-gray-900">
                    {curriculum.length > 0 ? `${curriculum.length} modules • ${totalLessons} lessons` : 'Not added'}
                  </p>
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 p-4">
                <p className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1.5">
                  <ListChecks className="w-3.5 h-3.5" />
                  Prerequisites
                </p>
                {prerequisites.length > 0 ? (
                  <ul className="space-y-2">
                    {prerequisites.map((item, index) => (
                      <li key={`${item}-${index}`} className="text-sm text-gray-700 flex items-start gap-2">
                        <span className="mt-1 inline-block w-1.5 h-1.5 rounded-full bg-gray-400" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">No prerequisites listed.</p>
                )}
              </div>

              <div className="rounded-lg border border-gray-200 p-4">
                <p className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5" />
                  What You&apos;ll Learn
                </p>
                {learningOutcomes.length > 0 ? (
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {learningOutcomes.map((item, index) => (
                      <li key={`${item}-${index}`} className="text-sm text-gray-700 flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">No learning outcomes added yet.</p>
                )}
              </div>

              <div className="rounded-lg border border-gray-200 p-4">
                <p className="text-xs font-medium text-gray-500 mb-3">Curriculum</p>
                {curriculum.length > 0 ? (
                  <div className="space-y-2">
                    {curriculum.map((module, index) => (
                      <div
                        key={`${module.title}-${index}`}
                        className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5"
                      >
                        <p className="text-sm font-medium text-gray-900">
                          Module {index + 1}: {module.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {module.lessons > 0 ? `${module.lessons} lessons` : 'Lessons not specified'}
                          {module.duration ? ` • ${module.duration}` : ''}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Curriculum modules are not available yet.</p>
                )}
              </div>

              <div className="flex items-center gap-6 pt-3 border-t border-gray-100 text-sm">
                <div>
                  <p className="text-xs text-gray-400">Course Price</p>
                  <p className="font-semibold text-gray-900">{formatCurrency(effectivePrice)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Added</p>
                  <p className="font-semibold text-gray-900">
                    {product.created_at
                      ? new Date(product.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                      : '—'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Referral + Pricing */}
        <div className="space-y-5 lg:sticky lg:top-6 self-start">
          {/* Referral */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Share2 className="w-3.5 h-3.5 text-gray-400" />
              <h2 className="text-sm font-semibold text-gray-700">Share & Earn</h2>
            </div>
            <div className="space-y-3">
              {isPausedCourse && (
                <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2">
                  <p className="text-xs text-amber-800">
                    This course is paused by the vendor. New sales are currently disabled.
                  </p>
                </div>
              )}
              <div>
                <p className="text-xs text-gray-500 mb-1.5">Your referral code</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-gray-100 border border-gray-200 px-3 py-2 rounded-md font-mono text-sm text-gray-800 truncate">
                    {product.referral_code}
                  </code>
                  <button
                    onClick={copyCode}
                    disabled={isPausedCourse}
                    className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-200 rounded-md transition-colors"
                    title="Copy code"
                  >
                    {copiedCode ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1.5">Referral link</p>
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    value={referralLink}
                    className="flex-1 bg-gray-100 border border-gray-200 px-3 py-2 rounded-md text-xs text-gray-600 truncate"
                  />
                  <button
                    onClick={copyLink}
                    disabled={isPausedCourse}
                    className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-200 rounded-md transition-colors"
                    title="Copy link"
                  >
                    {copiedLink ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <ExternalLink className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <p className="text-xs text-gray-400 pt-1">
                Share this link on social media to earn 10% on every sale.
              </p>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Pricing</h2>
            <div className="space-y-2.5 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Course price</span>
                <span className="font-medium text-gray-900">{formatCurrency(effectivePrice)}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <span className="text-gray-700 font-medium">Your commission (10%)</span>
                <span className="font-semibold text-gray-900">{formatCurrency(sellerCommission)}</span>
              </div>
              <p className="text-xs text-gray-400 pt-1">
                Course price is set by the vendor.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}