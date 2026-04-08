'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ShoppingBag,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import {
  Card,
  OrderCard,
  EmptyState,
} from '@/components/customer';

interface Order {
  id: string;
  status: string;
  base_price: number;
  created_at: string;
  product_id?: string;
  product_name?: string;
  quantity: number;
  order_status?: string;
  payment_status?: string;
}

export default function CustomerDashboard() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && user?.role !== 'customer') {
      router.push('/');
      return;
    }

    if (user?.id) {
      fetchOrders();
    }
  }, [user, isLoading, router]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/orders?customerId=${user?.id}`);
      if (!response.ok) throw new Error('Failed to fetch orders');

      const data = await response.json();
      const ordersList = Array.isArray(data) ? data : data.orders || [];
      setOrders(ordersList);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const recentOrders = orders.slice(0, 5);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-920 to-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-3 border-primary-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-300">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'customer') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-920 to-gray-950">
      {/* Mobile Hero Section */}
      <div className="bg-gradient-to-r from-primary-900/40 to-secondary-900/40 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-white">
              Welcome, {user.name}! 👋
            </h1>
            <p className="text-gray-400">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Error Alert */}
        {error && (
          <Card className="bg-red-900/20 border border-red-800">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <div>
                <p className="font-semibold text-red-300">Error</p>
                <p className="text-sm text-red-200">{error}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Recent Orders Section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                My Orders
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                Your latest purchases with status and amount
              </p>
            </div>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <div className="h-24 bg-gray-800 rounded" />
                </Card>
              ))}
            </div>
          ) : recentOrders.length > 0 ? (
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  productName={order.product_name || 'Product'}
                  status={order.status || 'pending'}
                  amount={order.base_price}
                  date={order.created_at}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<ShoppingBag className="w-16 h-16" />}
              title="No Orders Yet"
              description="Start exploring courses and products to make your first purchase"
              action={{
                label: 'Browse Products',
                onClick: () => router.push('/products'),
              }}
            />
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 sm:grid-cols-2 gap-4">
          <Link
            href="/products"
            className="p-4 bg-gradient-to-br from-primary-900/30 to-primary-900/10 border border-primary-800/50 rounded-lg hover:border-primary-700 transition-all"
          >
            <div className="text-2xl mb-2">🛍️</div>
            <p className="text-sm font-medium text-white">Browse</p>
          </Link>
          <Link
            href="/customer/settings"
            className="p-4 bg-gradient-to-br from-gray-800/50 to-gray-800/20 border border-gray-700/50 rounded-lg hover:border-gray-600 transition-all"
          >
            <div className="text-2xl mb-2">⚙️</div>
            <p className="text-sm font-medium text-white">Settings</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
