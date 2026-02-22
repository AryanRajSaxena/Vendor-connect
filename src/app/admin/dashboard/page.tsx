'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Settings, Users, ShoppingCart, TrendingUp, AlertCircle, DollarSign } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency } from '@/utils/calculations';

interface AdminStats {
  totalUsers: number;
  totalVendors: number;
  totalSellers: number;
  totalOrders: number;
  totalRevenue: number;
  pendingWithdrawals: number;
  pendingWithdrawalAmount: number;
}

interface RecentOrder {
  id: string;
  orderNumber: string;
  customerId: string;
  vendorId: string;
  sellerId: string;
  amount: number;
  status: string;
  createdAt: string;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalVendors: 0,
    totalSellers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingWithdrawals: 0,
    pendingWithdrawalAmount: 0,
  });

  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && user?.role !== 'admin') {
      router.push('/');
      return;
    }

    if (user?.id) {
      fetchDashboardData();
    }
  }, [user, isLoading, router]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch admin dashboard data
      // In a real app, you'd have a dedicated /api/admin/dashboard endpoint
      const [ordersRes, usersRes] = await Promise.all([
        fetch('/api/orders'),
        fetch('/api/auth/users'), // Mock endpoint
      ]);

      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        const orders = Array.isArray(ordersData) ? ordersData : ordersData.orders || [];

        const totalRevenue = orders.reduce((sum: number, o: RecentOrder) => sum + o.amount, 0);
        const totalOrders = orders.length;

        setStats((prev) => ({
          ...prev,
          totalOrders,
          totalRevenue,
        }));

        setRecentOrders(orders.slice(0, 10));
      }

      // Note: For MVP, these numbers are mocked
      // In production, you'd fetch from /api/admin/stats
      setStats((prev) => ({
        ...prev,
        totalUsers: 24,
        totalVendors: 8,
        totalSellers: 12,
        pendingWithdrawals: 3,
        pendingWithdrawalAmount: 15000,
      }));
    } catch (err) {
      setError((err as Error).message);
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'shipped':
        return 'bg-blue-100 text-blue-800';
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

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Unauthorized access</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600">Platform overview and management</p>
          </div>
          <Link href="/admin/settings" className="btn btn-outline flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Settings
          </Link>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-white rounded-lg p-4 flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-600 uppercase">Total Users</p>
              <p className="text-xl font-bold text-gray-900">{stats.totalUsers}</p>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 flex items-start gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-600 uppercase">Vendors</p>
              <p className="text-xl font-bold text-gray-900">{stats.totalVendors}</p>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 flex items-start gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <ShoppingCart className="w-5 h-5 text-purple-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-600 uppercase">Sellers</p>
              <p className="text-xl font-bold text-gray-900">{stats.totalSellers}</p>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 flex items-start gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <ShoppingCart className="w-5 h-5 text-yellow-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-600 uppercase">Orders</p>
              <p className="text-xl font-bold text-gray-900">{stats.totalOrders}</p>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 flex items-start gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-600 uppercase">Revenue</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</p>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 flex items-start gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <AlertCircle className="w-5 h-5 text-orange-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-600 uppercase">Pending</p>
              <p className="text-xl font-bold text-gray-900">{stats.pendingWithdrawals}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Orders */}
          <div className="lg:col-span-2 bg-white rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Recent Orders</h2>
              <Link href="/admin/orders" className="text-primary hover:underline text-sm">
                View all →
              </Link>
            </div>

            {loading ? (
              <p className="text-gray-500 text-center py-8">Loading orders...</p>
            ) : recentOrders.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No orders yet</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {recentOrders.map((order) => (
                  <div key={order.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{order.orderNumber}</p>
                        <div className="flex gap-4 mt-2 text-sm text-gray-600">
                          <span>Amount: {formatCurrency(order.amount)}</span>
                          <span>Items: 1</span>
                        </div>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {order.status?.charAt(0).toUpperCase() + order.status?.slice(1) || 'Pending'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-6">
              <h3 className="font-bold text-gray-900 mb-4">Management</h3>
              <div className="space-y-3">
                <Link href="/admin/orders" className="block p-3 border border-gray-300 text-gray-900 rounded-lg hover:bg-gray-50 transition-colors font-semibold text-center">
                  Manage Orders
                </Link>
                <Link
                  href="/admin/withdrawals"
                  className="block p-3 border border-primary text-primary rounded-lg hover:bg-blue-50 transition-colors font-semibold text-center"
                >
                  Approve Withdrawals
                </Link>
                <Link href="/admin/users" className="block p-3 border border-gray-300 text-gray-900 rounded-lg hover:bg-gray-50 transition-colors font-semibold text-center">
                  Manage Users
                </Link>
                <Link
                  href="/admin/settings"
                  className="block p-3 border border-gray-300 text-gray-900 rounded-lg hover:bg-gray-50 transition-colors font-semibold text-center"
                >
                  Configure Settings
                </Link>
              </div>
            </div>

            {/* Pending Withdrawals Alert */}
            {stats.pendingWithdrawals > 0 && (
              <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-6">
                <h3 className="font-bold text-gray-900 mb-2">⚠️ Pending Approvals</h3>
                <p className="text-sm text-gray-700 mb-4">
                  {stats.pendingWithdrawals} withdrawal request{stats.pendingWithdrawals !== 1 ? 's' : ''} awaiting approval
                </p>
                <p className="text-lg font-bold text-orange-600 mb-4">
                  Total: {formatCurrency(stats.pendingWithdrawalAmount)}
                </p>
                <Link href="/admin/withdrawals" className="btn btn-outline w-full text-center">
                  Review Now
                </Link>
              </div>
            )}

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="font-bold text-gray-900 mb-2">💡 Platform Health</h3>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>✓ Commission model: 25% markup</li>
                <li>✓ Seller commission: 10%</li>
                <li>✓ Platform takes 15%</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
