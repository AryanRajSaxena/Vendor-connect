'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, FileText } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency } from '@/utils/calculations';

interface SalesOrder {
  id: string;
  orderNumber: string;
  productName: string;
  customerId: string;
  quantity: number;
  basePrice: number;
  finalPrice: number;
  sellerCommission: number;
  status: string;
  createdAt: string;
}

type FilterStatus = 'all' | 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export default function SellerSalesPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'earnings'>('recent');
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('month');

  useEffect(() => {
    if (!isLoading && user?.role !== 'seller') {
      router.push('/');
      return;
    }

    if (user?.id) {
      fetchSalesData();
    }
  }, [user, isLoading, router]);

  const fetchSalesData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Note: This would need a dedicated /api/seller/sales endpoint
      // For now, we'll fetch all orders and filter by seller
      const response = await fetch(`/api/orders?sellerId=${user?.id}`);
      if (!response.ok) throw new Error('Failed to fetch sales data');

      const data = await response.json();
      const rawOrders = Array.isArray(data) ? data : data.orders || [];
      
      // Transform snake_case API response to camelCase
      const transformedOrders = rawOrders.map((o: any) => ({
        id: o.id,
        orderNumber: o.order_number,
        productName: o.product_name,
        customerId: o.customer_id,
        quantity: o.quantity || 0,
        basePrice: o.base_price || 0,
        finalPrice: o.final_price || 0,
        sellerCommission: o.seller_commission || 0,
        status: o.status,
        createdAt: o.created_at,
      }));
      setOrders(transformedOrders);
    } catch (err) {
      setError((err as Error).message);
      console.error('Failed to fetch sales data:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSorted = orders
    .filter((o) => filterStatus === 'all' || o.status.toLowerCase() === filterStatus)
    .sort((a, b) => {
      if (sortBy === 'earnings') return b.sellerCommission - a.sellerCommission;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const stats = {
    totalOrders: orders.length,
    totalEarnings: orders.reduce((sum, o) => sum + o.sellerCommission, 0),
    completedOrders: orders.filter((o) => o.status === 'delivered').length,
    pendingOrders: orders.filter((o) => o.status === 'pending' || o.status === 'processing').length,
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'shipped':
        return 'bg-blue-100 text-blue-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'pending':
        return 'bg-orange-100 text-orange-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!user || user.role !== 'seller') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/seller/dashboard" className="text-primary hover:underline mb-2 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Sales History</h1>
          <p className="text-gray-600">Track your orders and earnings</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg p-4">
            <p className="text-sm text-gray-600">Total Orders</p>
            <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <p className="text-sm text-gray-600">Completed</p>
            <p className="text-2xl font-bold text-green-600">{stats.completedOrders}</p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <p className="text-sm text-gray-600">Pending</p>
            <p className="text-2xl font-bold text-orange-600">{stats.pendingOrders}</p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <p className="text-sm text-gray-600">Total Earnings</p>
            <p className="text-2xl font-bold text-purple-600">{formatCurrency(stats.totalEarnings)}</p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg p-4 mb-6 flex gap-4 items-center flex-wrap">
          <div>
            <label className="text-sm font-semibold text-gray-700 mr-2">Status:</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Orders</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 mr-2">Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="recent">Most Recent</option>
              <option value="earnings">Highest Earnings</option>
            </select>
          </div>

          <div className="ml-auto text-sm text-gray-600">
            {filteredAndSorted.length} order{filteredAndSorted.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Orders Table */}
        {loading ? (
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-gray-500">Loading orders...</p>
          </div>
        ) : filteredAndSorted.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No sales orders yet</p>
            <p className="text-sm text-gray-500">Add products to your store to start earning</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Order ID</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Product</th>
                    <th className="px-6 py-3 text-right font-semibold text-gray-700">Quantity</th>
                    <th className="px-6 py-3 text-right font-semibold text-gray-700">Unit Price</th>
                    <th className="px-6 py-3 text-right font-semibold text-gray-700">Your Commission (10%)</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Status</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSorted.map((order) => (
                    <tr key={order.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-semibold text-gray-900">{order.orderNumber}</td>
                      <td className="px-6 py-4 text-gray-700 max-w-xs truncate">{order.productName}</td>
                      <td className="px-6 py-4 text-right text-gray-700">{order.quantity}</td>
                      <td className="px-6 py-4 text-right">
                        <div>
                          <p className="font-semibold text-gray-900">{formatCurrency(order.finalPrice)}</p>
                          <p className="text-xs text-gray-500">final</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="font-bold text-green-600">{formatCurrency(order.sellerCommission)}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold inline-block ${getStatusColor(order.status)}`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600 text-xs">
                        {new Date(order.createdAt).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Export Button */}
        {orders.length > 0 && (
          <div className="mt-6 flex justify-center">
            <button
              onClick={() => {
                const csv = [
                  ['Order ID', 'Product', 'Quantity', 'Unit Price', 'Your Commission', 'Status', 'Date'].join(','),
                  ...filteredAndSorted.map((o) =>
                    [
                      o.orderNumber,
                      o.productName,
                      o.quantity,
                      o.finalPrice,
                      o.sellerCommission,
                      o.status,
                      new Date(o.createdAt).toLocaleDateString(),
                    ].join(',')
                  ),
                ].join('\n');

                const blob = new Blob([csv], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'sales-history.csv';
                a.click();
              }}
              className="text-primary hover:underline text-sm font-semibold"
            >
              📥 Export as CSV
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
