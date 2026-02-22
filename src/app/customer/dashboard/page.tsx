'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, Package, CheckCircle, Clock, AlertCircle, ShoppingBag } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency } from '@/utils/calculations';

interface Order {
  id: string;
  status: string;
  final_price: number;
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

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'shipped':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'shipped':
        return <Package className="w-5 h-5 text-blue-600" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'cancelled':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Package className="w-5 h-5 text-gray-600" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!user || user.role !== 'customer') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Orders</h1>
          <p className="text-gray-600">Track and manage your purchases</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium mb-1">Total Orders</p>
                <p className="text-3xl font-bold text-gray-900">{orders.length}</p>
              </div>
              <ShoppingBag className="w-8 h-8 text-primary opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium mb-1">Total Spent</p>
                <p className="text-3xl font-bold text-gray-900">
                  {formatCurrency(orders.reduce((sum, o) => sum + o.final_price, 0))}
                </p>
              </div>
              <ShoppingBag className="w-8 h-8 text-green-600 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium mb-1">Completed</p>
                <p className="text-3xl font-bold text-gray-900">
                  {orders.filter((o) => o.status?.toLowerCase() === 'delivered').length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium mb-1">In Transit</p>
                <p className="text-3xl font-bold text-gray-900">
                  {orders.filter((o) => o.status?.toLowerCase() === 'shipped' || o.status?.toLowerCase() === 'pending').length}
                </p>
              </div>
              <Package className="w-8 h-8 text-blue-600 opacity-20" />
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Orders Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Order History</h2>

          {loading ? (
            <p className="text-gray-500 text-center py-8">Loading orders...</p>
          ) : orders.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 font-medium mb-2">No orders yet</p>
              <p className="text-sm text-gray-500 mb-6">Start shopping to see your orders here</p>
              <Link href="/products" className="btn btn-primary">
                Browse Products
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <p className="font-semibold text-gray-900 flex items-center gap-2">
                          {getStatusIcon(order.status)}
                          Order {order.id}
                        </p>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(
                            order.status
                          )}`}
                        >
                          {order.status?.charAt(0).toUpperCase() + order.status?.slice(1).toLowerCase()}
                        </span>
                      </div>

                      <p className="text-sm text-gray-600 mb-2">
                        {order.product_name || 'Product'} • Quantity: {order.quantity}
                      </p>

                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>
                          {new Date(order.created_at).toLocaleDateString('en-IN', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                        <span className="font-semibold text-lg text-gray-900">
                          {formatCurrency(order.final_price)}
                        </span>
                      </div>
                    </div>

                    <button className="p-2 hover:bg-gray-200 rounded-lg transition-colors">
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <Link
            href="/products"
            className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-lg transition group"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Continue Shopping</h3>
                <p className="text-sm text-gray-600">Browse more products</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-primary transition" />
            </div>
          </Link>

          <Link
            href="/customer/settings"
            className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-lg transition group"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Account Settings</h3>
                <p className="text-sm text-gray-600">Manage your profile</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-primary transition" />
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
