'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Download, TrendingUp, ShoppingBag, DollarSign, CheckCircle, BarChart3 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency } from '@/utils/calculations';

interface VendorOrder {
  id: string;
  productName: string;
  quantity: number;
  finalPrice: number;
  vendorPayout: number;
  sellerCommission: number;
  platformCommission: number;
  order_status: string;
  commission_status: string;
  createdAt: string;
}

type FilterStatus = 'all' | 'pending' | 'confirmed' | 'delivered' | 'cancelled';
type TimeRange = 'week' | 'month' | 'year' | 'all';

export default function VendorSalesPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [orders, setOrders] = useState<VendorOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [timeRange, setTimeRange] = useState<TimeRange>('all');
  const [monthlyData, setMonthlyData] = useState<{ month: string; earnings: number }[]>([]);

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
        raw.map((o) => ({
          id: o.id,
          productName: o.product_name ?? o.productName ?? 'Product',
          quantity: o.quantity ?? 1,
          finalPrice: o.final_price ?? o.finalPrice ?? 0,
          vendorPayout: o.vendor_payout ?? o.vendorPayout ?? 0,
          sellerCommission: o.seller_commission ?? o.sellerCommission ?? 0,
          platformCommission: o.platform_commission ?? o.platformCommission ?? 0,
          order_status: o.order_status ?? o.status ?? 'pending',
          commission_status: o.commission_status ?? 'pending',
          createdAt: o.created_at ?? o.createdAt ?? '',
        }))
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
    totalEarnings: orders.reduce((s, o) => s + o.vendorPayout, 0),
    delivered: orders.filter((o) => o.order_status === 'delivered').length,
    pending: orders.filter((o) => o.order_status === 'pending' || o.order_status === 'confirmed').length,
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-amber-50 text-amber-700',
    confirmed: 'bg-blue-50 text-blue-700',
    shipped: 'bg-purple-50 text-purple-700',
    delivered: 'bg-green-50 text-green-700',
    cancelled: 'bg-red-50 text-red-700',
  };

  const commissionColors: Record<string, string> = {
    pending: 'text-amber-600',
    available: 'text-green-600',
    paid: 'text-gray-400',
  };

  const exportCSV = () => {
    const csv = [
      ['Product', 'Qty', 'Customer Price', 'Your Payout', 'Status', 'Date'].join(','),
      ...filtered.map((o) =>
        [
          `"${o.productName}"`,
          o.quantity,
          o.finalPrice,
          o.vendorPayout,
          o.order_status,
          new Date(o.createdAt).toLocaleDateString(),
        ].join(',')
      ),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'sales.csv';
    a.click();
  };

  if (isLoading) return null;
  if (!user || user.role !== 'vendor') return null;

  return (
    <div className="px-6 py-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Sales &amp; Earnings</h1>
        <p className="text-sm text-gray-500 mt-1">All orders and earnings in one place</p>
      </div>

      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg mb-5">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <ShoppingBag className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-xs text-gray-500">Total Orders</span>
          </div>
          <p className="text-2xl font-semibold text-gray-900 tabular-nums">{stats.totalOrders}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-xs text-gray-500">Earnings</span>
          </div>
          <p className="text-2xl font-semibold text-gray-900 tabular-nums">{formatCurrency(stats.totalEarnings)}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-xs text-gray-500">Completed</span>
          </div>
          <p className="text-2xl font-semibold text-gray-900 tabular-nums">{stats.delivered}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-xs text-gray-500">In Progress</span>
          </div>
          <p className="text-2xl font-semibold text-gray-900 tabular-nums">{stats.pending}</p>
        </div>
      </div>

      {/* Monthly Earnings Chart */}
      {monthlyData.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-5 mb-5">
          <div className="flex items-center gap-2 mb-5">
            <BarChart3 className="w-4 h-4 text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-800">Monthly Earnings</h2>
          </div>
          <div className="flex items-end gap-3 h-32">
            {monthlyData.map((pt) => {
              const max = Math.max(...monthlyData.map((p) => p.earnings), 1);
              const pct = Math.max((pt.earnings / max) * 100, 4);
              return (
                <div key={pt.month} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs text-gray-500 font-medium">{formatCurrency(pt.earnings)}</span>
                  <div className="w-full bg-primary-100 rounded-t-md" style={{ height: `${pct}%` }}>
                    <div className="w-full h-full bg-primary-500 rounded-t-md opacity-80" />
                  </div>
                  <span className="text-xs text-gray-500">{pt.month}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-3.5 mb-5 flex flex-wrap items-center gap-2">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value as TimeRange)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="week">Last 7 days</option>
          <option value="month">Last 30 days</option>
          <option value="year">Last year</option>
          <option value="all">All time</option>
        </select>

        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-gray-400">{filtered.length} orders</span>
          <button
            onClick={exportCSV}
            disabled={filtered.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-40"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Orders table */}
      {loading ? (
        <div className="flex items-center justify-center min-h-48">
          <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 py-16 text-center">
          <TrendingUp className="w-8 h-8 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400">No orders found</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase">
                    Product
                  </th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold text-gray-600 uppercase">
                    Qty
                  </th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold text-gray-600 uppercase">
                    Price
                  </th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold text-gray-600 uppercase">
                    Your Payout
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase">
                    Status
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-gray-900">{order.productName}</td>
                    <td className="px-5 py-3.5 text-right text-gray-600">{order.quantity}</td>
                    <td className="px-5 py-3.5 text-right text-gray-600">
                      {formatCurrency(order.finalPrice)}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span
                        className={`font-bold ${
                          commissionColors[order.commission_status] ?? 'text-gray-700'
                        }`}
                      >
                        {formatCurrency(order.vendorPayout)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                          statusColors[order.order_status] ?? 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {order.order_status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-400">
                      {new Date(order.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer summary */}
          <div className="border-t border-gray-100 bg-gray-50 px-5 py-3 flex flex-wrap items-center gap-6 text-sm">
            <span className="text-gray-500">
              {filtered.length} orders �{' '}
              <span className="font-semibold text-gray-700">
                {formatCurrency(filtered.reduce((s, o) => s + o.vendorPayout, 0))}
              </span>{' '}
              earned
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
