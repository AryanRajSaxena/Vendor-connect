'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  Download,
  ShoppingBag,
  DollarSign,
  BarChart3,
  CheckCircle2,
  Copy,
  Check,
  MessageSquare,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency } from '@/utils/calculations';

interface VendorOrder {
  id: string;
  productName: string;
  quantity: number;
  basePrice: number;
  vendorPayout: number;
  sellerCommission: number;
  platformCommission: number;
  order_status: string;
  commission_status: string;
  createdAt: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  whatsAppUrl: string;
  whatsAppDisplay: string;
}

type FilterStatus = 'all' | 'pending' | 'confirmed' | 'delivered' | 'cancelled';
type TimeRange = 'week' | 'month' | 'year' | 'all';

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

export default function VendorSalesPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [orders, setOrders] = useState<VendorOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [timeRange, setTimeRange] = useState<TimeRange>('all');
  const [monthlyData, setMonthlyData] = useState<{ month: string; earnings: number }[]>([]);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && user?.role !== 'vendor') router.push('/');
    if (user?.id) fetchOrders();
  }, [user, isLoading, router]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/orders?vendorId=${user?.id}`);
      if (!res.ok) throw new Error('Failed to fetch orders');
      const data = await res.json();
      const raw: any[] = Array.isArray(data) ? data : data.orders ?? [];
      setOrders(
        raw.map((o) => {
          const cust = parseCustomerInfo(o);
          return {
            id: o.id,
            productName: o.product?.name ?? o.product_name ?? o.productName ?? 'Digital Course',
            quantity: o.quantity ?? 1,
            basePrice: Number(o.base_price ?? o.basePrice ?? 0),
            vendorPayout: Number(o.vendor_payout ?? o.vendorPayout ?? 0),
            sellerCommission: Number(o.seller_commission ?? o.sellerCommission ?? 0),
            platformCommission: Number(o.platform_commission ?? o.platformCommission ?? 0),
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

      // Compute monthly earnings for chart
      const monthly: Record<string, number> = {};
      raw.forEach((o) => {
        const d = new Date(o.created_at ?? o.createdAt ?? '');
        if (isNaN(d.getTime())) return;
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        monthly[key] = (monthly[key] ?? 0) + (o.vendor_payout ?? o.vendorPayout ?? 0);
      });
      const points = Object.keys(monthly)
        .sort()
        .slice(-6)
        .map((k) => {
          const [y, m] = k.split('-');
          return {
            month: new Date(parseInt(y), parseInt(m) - 1).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
            earnings: monthly[k],
          };
        });
      setMonthlyData(points);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

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

      setToastMessage(`Access granted for order #${orderId.slice(-6)}! Commission released.`);
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: any) {
      console.error('Error granting access:', err);
      alert(err.message || 'Failed to update access');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const filtered = orders.filter((o) => {
    if (filterStatus !== 'all' && o.order_status !== filterStatus) return false;
    if (timeRange !== 'all') {
      const diffDays = Math.ceil(
        (Date.now() - new Date(o.createdAt).getTime()) / 86400000
      );
      if (timeRange === 'week' && diffDays > 7) return false;
      if (timeRange === 'month' && diffDays > 30) return false;
      if (timeRange === 'year' && diffDays > 365) return false;
    }
    return true;
  });

  const stats = {
    totalOrders: orders.length,
    totalEarnings: orders
      .filter((o) => o.order_status === 'delivered' || o.order_status === 'confirmed')
      .reduce((s, o) => s + o.vendorPayout, 0),
    delivered: orders.filter((o) => o.order_status === 'delivered' || o.order_status === 'confirmed').length,
    pending: orders.filter((o) => o.order_status === 'pending').length,
  };

  const exportCSV = () => {
    const csv = [
      ['Order ID', 'Date', 'Customer Name', 'Customer Email', 'Customer Phone', 'Course', 'Your Payout (80%)', 'Status'].join(','),
      ...filtered.map((o) =>
        [
          `"${o.id}"`,
          `"${new Date(o.createdAt).toLocaleDateString()}"`,
          `"${o.customerName}"`,
          `"${o.customerEmail}"`,
          `"${o.customerPhone}"`,
          `"${o.productName.replace(/"/g, '""')}"`,
          o.vendorPayout,
          `"${o.order_status}"`,
        ].join(',')
      ),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'orders-fulfillment.csv';
    a.click();
  };

  if (isLoading) return null;
  if (!user || user.role !== 'vendor') return null;

  return (
    <div className="px-4 sm:px-6 py-8 max-w-6xl mx-auto space-y-6">
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
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Orders &amp; Fulfillment</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Track student enrollments, reach out via WhatsApp, and grant digital access
          </p>
        </div>
        <button
          onClick={exportCSV}
          disabled={filtered.length === 0}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-medium text-gray-700 hover:text-gray-900 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-xs disabled:opacity-40 self-start sm:self-auto"
        >
          <Download className="w-4 h-4" />
          Export Orders CSV
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-2">
            <ShoppingBag className="w-4 h-4 text-gray-400" />
            <span className="text-xs font-medium text-gray-500">Total Orders</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 tabular-nums">{stats.totalOrders}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-gray-400" />
            <span className="text-xs font-medium text-gray-500">Total Payout</span>
          </div>
          <p className="text-2xl font-bold text-emerald-600 tabular-nums">{formatCurrency(stats.totalEarnings)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-medium text-gray-500">Pending Access</span>
          </div>
          <p className="text-2xl font-bold text-amber-600 tabular-nums">{stats.pending}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-medium text-gray-500">Access Granted</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 tabular-nums">{stats.delivered}</p>
        </div>
      </div>

      {/* Monthly Earnings Chart */}
      {monthlyData.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-800">Monthly Payout Trends</h2>
          </div>
          <div className="flex items-end gap-3 h-28">
            {monthlyData.map((pt) => {
              const max = Math.max(...monthlyData.map((p) => p.earnings), 1);
              const pct = Math.max((pt.earnings / max) * 100, 6);
              return (
                <div key={pt.month} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[11px] text-gray-500 font-medium">{formatCurrency(pt.earnings)}</span>
                  <div className="w-full bg-emerald-50 rounded-t-md" style={{ height: `${pct}%` }}>
                    <div className="w-full h-full bg-emerald-600 rounded-t-md opacity-85" />
                  </div>
                  <span className="text-[11px] text-gray-500">{pt.month}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-3.5 flex flex-wrap items-center gap-2.5 shadow-xs">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
          className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
        >
          <option value="all">All Statuses ({orders.length})</option>
          <option value="pending">Pending Access ({orders.filter(o => o.order_status === 'pending').length})</option>
          <option value="delivered">Access Granted ({orders.filter(o => o.order_status === 'delivered' || o.order_status === 'confirmed').length})</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value as TimeRange)}
          className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
        >
          <option value="all">All Time</option>
          <option value="week">Last 7 Days</option>
          <option value="month">Last 30 Days</option>
          <option value="year">Last Year</option>
        </select>

        <div className="ml-auto text-xs text-gray-400">
          Showing {filtered.length} of {orders.length} orders
        </div>
      </div>

      {/* Orders & Fulfillment Table */}
      {loading ? (
        <div className="flex items-center justify-center min-h-48 bg-white rounded-xl border border-gray-200">
          <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 py-16 text-center">
          <ShoppingBag className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-gray-700">No matching orders found</p>
          <p className="text-xs text-gray-400 mt-1">Try adjusting the filter status or time range.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
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
                {filtered.map((order) => {
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

          {/* Footer summary */}
          <div className="border-t border-gray-100 bg-gray-50/80 px-5 py-3.5 flex flex-wrap items-center justify-between gap-4 text-xs sm:text-sm">
            <span className="text-gray-600">
              Showing <span className="font-semibold text-gray-900">{filtered.length}</span> orders •{' '}
              <span className="font-semibold text-emerald-600">
                {formatCurrency(filtered.reduce((s, o) => s + o.vendorPayout, 0))}
              </span>{' '}
              total vendor payout
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

