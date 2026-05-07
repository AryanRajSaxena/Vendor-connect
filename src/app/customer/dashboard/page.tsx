'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, Package, CheckCircle, Clock, AlertCircle, ShoppingBag, Star, Download } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency, getImageUrl } from '@/utils/calculations';

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
  product_image?: string;
  product_images?: string[];
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
        return 'bg-emerald-500/15 text-emerald-300 border border-emerald-400/30';
      case 'shipped':
        return 'bg-sky-500/15 text-sky-300 border border-sky-400/30';
      case 'pending':
        return 'bg-amber-500/15 text-amber-300 border border-amber-400/30';
      case 'cancelled':
        return 'bg-red-500/15 text-red-300 border border-red-400/30';
      default:
        return 'bg-slate-700/30 text-slate-300 border border-slate-600/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
        return <CheckCircle className="w-5 h-5 text-emerald-400" />;
      case 'shipped':
        return <Package className="w-5 h-5 text-sky-400" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-amber-400" />;
      case 'cancelled':
        return <AlertCircle className="w-5 h-5 text-red-400" />;
      default:
        return <Package className="w-5 h-5 text-slate-400" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 flex items-center justify-center">
        <p className="text-slate-400">Loading...</p>
      </div>
    );
  }

  if (!user || user.role !== 'customer') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-100 mb-2">Learning Dashboard</h1>
          <p className="text-slate-400 text-lg">Continue your learning journey</p>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-500/10 border border-red-400/30 text-red-300 p-4 rounded-xl mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Orders Section - Udemy Style */}
        <div>
          <h2 className="text-2xl font-bold text-slate-100 mb-6">My Learning</h2>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin mb-4">
                <Package className="w-8 h-8 text-emerald-500" />
              </div>
              <p className="text-slate-400">Loading your courses...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-slate-900/80 rounded-xl border border-slate-700/80 p-12 text-center">
              <ShoppingBag className="w-16 h-16 text-slate-700 mx-auto mb-4" />
              <p className="text-slate-300 font-semibold mb-2 text-lg">No courses purchased yet</p>
              <p className="text-sm text-slate-400 mb-6">Explore our collection and start learning</p>
              <Link 
                href="/products" 
                className="inline-block px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg transition-colors"
              >
                Explore Courses
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {orders.map((order) => {
                const courseImage = getImageUrl(order.product_images?.[0] || order.product_image);
                return (
                  <div
                    key={order.id}
                    className="bg-slate-900/80 rounded-xl border border-slate-700/80 overflow-hidden hover:border-emerald-400/50 hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-300 flex flex-col group"
                  >
                    {/* Course Thumbnail */}
                    <div className="relative h-40 bg-gradient-to-br from-slate-800 to-slate-900 overflow-hidden">
                      {courseImage ? (
                        <img
                          src={courseImage}
                          alt={order.product_name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="text-center">
                            <Package className="w-10 h-10 text-slate-700 mx-auto mb-2" />
                            <p className="text-xs text-slate-600">No image</p>
                          </div>
                        </div>
                      )}
                      {/* Status Badge */}
                      <div className="absolute top-3 right-3">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${getStatusBadge(
                            order.status
                          )}`}
                        >
                          {getStatusIcon(order.status)}
                          {order.status ? order.status.charAt(0).toUpperCase() + order.status.slice(1).toLowerCase() : 'Unknown'}
                        </span>
                      </div>
                    </div>

                    {/* Course Content */}
                    <div className="flex flex-col flex-1 p-4">
                      {/* Course Title */}
                      <h3 className="text-base font-bold text-slate-100 line-clamp-2 mb-2 group-hover:text-emerald-400 transition-colors">
                        {order.product_name || 'Course'}
                      </h3>

                      {/* Course Meta */}
                      <div className="mb-3 pb-3 border-b border-slate-700/50">
                        <p className="text-xs text-slate-500">
                          Purchased on {new Date(order.created_at).toLocaleDateString('en-IN', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                      </div>

                      {/* Course Stats - placeholder for future rating/progress */}
                      <div className="flex items-center gap-2 mb-4">
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className="w-3 h-3 text-slate-700 fill-slate-700"
                            />
                          ))}
                        </div>
                        <span className="text-xs text-slate-500">No rating yet</span>
                      </div>

                      {/* Price & Duration */}
                      <div className="mb-4 flex items-center justify-between">
                        <span className="text-base font-bold text-slate-100">
                          {formatCurrency(order.base_price)}
                        </span>
                        <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded border border-emerald-500/30">
                          Lifetime access
                        </span>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 mt-auto">
                        <Link
                          href={`/products/${order.product_id}`}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2 rounded-lg transition-colors text-center text-sm"
                        >
                          View Course
                        </Link>
                        <button className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 rounded-lg transition-colors">
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Links */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            href="/products"
            className="bg-gradient-to-br from-emerald-600/20 to-emerald-900/20 rounded-xl p-6 border border-emerald-500/30 hover:border-emerald-400/60 hover:bg-emerald-600/30 transition group"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-slate-100 mb-1 text-lg">Explore More Courses</h3>
                <p className="text-sm text-slate-400">Expand your skills</p>
              </div>
              <ChevronRight className="w-5 h-5 text-emerald-400 group-hover:translate-x-1 transition" />
            </div>
          </Link>

          <Link
            href="/customer/settings"
            className="bg-gradient-to-br from-sky-600/20 to-sky-900/20 rounded-xl p-6 border border-sky-500/30 hover:border-sky-400/60 hover:bg-sky-600/30 transition group"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-slate-100 mb-1 text-lg">Account Settings</h3>
                <p className="text-sm text-slate-400">Manage your profile</p>
              </div>
              <ChevronRight className="w-5 h-5 text-sky-400 group-hover:translate-x-1 transition" />
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
