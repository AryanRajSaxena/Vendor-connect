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
  TrendingUp,
  MousePointerClick,
  DollarSign,
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
  final_price: number;
  category: string;
  referral_code: string;
  sold_count: number;
  clicks: number;
  earnings: number;
  images?: string[];
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
        final_price: data.final_price || 0,
        category: data.category || '',
        referral_code: data.referral_code || '',
        sold_count: data.sold_count || 0,
        clicks: data.clicks || 0,
        earnings: data.earnings || 0,
        images: data.images || [],
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
  const conversionRate = product.clicks > 0
    ? ((product.sold_count / product.clicks) * 100).toFixed(1)
    : null;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/seller/dashboard" className="text-gray-400 hover:text-gray-700 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{product.product_name}</h1>
            <p className="text-xs text-gray-400 mt-0.5">{product.category}</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Product info + performance */}
        <div className="lg:col-span-2 space-y-5">
          {/* Product info */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {/* Cover image */}
            <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-50 relative overflow-hidden">
              {imgUrl ? (
                <img
                  src={imgUrl}
                  alt={product.product_name}
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              ) : null}
              <div className="absolute top-3 right-3">
                <span className="text-xs bg-white/90 text-gray-500 px-2 py-1 rounded-full border border-gray-200">
                  Vendor managed
                </span>
              </div>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <p className="text-xs font-medium text-gray-400 mb-1">Description</p>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {product.description || 'No description available.'}
                </p>
              </div>
              <div className="flex items-center gap-6 pt-3 border-t border-gray-100 text-sm">
                <div>
                  <p className="text-xs text-gray-400">Price</p>
                  <p className="font-semibold text-gray-900">{formatCurrency(product.final_price || product.base_price)}</p>
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

          {/* Performance metrics */}
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Performance</h2>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <TrendingUp className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-xs text-gray-500">Sales</span>
                </div>
                <p className="text-xl font-semibold tabular-nums text-gray-900">{product.sold_count}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <MousePointerClick className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-xs text-gray-500">Clicks</span>
                </div>
                <p className="text-xl font-semibold tabular-nums text-gray-900">{product.clicks}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <DollarSign className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-xs text-gray-500">Earned</span>
                </div>
                <p className="text-xl font-semibold tabular-nums text-gray-900">
                  {formatCurrency(product.earnings || 0)}
                </p>
              </div>
            </div>

            {conversionRate !== null && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-gray-500">Conversion rate</span>
                  <span className="text-sm font-semibold text-gray-900">{conversionRate}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div
                    className="bg-primary-500 h-1.5 rounded-full transition-all"
                    style={{ width: `${Math.min(Number(conversionRate), 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Referral + Pricing */}
        <div className="space-y-5">
          {/* Referral */}
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Share2 className="w-3.5 h-3.5 text-gray-400" />
              <h2 className="text-sm font-semibold text-gray-700">Share & Earn</h2>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500 mb-1.5">Your referral code</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-gray-100 border border-gray-200 px-3 py-2 rounded-md font-mono text-sm text-gray-800 truncate">
                    {product.referral_code}
                  </code>
                  <button
                    onClick={copyCode}
                    className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-700 border border-gray-200 rounded-md transition-colors"
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
                    className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-700 border border-gray-200 rounded-md transition-colors"
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
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Pricing</h2>
            <div className="space-y-2.5 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Base price</span>
                <span className="font-medium text-gray-900">{formatCurrency(product.base_price)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Customer pays</span>
                <span className="font-medium text-gray-900">{formatCurrency(product.final_price)}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <span className="text-gray-700 font-medium">Your commission (10%)</span>
                <span className="font-semibold text-gray-900">{formatCurrency(product.final_price * 0.1)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}