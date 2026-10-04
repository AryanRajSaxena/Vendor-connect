'use client';

import { useEffect, useState, useCallback } from 'react';
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
  CheckCircle2,
  Copy,
  Check,
  MessageSquare,
  RefreshCw,
  ExternalLink,
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

interface OrderItem {
  id: string;
  productName: string;
  vendorPayout: number;
  basePrice: number;
  order_status: string;
  commission_status: string;
  createdAt: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  whatsAppUrl: string;
  whatsAppDisplay: string;
}

interface TopProduct {
  id: string;
  name: string;
  sold_count: number;
  base_price: number;
}

function parseCustomerInfo(order: any) {
  let details = order.customer_details;
  if (typeof details === 'string') {
    try {
      details = JSON.parse(details);
    } catch {
      details = {};
    }
  }
  details = details || {};

  let addr = order.delivery_address;
  if (typeof addr === 'string') {
    try {
      addr = JSON.parse(addr);
    } catch {
      addr = {};
    }
  }
  addr = addr || {};

  const name = details.name || addr.fullName || details.fullName || 'Learner';
  const email = details.email || addr.email || '—';
  const rawPhone = String(details.phone || addr.phone || '').trim();
  const digits = rawPhone.replace(/\D/g, '');

  let whatsAppDisplay = '';
  let whatsAppUrl = '';

  if (digits.length >= 10) {
    const tenDigits = digits.slice(-10);
    whatsAppDisplay = `wa.me/91${tenDigits}`;
    whatsAppUrl = `https://wa.me/91${tenDigits}`;
  } else if (digits.length > 0) {
    whatsAppDisplay = `wa.me/${digits}`;
    whatsAppUrl = `https://wa.me/${digits}`;
  }

  return { name, email, phone: rawPhone, whatsAppDisplay, whatsAppUrl };
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
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && user?.role !== 'vendor') {
      router.push('/');
    }
  }, [user, isLoading, router]);

  const fetchData = useCallback(async (isSilent = false) => {
    if (!user || user.role !== 'vendor') return;

    try {
      if (!isSilent) setLoading(true);
      else setRefreshing(true);
      setError(null);

      const params = new URLSearchParams();
      if (user.id && user.id !== 'undefined' && user.id !== 'null') {
        params.set('vendorId', user.id);
      }
      if (user.email) {
        params.set('vendorEmail', user.email);
      }

      const queryString = params.toString();
      const [productsRes, ordersRes] = await Promise.all([
        fetch(queryString ? `/api/products?${queryString}` : '/api/products'),
        fetch(queryString ? `/api/orders?${queryString}` : '/api/orders'),
      ]);

      if (!productsRes.ok) throw new Error('Failed to load products');

      const productsData = await productsRes.json();
      const products: any[] = Array.isArray(productsData)
        ? productsData
        : productsData.products ?? [];

      let rawOrders: any[] = [];
      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        rawOrders = Array.isArray(ordersData) ? ordersData : ordersData.orders ?? [];
      }

      const now = new Date();
      const cm = now.getMonth();
      const cy = now.getFullYear();

      const totalSold = products.reduce((s, p) => s + (p.sold_count ?? 0), 0);
      const activeListings = products.filter((p) => p.is_active !== false).length;

      const totalEarned = rawOrders
        .filter((o) => o.commission_status === 'available' || o.commission_status === 'paid')
        .reduce((s, o) => s + (o.vendor_payout ?? o.vendorPayout ?? 0), 0);

      const inTransit = rawOrders
        .filter((o) => o.commission_status === 'pending')
        .reduce((s, o) => s + (o.vendor_payout ?? o.vendorPayout ?? 0), 0);

      const thisMonthOrders = rawOrders.filter((o) => {
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

      // Orders are already sorted descending (latest sale at the top)
      setOrders(
        rawOrders.map((o) => {
          const cust = parseCustomerInfo(o);
          return {
            id: o.id,
            productName: o.product?.name ?? o.product_name ?? o.productName ?? 'Digital Course',
            vendorPayout: Number(o.vendor_payout ?? o.vendorPayout ?? 0),
            basePrice: Number(o.base_price ?? o.basePrice ?? 0),
            order_status: o.order_status ?? o.status ?? 'pending',
            commission_status: o.commission_status ?? 'pending',
            createdAt: o.created_at ?? o.createdAt ?? new Date().toISOString(),
            customerName: cust.name,
            customerEmail: cust.email,
            customerPhone: cust.phone,
            whatsAppUrl: cust.whatsAppUrl,
            whatsAppDisplay: cust.whatsAppDisplay,
          };
        })
      );
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    if (user && user.role === 'vendor') {
      fetchData();
    }
  }, [fetchData, user]);

  const copyToClipboard = (text: string, id: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleGrantAccess = async (orderId: string) => {
    try {
      setUpdatingOrderId(orderId);
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderStatus: 'delivered',
          commissionStatus: 'available',
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to update order fulfillment status');
      }

      // Update state locally
      setOrders((prev) =>
        prev.map((ord) =>
          ord.id === orderId
            ? {
                ...ord,
                order_status: 'delivered',
                commission_status: 'available',
              }
            : ord
        )
      );

      // Update KPIs
      setStats((prev) => {
        const targetOrder = orders.find((o) => o.id === orderId);
        const payout = targetOrder?.vendorPayout || 0;
        return {
          ...prev,
          inTransit: Math.max(0, prev.inTransit - payout),
          totalEarned: prev.totalEarned + payout,
        };
      });

      setToastMessage(`Access granted for order #${orderId.slice(-6)}! Commission released.`);
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: any) {
      console.error('Error granting access:', err);
      alert(err.message || 'Failed to update access');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Loading your vendor portal...</p>
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
            List your digital courses and templates. Reach top sales sellers across India.
          </p>
          <div className="flex flex-col gap-3 justify-center items-center w-full max-w-md mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
              <span className="inline-flex items-center justify-center gap-2 bg-slate-700 text-slate-400 px-8 py-3 rounded-xl font-semibold cursor-not-allowed opacity-60">
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

  return (
    <div className="px-4 sm:px-6 py-8 max-w-6xl mx-auto space-y-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2.5 bg-emerald-900 text-emerald-100 border border-emerald-700 px-4 py-3 rounded-xl shadow-xl animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span className="text-xs sm:text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user.name?.split(' ')[0]}
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            {new Date().toLocaleDateString('en-IN', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })} • Manage live orders, buyer access, and product payouts
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs font-medium rounded-lg shadow-sm transition-colors disabled:opacity-50"
            title="Refresh Orders"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-primary-600' : 'text-gray-500'}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
          <Link
            href="/vendor/add-product"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-xs sm:text-sm font-medium rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            New Product
          </Link>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-2">
            <ShoppingBag className="w-4 h-4 text-gray-400" />
            <span className="text-xs font-medium text-gray-500">Units Sold</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 tabular-nums">{stats.totalSold}</p>
          <p className="text-xs text-gray-400 mt-1">+{stats.thisMonthSales} this month</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-gray-400" />
            <span className="text-xs font-medium text-gray-500">Total Earned</span>
          </div>
          <p className="text-2xl font-bold text-emerald-600 tabular-nums">{formatCurrency(stats.totalEarned)}</p>
          <p className="text-xs text-gray-400 mt-1">+{formatCurrency(stats.thisMonthEarnings)} this month</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-medium text-gray-500">Pending Fulfillment</span>
          </div>
          <p className="text-2xl font-bold text-amber-600 tabular-nums">{formatCurrency(stats.inTransit)}</p>
          <p className="text-xs text-gray-400 mt-1">Unlocks on access grant</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-2">
            <Package className="w-4 h-4 text-gray-400" />
            <span className="text-xs font-medium text-gray-500">Active Listings</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 tabular-nums">{stats.activeListings}</p>
          <p className="text-xs text-gray-400 mt-1">Live digital products</p>
        </div>
      </div>

      {/* Orders & Fulfillment Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 border-b border-gray-100 gap-2 bg-gray-50/50">
          <div>
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              Orders &amp; Fulfillment
              <span className="text-xs font-medium bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                {orders.length} {orders.length === 1 ? 'sale' : 'sales'}
              </span>
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Every time a sale happens, a new row appears at the top. Mark access granted to release commissions.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/vendor/sales"
              className="inline-flex items-center gap-1 text-xs font-semibold text-gray-600 hover:text-gray-900 transition-colors"
            >
              All Sales History <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="py-20 text-center px-4">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3 text-gray-400">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-gray-800 mb-1">No Orders Yet</h3>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">
              Once sellers share your referral links and students enroll, new sales will appear here automatically in real time.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-gray-50/80 border-b border-gray-100 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Order Date &amp; ID</th>
                  <th className="px-5 py-3.5">Buyer Name, Email &amp; WhatsApp</th>
                  <th className="px-5 py-3.5">Course &amp; Payout</th>
                  <th className="px-5 py-3.5">Fulfillment Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((order) => {
                  const isPending = order.order_status === 'pending';
                  const isDelivered = order.order_status === 'delivered' || order.order_status === 'confirmed';
                  const isUpdating = updatingOrderId === order.id;

                  const orderDate = new Date(order.createdAt);
                  const formattedDate = orderDate.toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  });
                  const formattedTime = orderDate.toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true,
                  });

                  return (
                    <tr key={order.id} className="hover:bg-gray-50/70 transition-colors">
                      {/* 1. Order Date & ID */}
                      <td className="px-5 py-4 align-top">
                        <div className="font-semibold text-gray-900">{formattedDate}</div>
                        <div className="text-[11px] text-gray-400 mb-1.5">{formattedTime}</div>
                        <div className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 font-mono text-[11px] px-2 py-0.5 rounded border border-gray-200">
                          <span>#{order.id.slice(-8)}</span>
                          <button
                            onClick={() => copyToClipboard(order.id, `ord-${order.id}`)}
                            title="Copy full Order ID"
                            className="text-gray-400 hover:text-gray-700 transition-colors"
                          >
                            {copiedId === `ord-${order.id}` ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* 2. Buyer Name, Email & Copyable WhatsApp Link */}
                      <td className="px-5 py-4 align-top">
                        <div className="font-semibold text-gray-900 text-sm">
                          {order.customerName}
                        </div>
                        <div className="text-xs text-gray-500 mb-2 truncate max-w-[220px]">
                          {order.customerEmail}
                        </div>

                        {order.whatsAppDisplay ? (
                          <div className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200/80 rounded-md px-2 py-1">
                            <a
                              href={order.whatsAppUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
                              title="Chat with buyer on WhatsApp"
                            >
                              <MessageSquare className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                              <span>{order.whatsAppDisplay}</span>
                              <ExternalLink className="w-2.5 h-2.5 text-emerald-500 ml-0.5" />
                            </a>
                            <button
                              onClick={() => copyToClipboard(order.whatsAppDisplay, `wa-${order.id}`)}
                              className="p-1 text-emerald-700/60 hover:text-emerald-800 rounded hover:bg-emerald-100/50 transition-colors ml-0.5"
                              title="Copy WhatsApp link"
                            >
                              {copiedId === `wa-${order.id}` ? (
                                <Check className="w-3 h-3 text-emerald-700" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-gray-400 italic">No phone provided</span>
                        )}
                      </td>

                      {/* 3. Course & Payout */}
                      <td className="px-5 py-4 align-top">
                        <div className="font-semibold text-gray-900 text-sm truncate max-w-[220px]">
                          {order.productName}
                        </div>
                        <div className="text-xs font-bold text-emerald-600 mt-0.5">
                          {formatCurrency(order.vendorPayout)}{' '}
                          <span className="text-[11px] font-normal text-gray-400">payout (80%)</span>
                        </div>
                      </td>

                      {/* 4. Fulfillment Status & Action */}
                      <td className="px-5 py-4 align-top">
                        {isPending ? (
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              <Clock className="w-3 h-3 text-amber-600" />
                              Pending Access
                            </span>
                            <button
                              onClick={() => handleGrantAccess(order.id)}
                              disabled={isUpdating}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
                            >
                              {isUpdating ? (
                                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              )}
                              Mark Access Granted
                            </button>
                          </div>
                        ) : isDelivered ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Access Granted
                          </div>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                            {order.order_status}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Top Products */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-900">Top Listed Products</h2>
            <p className="text-xs text-gray-500 mt-0.5">High-converting courses driving seller volume</p>
          </div>
          <Link
            href="/vendor/products"
            className="flex items-center gap-1 text-xs font-semibold text-gray-600 hover:text-gray-900 transition-colors"
          >
            Manage All <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {topProducts.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-gray-400 mb-3">No products listed yet</p>
            <Link
              href="/vendor/add-product"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white text-xs font-medium rounded-lg hover:bg-gray-800 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add your first product
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {topProducts.map((product, i) => (
              <div key={product.id} className="flex items-center justify-between px-6 py-3.5 hover:bg-gray-50/50 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-5 text-xs font-bold text-gray-400 text-center">{i + 1}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{product.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Price: {formatCurrency(product.base_price)}
                    </p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-gray-900">{product.sold_count ?? 0}</p>
                  <p className="text-xs text-gray-400">enrollments</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

