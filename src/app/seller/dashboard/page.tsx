'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  TrendingUp,
  ShoppingBag,
  DollarSign,
  Store,
  ArrowRight,
  AlertCircle,
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
  course_duration?: string;
  learning_outcomes?: string[];
  curriculum?: Array<{ title?: string; lessons?: number; duration?: string }>;
  created_at: string;
}

interface Stats {
  totalProducts: number;
  totalSales: number;
  totalEarnings: number;
  thisMonthEarnings: number;
  thisMonthSales: number;
}

const categoryGradient = (category: string) => {
  const map: Record<string, string> = {
    'Course': 'from-violet-100 to-purple-50',
    'Ebook': 'from-sky-100 to-blue-50',
    'Template': 'from-teal-100 to-emerald-50',
    'Software': 'from-orange-100 to-amber-50',
    'Design': 'from-pink-100 to-rose-50',
    'Music': 'from-indigo-100 to-blue-50',
    'Video': 'from-red-100 to-orange-50',
  };
  return map[category] || 'from-gray-100 to-gray-50';
};

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

export default function SellerDashboard() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  const [sellerProducts, setSellerProducts] = useState<SellerProduct[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalProducts: 0,
    totalSales: 0,
    totalEarnings: 0,
    thisMonthEarnings: 0,
    thisMonthSales: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && user?.role !== 'seller') {
      router.push('/');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [productsRes, ordersRes] = await Promise.all([
        fetch(`/api/seller-products?sellerId=${user!.id}`),
        fetch(`/api/orders?sellerId=${user!.id}`),
      ]);

      let products: SellerProduct[] = [];
      if (productsRes.ok) {
        const raw = await productsRes.json();
        products = (Array.isArray(raw) ? raw : raw.products || []).map((p: any) => ({
          id: p.id,
          productId: p.product_id || p.productId,
          product_name: p.product_name || p.name || '',
          description: p.description || '',
          base_price: p.base_price || 0,
          category: p.category || '',
          referral_code: p.referral_code || '',
          sold_count: p.sold_count || 0,
          clicks: p.clicks || 0,
          earnings: p.earnings || 0,
          is_active: p.is_active !== false,
          images: p.images || [],
          course_duration: p.course_duration || '',
          learning_outcomes: p.learning_outcomes || [],
          curriculum: p.curriculum || [],
          created_at: p.created_at || '',
        }));
      }

      let orders: any[] = [];
      if (ordersRes.ok) {
        const raw = await ordersRes.json();
        orders = (Array.isArray(raw) ? raw : raw.orders || []).map((o: any) => ({
          sellerCommission: o.seller_commission || o.sellerCommission || 0,
          createdAt: o.created_at || o.createdAt || '',
          productId: o.product_id || o.productId || '',
        }));
      }

      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const thisMonthOrders = orders.filter((o) => new Date(o.createdAt) >= monthStart);

      const earningsByProduct = orders.reduce((acc: Record<string, { earnings: number; sales: number }>, o) => {
        const key = o.productId;
        if (!key) return acc;
        if (!acc[key]) acc[key] = { earnings: 0, sales: 0 };
        acc[key].earnings += Number(o.sellerCommission || 0);
        acc[key].sales += 1;
        return acc;
      }, {});

      const enrichedProducts = products.map((p) => ({
        ...p,
        earnings: Math.round((earningsByProduct[p.productId]?.earnings || 0) * 100) / 100,
        sold_count: earningsByProduct[p.productId]?.sales || 0,
      }));

      setSellerProducts(enrichedProducts);

      setStats({
        totalProducts: products.length,
        totalSales: orders.length,
        totalEarnings: Math.round(orders.reduce((s, o) => s + Number(o.sellerCommission || 0), 0) * 100) / 100,
        thisMonthSales: thisMonthOrders.length,
        thisMonthEarnings: thisMonthOrders.reduce((s, o) => s + o.sellerCommission, 0),
      });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || user.role !== 'seller') {
    return (
      <div className="min-h-screen bg-slate-950">
        {/* Header Section */}
        <div className="flex items-center justify-center px-4 py-16 md:py-20">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-violet-600/20 flex items-center justify-center">
              <TrendingUp className="w-10 h-10 text-violet-400" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Join as a Seller</h1>
            <p className="text-lg text-slate-300 mb-10 max-w-md mx-auto">
              Sign up to start earning commissions on every sale. No inventory, no risk.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col gap-3 justify-center items-center mb-16">
              <Link
                href="/auth/login"
                className="inline-flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-8 py-3 rounded-xl font-semibold transition-colors shadow-lg shadow-violet-600/20"
              >
                Get Started
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/auth/login"
                className="inline-flex items-center justify-center gap-2 border-2 border-slate-700 text-slate-100 hover:border-slate-600 px-8 py-3 rounded-xl font-semibold transition-colors"
              >
                Login
              </Link>
              <Link
                href="/seller/marketplace?guestRole=seller"
                className="inline-flex items-center justify-center gap-2 border border-emerald-500/50 text-emerald-200 hover:bg-emerald-500/10 px-8 py-3 rounded-xl font-semibold transition-colors"
              >
                Browse Products
              </Link>
            </div>
          </div>
        </div>

        {/* Commission Structure Section */}
        <div className="w-full bg-gradient-to-b from-slate-900/50 to-slate-950 border-t border-slate-800 px-4 py-16">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">Commission Structure</h2>
              <p className="text-slate-400 text-lg">Transparent and competitive earning model</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Main Commission Card */}
              <div className="rounded-2xl border border-violet-500/40 bg-gradient-to-br from-violet-500/15 to-violet-600/5 p-8">
                <div className="mb-8">
                  <p className="text-sm text-violet-300 font-semibold uppercase tracking-widest mb-4">Commission on Every Sale</p>
                  <div className="flex items-baseline gap-3">
                    <span className="text-6xl font-black text-violet-300">10%</span>
                    <span className="text-base text-violet-200">of product price</span>
                  </div>
                </div>
                
                <p className="text-slate-300 text-sm leading-relaxed">
                  Earn a flat 10% commission on every successful sale through your referral link or product listing. Instant payouts and transparent tracking.
                </p>
              </div>

              {/* Example Earnings Card */}
              <div className="rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-cyan-500/15 to-cyan-600/5 p-8">
                <p className="text-sm text-cyan-300 font-semibold uppercase tracking-widest mb-6">Example Earnings</p>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-cyan-900/20 rounded-lg p-4">
                    <span className="text-slate-200">₹1,000 product sale</span>
                    <span className="text-xl font-bold text-cyan-400">₹100</span>
                  </div>
                  <div className="flex items-center justify-between bg-cyan-900/20 rounded-lg p-4">
                    <span className="text-slate-200">₹5,000 product sale</span>
                    <span className="text-xl font-bold text-cyan-400">₹500</span>
                  </div>
                  <div className="flex items-center justify-between bg-cyan-900/20 rounded-lg p-4">
                    <span className="text-slate-200">₹10,000 product sale</span>
                    <span className="text-xl font-bold text-cyan-400">₹1,000</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Info */}
            <div className="mt-12 pt-12 border-t border-slate-800">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div>
                  <p className="text-3xl font-bold text-emerald-400 mb-2">10%</p>
                  <p className="text-slate-400">Fixed commission rate for all products</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-violet-400 mb-2">Instant</p>
                  <p className="text-slate-400">Real-time earnings tracking and payouts</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-cyan-400 mb-2">Unlimited</p>
                  <p className="text-slate-400">No cap on how much you can earn</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const dayOfMonth = new Date().getDate();
  const estimatedMonthClose =
    dayOfMonth > 0 ? (stats.thisMonthEarnings / dayOfMonth) * 30 : stats.thisMonthEarnings;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Page header */}
      <div className="mb-6 rounded-xl border border-emerald-400/20 bg-gradient-to-r from-slate-900 to-slate-800 p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs text-slate-400 mb-1">
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
            <h1 className="text-2xl font-semibold text-slate-100">
              {getGreeting()}, {user.name?.split(' ')[0] || 'there'}
            </h1>
            <p className="mt-1 text-sm text-slate-300">
              {stats.totalEarnings > 0
                ? 'You are in earning mode. Scale your payouts by adding high-converting products and driving repeat sales.'
                : 'Your first commission is one product away. Add a product and start earning today.'}
            </p>
          </div>
          <Link
            href="/seller/marketplace"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-md transition-colors"
          >
            <Store className="w-3.5 h-3.5" />
            Browse Products
          </Link>
        </div>

        <div className="mt-4 rounded-lg border border-emerald-400/25 bg-emerald-400/10 p-4">
          <p className="text-[11px] uppercase tracking-wide text-emerald-300 font-semibold">Commission Wallet</p>
          <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
            <p className="text-3xl font-black tracking-tight text-emerald-300 tabular-nums [text-shadow:0_0_6px_rgba(52,211,153,0.2)]">
              {formatCurrency(stats.totalEarnings)}
            </p>
            <p className="text-sm text-emerald-200">
              Estimated month close: <span className="font-bold tabular-nums">{formatCurrency(estimatedMonthClose)}</span>
            </p>
          </div>
          <p className="mt-1 text-[11px] text-emerald-200/90">Lifetime commissions earned from your store sales</p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg mb-5 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="rounded-lg border border-teal-400/25 bg-teal-500/10 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-md bg-teal-400/20 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5 text-teal-300" />
            </div>
            <span className="text-xs text-teal-200">This Month</span>
          </div>
          <p className="text-2xl font-semibold tabular-nums text-teal-200">{formatCurrency(stats.thisMonthEarnings)}</p>
          <p className="text-[10px] text-teal-200/80 mt-1">{stats.thisMonthSales} sales this month</p>
        </div>

        <div className="rounded-lg border border-emerald-400/20 p-4 bg-emerald-500/10">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-md bg-emerald-400/20 flex items-center justify-center">
              <DollarSign className="w-3.5 h-3.5 text-emerald-300" />
            </div>
            <span className="text-xs text-emerald-200">Projected Month Close</span>
          </div>
          <p className="text-2xl font-semibold tabular-nums text-emerald-200">{formatCurrency(estimatedMonthClose)}</p>
          <p className="text-[10px] text-emerald-200/80 mt-1">based on current month pace</p>
        </div>

        <div className="rounded-lg border border-slate-700 p-4 bg-slate-900/60">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-md bg-slate-800 flex items-center justify-center">
              <ShoppingBag className="w-3.5 h-3.5 text-slate-300" />
            </div>
            <span className="text-xs text-slate-400">Total Sales</span>
          </div>
          <p className="text-2xl font-semibold tabular-nums text-slate-100">{stats.totalSales}</p>
          <p className="text-[10px] text-slate-400 mt-1">across {stats.totalProducts} active product{stats.totalProducts !== 1 ? 's' : ''}</p>
        </div>

        <div className="rounded-lg border border-slate-700 p-4 bg-slate-900/60">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-md bg-slate-800 flex items-center justify-center">
              <Store className="w-3.5 h-3.5 text-slate-300" />
            </div>
            <span className="text-xs text-slate-400">My Products</span>
          </div>
          <p className="text-2xl font-semibold tabular-nums text-slate-100">{stats.totalProducts}</p>
          <p className="text-[10px] text-slate-400 mt-1">more quality listings can unlock higher commissions</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-800">My Products</h2>
          <Link
            href="/seller/marketplace"
            className="text-xs text-gray-400 hover:text-gray-700 transition-colors"
          >
            Browse more
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : sellerProducts.length === 0 ? (
          <div className="py-16 text-center px-6">
            <Store className="w-8 h-8 text-gray-200 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-700 mb-1">No products yet</p>
            <p className="text-xs text-gray-400 mb-5">
              Browse the marketplace and add products to start earning 10% commission
            </p>
            <Link
              href="/seller/marketplace"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-md transition-colors"
            >
              <Store className="w-3.5 h-3.5" />
              Go to Marketplace
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {sellerProducts.map((product) => {
              const imgUrl = getImageUrl(product.images?.[0]);
              return (
                <Link
                  key={product.id}
                  href={`/seller/dashboard/products/${product.id}`}
                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors"
                >
                  {/* Thumbnail */}
                  <div
                    className={`w-10 h-10 rounded-lg bg-gradient-to-br ${categoryGradient(product.category)} flex-shrink-0 overflow-hidden`}
                  >
                    {imgUrl && (
                      <img
                        src={imgUrl}
                        alt={product.product_name}
                        className="w-full h-full object-cover rounded-lg"
                        loading="eager"
                        fetchPriority="high"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{product.product_name}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-gray-400">{product.category}</p>
                      {product.is_active === false && (
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                          Paused
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-gray-500">
                      {product.course_duration ? <span>{product.course_duration}</span> : null}
                      {Array.isArray(product.curriculum) && product.curriculum.length > 0 ? (
                        <span>{product.curriculum.length} modules</span>
                      ) : null}
                      {Array.isArray(product.learning_outcomes) && product.learning_outcomes.length > 0 ? (
                        <span>{product.learning_outcomes.length} outcomes</span>
                      ) : null}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-5 text-right">
                    <div className="hidden sm:block">
                      <p className="text-xs text-gray-400">Sales</p>
                      <p className="text-sm font-semibold tabular-nums text-gray-900">
                        {product.sold_count}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Earned</p>
                      <p className="text-sm font-semibold tabular-nums text-emerald-600">
                        {formatCurrency(product.earnings || 0)}
                      </p>
                    </div>
                  </div>

                  {/* Enter */}
                  <span className="text-gray-400 hover:text-gray-700 transition-colors flex-shrink-0">
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick links */}
      {sellerProducts.length > 0 && (
        <div className="grid grid-cols-2 gap-3 mt-4">
          <Link
            href="/seller/sales"
            className="flex items-center justify-between bg-white rounded-lg border border-gray-200 px-4 py-3 hover:border-gray-300 transition-colors group"
          >
            <span className="text-sm font-medium text-gray-900">Sales & Earnings</span>
            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
          </Link>
          <Link
            href="/seller/marketplace"
            className="flex items-center justify-between bg-white rounded-lg border border-gray-200 px-4 py-3 hover:border-gray-300 transition-colors group"
          >
            <span className="text-sm font-medium text-gray-900">Browse Marketplace</span>
            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
          </Link>
        </div>
      )}
    </div>
  );
}