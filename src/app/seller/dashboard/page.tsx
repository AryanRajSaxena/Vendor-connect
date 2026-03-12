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
  final_price: number;
  category: string;
  referral_code: string;
  sold_count: number;
  clicks: number;
  earnings: number;
  images?: string[];
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
          final_price: p.final_price || 0,
          category: p.category || '',
          referral_code: p.referral_code || '',
          sold_count: p.sold_count || 0,
          clicks: p.clicks || 0,
          earnings: p.earnings || 0,
          images: p.images || [],
          created_at: p.created_at || '',
        }));
        setSellerProducts(products);
      }

      let orders: any[] = [];
      if (ordersRes.ok) {
        const raw = await ordersRes.json();
        orders = (Array.isArray(raw) ? raw : raw.orders || []).map((o: any) => ({
          sellerCommission: o.seller_commission || o.sellerCommission || 0,
          createdAt: o.created_at || o.createdAt || '',
        }));
      }

      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const thisMonthOrders = orders.filter((o) => new Date(o.createdAt) >= monthStart);

      setStats({
        totalProducts: products.length,
        totalSales: products.reduce((s, p) => s + (p.sold_count || 0), 0),
        totalEarnings: products.reduce((s, p) => s + (p.earnings || 0), 0),
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

  if (!user || user.role !== 'seller') return null;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs text-gray-400 mb-0.5">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
          <h1 className="text-xl font-semibold text-gray-900">
            {getGreeting()}, {user.name?.split(' ')[0] || 'there'}
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {stats.totalEarnings > 0
              ? `${formatCurrency(stats.totalEarnings)} earned across ${stats.totalProducts} product${stats.totalProducts !== 1 ? 's' : ''}`
              : 'Start earning 10% on every sale you drive'}
          </p>
        </div>
        <Link
          href="/seller/marketplace"
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-md transition-colors"
        >
          <Store className="w-3.5 h-3.5" />
          Browse Products
        </Link>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg mb-5 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-md bg-primary-50 flex items-center justify-center">
              <Store className="w-3.5 h-3.5 text-primary-500" />
            </div>
            <span className="text-xs text-gray-500">My Products</span>
          </div>
          <p className="text-2xl font-semibold tabular-nums text-gray-900">{stats.totalProducts}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-md bg-primary-50 flex items-center justify-center">
              <ShoppingBag className="w-3.5 h-3.5 text-primary-500" />
            </div>
            <span className="text-xs text-gray-500">Total Sales</span>
          </div>
          <p className="text-2xl font-semibold tabular-nums text-gray-900">{stats.totalSales}</p>
        </div>
        <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-md bg-white/10 flex items-center justify-center">
              <DollarSign className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-xs text-primary-200">Total Earned</span>
          </div>
          <p className="text-2xl font-semibold tabular-nums text-white">
            {formatCurrency(stats.totalEarnings)}
          </p>
          <p className="text-[10px] text-primary-300 mt-1">10% commission</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-md bg-white/10 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-xs text-emerald-100">This Month</span>
          </div>
          <p className="text-2xl font-semibold tabular-nums text-white">
            {formatCurrency(stats.thisMonthEarnings)}
          </p>
          <p className="text-[10px] text-emerald-200 mt-1">earned this month</p>
        </div>
      </div>

      {/* My Products */}
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
                <div
                  key={product.id}
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
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{product.product_name}</p>
                    <p className="text-xs text-gray-400">{product.category}</p>
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

                  {/* Link */}
                  <Link
                    href={`/seller/dashboard/products/${product.id}`}
                    className="text-gray-400 hover:text-gray-700 transition-colors flex-shrink-0"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
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