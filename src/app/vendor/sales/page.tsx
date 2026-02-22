'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, Download, Filter, TrendingUp, Calendar as CalendarIcon } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency } from '@/utils/calculations';

interface VendorOrder {
  id: string;
  orderNumber: string;
  productId: string;
  productName: string;
  sellerId: string;
  customerName?: string;
  quantity: number;
  finalPrice: number;
  vendorPayout: number;
  sellerCommission: number;
  platformCommission: number;
  status: string;
  paymentMethod?: string;
  createdAt: string;
  updatedAt: string;
}

type FilterStatus = 'all' | 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
type TimeRange = 'week' | 'month' | 'year' | 'all';

export default function VendorSalesPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [orders, setOrders] = useState<VendorOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [timeRange, setTimeRange] = useState<TimeRange>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'earnings' | 'quantity'>('recent');

  useEffect(() => {
    if (!isLoading && user?.role !== 'vendor') {
      router.push('/');
      return;
    }

    if (user?.id) {
      fetchVendorOrders();
    }
  }, [user, isLoading, router]);

  const fetchVendorOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/orders?vendorId=${user?.id}`);
      if (!response.ok) throw new Error('Failed to fetch orders');

      const data = await response.json();
      const ordersArray = Array.isArray(data) ? data : data.orders || [];
      setOrders(ordersArray);
    } catch (err) {
      setError((err as Error).message);
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSorted = orders
    .filter((o) => {
      // Filter by status
      if (filterStatus !== 'all' && o.status !== filterStatus) return false;

      // Filter by time range
      if (timeRange !== 'all') {
        const orderDate = new Date(o.createdAt);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - orderDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (timeRange === 'week' && diffDays > 7) return false;
        if (timeRange === 'month' && diffDays > 30) return false;
        if (timeRange === 'year' && diffDays > 365) return false;
      }

      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'earnings') return b.vendorPayout - a.vendorPayout;
      if (sortBy === 'quantity') return b.quantity - a.quantity;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const stats = {
    totalOrders: orders.length,
    totalEarnings: orders.reduce((sum, o) => sum + o.vendorPayout, 0),
    totalRevenue: orders.reduce((sum, o) => sum + o.finalPrice * o.quantity, 0),
    totalQuantity: orders.reduce((sum, o) => sum + o.quantity, 0),
    deliveredOrders: orders.filter((o) => o.status === 'delivered').length,
    pendingOrders: orders.filter((o) => o.status === 'pending' || o.status === 'confirmed').length,
    cancelledOrders: orders.filter((o) => o.status === 'cancelled').length,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'shipped':
        return 'bg-blue-100 text-blue-800';
      case 'confirmed':
        return 'bg-purple-100 text-purple-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return '✓';
      case 'shipped':
        return '📦';
      case 'confirmed':
        return '✓';
      case 'pending':
        return '⏳';
      case 'cancelled':
        return '✕';
      default:
        return '?';
    }
  };

  const exportAsCSV = () => {
    const csv = [
      ['Order ID', 'Product', 'Quantity', 'Customer Price', 'Your Payout', 'Status', 'Date'].join(','),
      ...filteredAndSorted.map((o) =>
        [
          o.orderNumber,
          o.productName,
          o.quantity,
          o.finalPrice,
          o.vendorPayout,
          o.status,
          new Date(o.createdAt).toLocaleDateString(),
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sales-report.csv';
    a.click();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!user || user.role !== 'vendor') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/vendor/dashboard" className="text-primary hover:underline mb-2 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Sales History</h1>
          <p className="text-gray-600">Track all your sales, earnings, and order details</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
            <p className="text-xs text-gray-600 font-medium mb-1">TOTAL ORDERS</p>
            <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
            <p className="text-xs text-gray-500 mt-1">all time</p>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
            <p className="text-xs text-gray-600 font-medium mb-1">TOTAL EARNINGS</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalEarnings)}</p>
            <p className="text-xs text-gray-500 mt-1">your payout</p>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
            <p className="text-xs text-gray-600 font-medium mb-1">DELIVERED</p>
            <p className="text-2xl font-bold text-blue-600">{stats.deliveredOrders}</p>
            <p className="text-xs text-gray-500 mt-1">completed orders</p>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
            <p className="text-xs text-gray-600 font-medium mb-1">PENDING</p>
            <p className="text-2xl font-bold text-orange-600">{stats.pendingOrders}</p>
            <p className="text-xs text-gray-500 mt-1">in progress</p>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
            <p className="text-xs text-gray-600 font-medium mb-1">TOTAL QUANTITY</p>
            <p className="text-2xl font-bold text-purple-600">{stats.totalQuantity}</p>
            <p className="text-xs text-gray-500 mt-1">units sold</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg p-4 mb-6 shadow-sm border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">All Orders</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Time Range</label>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as TimeRange)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
                <option value="year">Last Year</option>
                <option value="all">All Time</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="recent">Most Recent</option>
                <option value="earnings">Highest Earnings</option>
                <option value="quantity">Most Quantity</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={exportAsCSV}
                disabled={filteredAndSorted.length === 0}
                className="w-full px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        {loading ? (
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-gray-500">Loading orders...</p>
          </div>
        ) : filteredAndSorted.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-100">
            <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No orders found</p>
            <p className="text-sm text-gray-500">Orders will appear here when your products are sold</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-100">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="px-6 py-4 text-left font-semibold text-gray-700">Order ID</th>
                    <th className="px-6 py-4 text-left font-semibold text-gray-700">Product</th>
                    <th className="px-6 py-4 text-right font-semibold text-gray-700">Qty</th>
                    <th className="px-6 py-4 text-right font-semibold text-gray-700">Customer Price</th>
                    <th className="px-6 py-4 text-right font-semibold text-gray-700">Your Payout</th>
                    <th className="px-6 py-4 text-left font-semibold text-gray-700">Status</th>
                    <th className="px-6 py-4 text-left font-semibold text-gray-700">Date</th>
                    <th className="px-6 py-4 text-center font-semibold text-gray-700">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredAndSorted.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-semibold text-gray-900">{order.orderNumber}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-600">{order.productName}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-semibold text-gray-900">{order.quantity}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-gray-600">{formatCurrency(order.finalPrice)}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-bold text-green-600">{formatCurrency(order.vendorPayout)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                            order.status
                          )}`}
                        >
                          {getStatusIcon(order.status)} {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-xs">
                        {new Date(order.createdAt).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => {
                            alert(
                              `Order Details:\n\nProduct: ${order.productName}\nQuantity: ${order.quantity}\nCustomer Price: ${formatCurrency(order.finalPrice)}\nYour Payout: ${formatCurrency(order.vendorPayout)}\n\nCommission Breakdown:\nSeller Commission: ${formatCurrency(order.sellerCommission)}\nPlatform Commission: ${formatCurrency(order.platformCommission)}`
                            );
                          }}
                          className="text-primary hover:underline font-semibold text-xs"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Summary Footer */}
        {filteredAndSorted.length > 0 && (
          <div className="mt-6 bg-white rounded-lg p-4 border border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-gray-600 font-semibold mb-1">ORDERS IN VIEW</p>
                <p className="text-lg font-bold text-gray-900">{filteredAndSorted.length}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 font-semibold mb-1">TOTAL REVENUE</p>
                <p className="text-lg font-bold text-gray-900">
                  {formatCurrency(filteredAndSorted.reduce((sum, o) => sum + o.finalPrice * o.quantity, 0))}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600 font-semibold mb-1">YOUR EARNINGS</p>
                <p className="text-lg font-bold text-green-600">
                  {formatCurrency(filteredAndSorted.reduce((sum, o) => sum + o.vendorPayout, 0))}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600 font-semibold mb-1">AVG. PAYOUT/ORDER</p>
                <p className="text-lg font-bold text-purple-600">
                  {formatCurrency(
                    filteredAndSorted.reduce((sum, o) => sum + o.vendorPayout, 0) / filteredAndSorted.length
                  )}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
