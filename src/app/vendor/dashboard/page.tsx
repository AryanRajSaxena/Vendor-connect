'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ShoppingBag,
  DollarSign,
  Clock,
  Package,
  ArrowUpRight,
  Plus,
  AlertCircle,
  Store,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency } from '@/utils/calculations';

interface DashboardStats {
  totalSold: number;
  totalEarned: number;
  inTransit: number;
  activeListings: number;
  thisMonthSales: number;
  thisMonthEarnings: number;
}

interface RecentOrder {
  id: string;
  productName: string;
  vendorPayout: number;
  basePrice?: number;
  order_status: string;
  commission_status: string;
  createdAt: string;
}

interface TopProduct {
  id: string;
  name: string;
  sold_count: number;
  base_price: number;
}

export default function VendorDashboard() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalSold: 0,
    totalEarned: 0,
    inTransit: 0,
    activeListings: 0,
    thisMonthSales: 0,
    thisMonthEarnings: 0,
  });
  const [allOrders, setAllOrders] = useState<RecentOrder[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (!isLoading && user?.role !== 'vendor') {
      router.push('/');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (!user?.id) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [productsRes, ordersRes] = await Promise.all([
          fetch(`/api/products?vendorId=${user.id}`),
          fetch(`/api/orders?vendorId=${user.id}`),
        ]);

        if (!productsRes.ok) throw new Error('Failed to load products');

        const productsData = await productsRes.json();
        const products: any[] = Array.isArray(productsData)
          ? productsData
          : productsData.products ?? [];

        let orders: any[] = [];
        if (ordersRes.ok) {
          const ordersData = await ordersRes.json();
          orders = Array.isArray(ordersData) ? ordersData : ordersData.orders ?? [];
        }

        const now = new Date();
        const cm = now.getMonth();
        const cy = now.getFullYear();

        const totalSold = orders.reduce((s, o) => {
          const paymentStatus = String(o.payment_status ?? o.paymentStatus ?? '').toLowerCase();
          if (paymentStatus !== 'completed') return s;
          return s + (Number(o.quantity ?? o.qty ?? 0) || 0);
        }, 0);
        const activeListings = products.filter((p) => p.is_active !== false).length;

        const totalEarned = orders
          .filter((o) => {
            const status = String(o.commission_status ?? '').toLowerCase();
            return status === 'available' || status === 'paid';
          })
          .reduce((s, o) => s + (o.vendor_payout ?? o.vendorPayout ?? 0), 0);

        const inTransit = orders
          .filter((o) => String(o.commission_status ?? '').toLowerCase() === 'pending')
          .reduce((s, o) => s + (o.vendor_payout ?? o.vendorPayout ?? 0), 0);

        const thisMonthOrders = orders.filter((o) => {
          const d = new Date(o.created_at ?? o.createdAt);
          return d.getMonth() === cm && d.getFullYear() === cy;
        });

        setStats({
          totalSold,
          totalEarned,
          inTransit,
          activeListings,
          thisMonthSales: thisMonthOrders.length,
          thisMonthEarnings: thisMonthOrders.reduce(
            (s, o) => s + (o.vendor_payout ?? o.vendorPayout ?? 0),
            0
          ),
        });

        setTopProducts(
          [...products].sort((a, b) => (b.sold_count ?? 0) - (a.sold_count ?? 0)).slice(0, 4)
        );

        setAllOrders(
          orders.map((o) => ({
            id: o.id,
            productName: o.product_name ?? o.productName ?? o.product?.name ?? 'Product',
            basePrice: Number(o.base_price ?? o.basePrice ?? o.price ?? 0),
            vendorPayout: o.vendor_payout ?? o.vendorPayout ?? 0,
            quantity: Number(o.quantity ?? o.qty ?? 0) || 0,
            order_status: o.order_status ?? o.status ?? 'pending',
            commission_status: String(o.commission_status ?? 'pending').toLowerCase(),
            createdAt: o.created_at ?? o.createdAt,
          }))
        );
        setCurrentPage(1);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.id]);

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'vendor') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-600/20 flex items-center justify-center">
            <Store className="w-10 h-10 text-emerald-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">Start Selling Today</h1>
          <p className="text-slate-400 mb-8">
            List your products and reach thousands of buyers. Grow your business on Agent Croww.
          </p>
          <div className="flex flex-col gap-3 justify-center items-center w-full max-w-md mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
              <span
                className="inline-flex items-center justify-center gap-2 bg-slate-700 text-slate-400 px-8 py-3 rounded-xl font-semibold cursor-not-allowed opacity-60"
              >
                Coming Soon
                <ArrowRight className="w-4 h-4" />
              </span>
              <Link
                href="/seller/marketplace?guestRole=vendor"
                className="inline-flex items-center justify-center gap-2 border border-emerald-500/50 text-emerald-200 hover:bg-emerald-500/10 px-8 py-3 rounded-xl font-semibold transition-colors"
              >
                Browse Products
              </Link>
            </div>
            <Link
              href="/auth/login"
              className="inline-flex items-center justify-center gap-2 border-2 border-slate-700 text-slate-100 hover:border-slate-600 px-8 py-3 rounded-xl font-semibold transition-colors w-full"
            >
              Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const commissionColor: Record<string, string> = {
    pending: 'text-amber-600',
    available: 'text-green-600',
    paid: 'text-gray-400',
  };

  // Calculate paginated orders
  const startIdx = (currentPage - 1) * itemsPerPage;
  const recentOrders = allOrders.slice(startIdx, startIdx + itemsPerPage);

  return (
    <div className="px-6 py-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user.name?.split(' ')[0]}
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {new Date().toLocaleDateString('en-IN', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>
        <Link
          href="/vendor/add-product"
          className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-md transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          New Product
        </Link>
      </div>

      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg mb-6">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <ShoppingBag className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-xs text-gray-500">Units Sold</span>
          </div>
          <p className="text-2xl font-semibold text-gray-900 tabular-nums">{stats.totalSold}</p>
          <p className="text-xs text-gray-400 mt-1">+{stats.thisMonthSales} this month</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-xs text-gray-500">Total Earned</span>
          </div>
          <p className="text-2xl font-semibold text-gray-900 tabular-nums">{formatCurrency(stats.totalEarned)}</p>
          <p className="text-xs text-gray-400 mt-1">+{formatCurrency(stats.thisMonthEarnings)} this month</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-xs text-gray-500">In Transit</span>
          </div>
          <p className="text-2xl font-semibold text-gray-900 tabular-nums">{formatCurrency(stats.inTransit)}</p>
          <p className="text-xs text-gray-400 mt-1">Pending release</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Package className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-xs text-gray-500">Active Listings</span>
          </div>
          <p className="text-2xl font-semibold text-gray-900 tabular-nums">{stats.activeListings}</p>
          <p className="text-xs text-gray-400 mt-1">Live products</p>
        </div>
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Recent Orders */}
        <div className="lg:col-span-3 bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-800">Order History</h2>
          </div>

          {recentOrders.length === 0 ? (
            <div className="py-14 text-center text-sm text-gray-400">No orders yet</div>
          ) : (
            <>
              <div className="divide-y divide-gray-50">
                {/* Table header */}
                <div className="grid grid-cols-4 gap-4 px-5 py-3.5 text-xs text-gray-500 border-b border-gray-100">
                  <div>Product</div>
                  <div>Price</div>
                  <div className="text-right">Your Payout</div>
                  <div className="text-right">Date</div>
                </div>

                {recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="grid grid-cols-4 gap-4 items-center px-5 py-3.5 hover:bg-gray-50 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{order.productName}</p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-700">{formatCurrency(order.basePrice ?? 0)}</p>
                    </div>

                    <div className="text-right">
                      <p className={`text-sm font-bold ${commissionColor[order.commission_status] ?? 'text-gray-700'}`}>
                        {formatCurrency(order.vendorPayout)}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Pagination */}
              {allOrders.length > itemsPerPage && (
                <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-100 bg-gray-50">
                  <p className="text-xs text-gray-500">
                    Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, allOrders.length)} of {allOrders.length}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4 text-gray-600" />
                    </button>
                    <span className="text-xs text-gray-600 font-medium">
                      Page {currentPage} of {Math.ceil(allOrders.length / itemsPerPage)}
                    </span>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(Math.ceil(allOrders.length / itemsPerPage), p + 1))}
                      disabled={currentPage === Math.ceil(allOrders.length / itemsPerPage)}
                      className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Top Products */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-800">Top Products</h2>
            <Link
              href="/vendor/products"
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 transition-colors"
            >
              Manage <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          {topProducts.length === 0 ? (
            <div className="py-14 text-center">
              <p className="text-sm text-gray-400 mb-4">No products listed yet</p>
              <Link
                href="/vendor/add-product"
                className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 bg-gray-900 text-white text-xs font-medium rounded-md hover:bg-gray-800 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add your first product
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {topProducts.map((product, i) => (
                <div key={product.id} className="flex items-center gap-3 px-5 py-3.5">
                  <span className="w-5 text-xs font-bold text-gray-300 text-center">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {formatCurrency(product.base_price)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-700">{product.sold_count ?? 0}</p>
                    <p className="text-xs text-gray-400">sold</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
