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
  Package,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency } from '@/utils/calculations';

interface SellerProduct {
  id: string;
  productId: string;
  sellerId: string;
  product_name: string;
  description: string;
  base_price: number;
  final_price: number;
  stock: number;
  seller_markup_percentage: number;
  sold_count: number;
  clicks: number;
  earnings: number;
  images?: string[];
  category: string;
  referral_code: string;
  vendor_id: string;
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
    if (!isLoading && user?.role !== 'seller') {
      router.push('/');
      return;
    }

    if (productId && user?.id) {
      fetchProduct();
    }
  }, [productId, user, isLoading, router]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/seller-products/${productId}`);
      if (!response.ok) throw new Error('Failed to fetch product');

      const data = await response.json();

      // Check authorization
      if (data.sellerId !== user?.id && data.seller_id !== user?.id) {
        router.push('/seller/dashboard');
        return;
      }

      setProduct(data);
    } catch (err) {
      setError((err as Error).message);
      console.error('Failed to fetch product:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to remove this product from your store?')) {
      return;
    }

    try {
      setDeleting(true);

      const response = await fetch(`/api/seller-products/${productId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete product');

      alert('✓ Product removed from your store');
      router.push('/seller/dashboard');
    } catch (err) {
      setError((err as Error).message);
      alert('Failed to delete product: ' + (err as Error).message);
    } finally {
      setDeleting(false);
    }
  };

  const copyReferralCode = () => {
    if (product?.referral_code) {
      navigator.clipboard.writeText(product.referral_code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const copyReferralLink = () => {
    if (product?.referral_code) {
      const link = `${window.location.origin}/products?ref=${product.referral_code}`;
      navigator.clipboard.writeText(link);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-red-600" />
              <h2 className="text-lg font-semibold text-red-900">Error Loading Product</h2>
            </div>
            <p className="text-red-700 mb-4">{error || 'Product not found'}</p>
            <Link
              href="/seller/dashboard"
              className="inline-flex items-center gap-2 text-red-700 hover:text-red-800 font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/seller/dashboard"
                className="text-gray-600 hover:text-gray-900 transition"
              >
                <ArrowLeft className="w-6 h-6" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{product.product_name}</h1>
                <p className="text-gray-600 text-sm mt-1">{product.category}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition inline-flex items-center gap-2 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                {deleting ? 'Removing...' : 'Remove from Store'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Info Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">View Only - Vendor Information</h3>
              <p className="text-sm text-blue-800">
                Product details (name, description, pricing, stock) are managed by the vendor and cannot be edited. 
                You can view performance metrics and share your unique referral code to earn commission.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Product Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Product Image & Description */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Product Information</h3>
                <span className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full font-medium">
                  🔒 Vendor Managed
                </span>
              </div>
              
              <div className="w-full h-64 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center text-6xl mb-6">
                {product.images && product.images[0] ? product.images[0] : '📦'}
              </div>

              <div className="mb-4">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Product Name</label>
                <p className="text-lg font-semibold text-gray-900">{product.product_name}</p>
              </div>

              <div className="mb-4">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Category</label>
                <p className="text-gray-700">{product.category}</p>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Description</label>
                <p className="text-gray-700 leading-relaxed">
                  {product.description || 'No description available'}
                </p>
              </div>
            </div>

            {/* Performance Stats */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Performance Metrics</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{product.sold_count || 0}</p>
                  <p className="text-sm text-gray-600">Total Sales</p>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <MousePointerClick className="w-5 h-5 text-blue-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{product.clicks || 0}</p>
                  <p className="text-sm text-gray-600">Link Clicks</p>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <DollarSign className="w-5 h-5 text-purple-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(product.earnings || 0)}</p>
                  <p className="text-sm text-gray-600">Total Earnings</p>
                </div>
              </div>

              {/* Conversion Rate */}
              {product.clicks > 0 && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Conversion Rate</span>
                    <span className="text-lg font-semibold text-gray-900">
                      {((product.sold_count / product.clicks) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${Math.min((product.sold_count / product.clicks) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Referral & Pricing */}
          <div className="space-y-6">
            {/* Referral Code */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Share2 className="w-5 h-5 text-primary" />
                Referral Code
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-600 mb-1 block">Your Unique Code</label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-gray-100 px-3 py-2 rounded border border-gray-200 font-mono text-sm">
                      {product.referral_code}
                    </code>
                    <button
                      onClick={copyReferralCode}
                      className="bg-primary text-white p-2 rounded hover:bg-primary/90 transition"
                      title="Copy referral code"
                    >
                      {copiedCode ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-gray-600 mb-1 block">Referral Link</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={`${typeof window !== 'undefined' ? window.location.origin : ''}/products?ref=${product.referral_code}`}
                      className="flex-1 bg-gray-100 px-3 py-2 rounded border border-gray-200 text-xs truncate"
                    />
                    <button
                      onClick={copyReferralLink}
                      className="bg-primary text-white p-2 rounded hover:bg-primary/90 transition"
                      title="Copy referral link"
                    >
                      {copiedLink ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <ExternalLink className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
                  <p className="text-xs text-blue-800">
                    💡 <strong>Tip:</strong> Share this link on social media, forums, or with friends to earn 10% commission on every sale!
                  </p>
                </div>
              </div>
            </div>

            {/* Pricing Info */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Pricing Details</h3>
                <span className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full font-medium">
                  🔒 Vendor Set
                </span>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-3 border-b">
                  <span className="text-gray-600">Base Price</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(product.base_price)}</span>
                </div>
                <div className="flex items-center justify-between pb-3 border-b">
                  <span className="text-gray-600">Customer Price</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(product.final_price)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Your Commission (10%)</span>
                  <span className="font-semibold text-green-600">{formatCurrency(product.final_price * 0.1)}</span>
                </div>
              </div>
            </div>

            {/* Stock Info */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Package className="w-5 h-5 text-primary" />
                  Stock Status
                </h3>
                <span className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full font-medium">
                  🔒 Vendor Managed
                </span>
              </div>
              <div className="text-center py-4">
                <p className={`text-4xl font-bold mb-2 ${
                  product.stock > 10 ? 'text-green-600' : 
                  product.stock > 0 ? 'text-orange-600' : 
                  'text-red-600'
                }`}>
                  {product.stock}
                </p>
                <p className="text-sm text-gray-600">Units Available</p>
                {product.stock === 0 && (
                  <div className="mt-3 bg-red-50 border border-red-200 rounded p-2">
                    <p className="text-xs text-red-800">⚠️ Out of stock - Contact vendor</p>
                  </div>
                )}
                {product.stock > 0 && product.stock <= 5 && (
                  <div className="mt-3 bg-orange-50 border border-orange-200 rounded p-2">
                    <p className="text-xs text-orange-800">⚠️ Low stock - Promote quickly!</p>
                  </div>
                )}
              </div>
            </div>

            {/* Added Date */}
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-600">Added to your store</p>
              <p className="text-sm font-medium text-gray-900 mt-1">
                {new Date(product.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
