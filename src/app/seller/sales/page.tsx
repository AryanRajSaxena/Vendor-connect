'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShoppingBag,
  DollarSign,
  CheckCircle,
  TrendingUp,
  AlertCircle,
  FileText,
  Clock,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency } from '@/utils/calculations';

interface SalesOrder {
  id: string;
  orderNumber: string;
  productName: string;
  quantity: number;
  finalPrice: number;
  sellerCommission: number;
  status: string;
  commissionStatus: string;
  paymentStatus: string;
  createdAt: string;
}

type FilterStatus = 'all' | 'pending' | 'available' | 'paid';

export default function SellerSalesPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'earnings'>('recent');
  const [totals, setTotals] = useState({ totalEarned: 0, totalPaid: 0, processing: 0 });

  useEffect(() => {
    if (!isLoading && user?.role !== 'seller') router.push('/');
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user?.id) fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const ordersRes = await fetch(`/api/orders?sellerId=${user!.id}`);

      let totalEarned = 0;

      let orderList: SalesOrder[] = [];
      let totalPaid = 0;
      let processing = 0;

      if (ordersRes.ok) {
        const raw = await ordersRes.json();
        const list: any[] = Array.isArray(raw) ? raw : raw.orders || [];
        orderList = list.map((o) => ({
          id: o.id,
          orderNumber: o.order_number || o.orderNumber || o.id,
          productName: o.product?.name || o.product_name || '—',
          quantity: o.quantity || 1,
          finalPrice: o.final_price || o.finalPrice || 0,
          sellerCommission: o.seller_commission || o.sellerCommission || 0,
          status: o.order_status || o.status || 'pending',
          commissionStatus: o.commission_status || o.commissionStatus || 'pending',
          paymentStatus: o.payment_status || o.paymentStatus || 'pending',
          createdAt: o.created_at || o.createdAt || '',
        }));
        list.forEach((o) => {
          const commission = o.seller_commission || o.sellerCommission || 0;
          const commissionStatus = (o.commission_status || o.commissionStatus || 'pending').toLowerCase();
          if (commissionStatus === 'paid' || commissionStatus === 'available') totalPaid += commission;
          else if (commissionStatus === 'pending') processing += commission;
        });
        totalEarned = list.reduce(
          (sum, o) => sum + Number(o.seller_commission || o.sellerCommission || 0),
          0
        );
      }

      setOrders(orderList);
      setTotals({ totalEarned, totalPaid, processing });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders
    .filter((o) => filterStatus === 'all' || o.commissionStatus.toLowerCase() === filterStatus)
    .sort((a, b) =>
      sortBy === 'earnings'
        ? b.sellerCommission - a.sellerCommission
        : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

  const stats = {
    total: orders.length,
    completed: orders.filter((o) => ['available', 'paid'].includes(o.commissionStatus.toLowerCase())).length,
    pending: orders.filter((o) => o.commissionStatus.toLowerCase() === 'pending').length,
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      available: 'bg-blue-100 text-blue-700',
      paid: 'bg-green-100 text-green-700',
      pending: 'bg-orange-100 text-orange-700',
    };
    return map[status.toLowerCase()] || 'bg-gray-100 text-gray-700';
  };

  const exportCSV = () => {
    const rows = [
      ['Product', 'Qty', 'Price', 'Commission', 'Status', 'Date'],
      ...filteredOrders.map((o) => [
        o.productName,
        o.quantity,
        o.finalPrice,
        o.sellerCommission,
        o.commissionStatus,
        new Date(o.createdAt).toLocaleDateString(),
      ]),
    ];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = 'sales.csv';
    a.click();
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
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Commission History</h1>
        <p className="text-sm text-gray-500 mt-0.5">All commission transactions from your referred orders</p>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg mb-5 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* KPI cards — Orders */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <ShoppingBag className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-xs text-gray-500">Total Orders</span>
          </div>
          <p className="text-2xl font-semibold tabular-nums text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-xs text-gray-500">Commission Ready</span>
          </div>
          <p className="text-2xl font-semibold tabular-nums text-gray-900">{stats.completed}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-xs text-gray-500">In Progress</span>
          </div>
          <p className="text-2xl font-semibold tabular-nums text-gray-900">{stats.pending}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-xs text-gray-500">Total Commissions</span>
          </div>
          <p className="text-2xl font-semibold tabular-nums text-gray-900">
            {formatCurrency(totals.totalEarned)}
          </p>
          <p className="text-[10px] text-gray-400 mt-1">10% of all sales</p>
        </div>
      </div>

      {/* KPI cards — Earnings breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
        <div className="bg-white rounded-lg border border-gray-200 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-sm text-gray-600">Processing</span>
            <span className="text-[10px] text-gray-400">· from pending orders</span>
          </div>
          <span className="text-sm font-semibold tabular-nums text-gray-900">
            {formatCurrency(totals.processing)}
          </span>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-sm text-gray-600">Ready/Paid</span>
            <span className="text-[10px] text-gray-400">· automatically processed</span>
          </div>
          <span className="text-sm font-semibold tabular-nums text-gray-900">
            {formatCurrency(totals.totalPaid)}
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-3.5 mb-5 flex flex-wrap items-center gap-2">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 text-gray-700"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="available">Available</option>
          <option value="paid">Paid</option>
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'recent' | 'earnings')}
          className="px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 text-gray-700"
        >
          <option value="recent">Most Recent</option>
          <option value="earnings">Highest Commission</option>
        </select>
        <span className="ml-auto text-xs text-gray-400">
          {filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''}
        </span>
        {orders.length > 0 && (
          <button
            onClick={exportCSV}
            className="text-xs text-gray-500 hover:text-gray-900 transition-colors border border-gray-200 px-3 py-2 rounded-md"
          >
            Export CSV
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16 bg-white rounded-lg border border-gray-200">
          <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 py-16 text-center">
          <FileText className="w-8 h-8 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400">No commission transactions found</p>
          <p className="text-xs text-gray-400 mt-1">Share your referral links and complete sales to see entries</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="max-h-[520px] overflow-y-auto overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Product</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Price</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Commission</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Payment</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-900 max-w-[200px] truncate">{order.productName}</td>
                    <td className="px-4 py-3 text-right text-gray-900 tabular-nums">
                      {formatCurrency(order.finalPrice)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums text-gray-900">
                      {formatCurrency(order.sellerCommission)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        order.paymentStatus.toLowerCase() === 'completed'
                          ? 'bg-green-100 text-green-700'
                          : order.paymentStatus.toLowerCase() === 'failed'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
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
        </div>
      )}
    </div>
  );
}