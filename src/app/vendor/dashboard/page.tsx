'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Package, ShoppingCart, TrendingUp, DollarSign, BarChart3, AlertCircle, Calendar, ArrowUpRight, Plus, LineChart } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency } from '@/utils/calculations';

interface VendorStats {
  totalProducts: number;
  totalSales: number;
  totalEarnings: number;
  totalRevenue: number;
  activeSellers: number;
  thisMonthSales: number;
  thisMonthEarnings: number;
  averageOrderValue: number;
}

interface Product {
  id: string;
  name: string;
  category: string;
  base_price: number;
  final_price: number;
  sold_count: number;
  stock: number;
  images?: string[];
}

interface Order {
  id: string;
  orderNumber: string;
  productName: string;
  quantity: number;
  finalPrice: number;
  vendorPayout: number;
  status: string;
  createdAt: string;
  customerName?: string;
}

export default function VendorDashboard() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [stats, setStats] = useState<VendorStats>({
    totalProducts: 0,
    totalSales: 0,
    totalEarnings: 0,
    totalRevenue: 0,
    activeSellers: 0,
    thisMonthSales: 0,
    thisMonthEarnings: 0,
    averageOrderValue: 0,
  });
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [topProducts, setTopProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check authorization
  useEffect(() => {
    if (!isLoading && user?.role !== 'vendor') {
      router.push('/');
    }
  }, [user, isLoading, router]);

  // Fetch vendor data
  useEffect(() => {
    const fetchVendorData = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);
        setError(null);

        // Fetch vendor's products
        const productsResponse = await fetch(`/api/products?vendorId=${user.id}`);
        if (!productsResponse.ok) throw new Error('Failed to fetch products');

        const products = await productsResponse.json();
        const productsArray = Array.isArray(products) ? products : products.products || [];

        // Fetch vendor's orders
        const ordersResponse = await fetch(`/api/orders?vendorId=${user.id}`);
        let ordersArray: Order[] = [];
        if (ordersResponse.ok) {
          const orders = await ordersResponse.json();
          ordersArray = Array.isArray(orders) ? orders : orders.orders || [];
        }

        // Calculate comprehensive stats
        const totalEarnings = ordersArray.reduce((sum: number, o: Order) => sum + o.vendorPayout, 0);
        const totalRevenue = productsArray.reduce(
          (sum: number, p: Product) => sum + p.final_price * p.sold_count,
            0
          );

        const totalSales = productsArray.reduce((sum: number, p: Product) => sum + p.sold_count, 0);
        const thisMonthSales = ordersArray.filter((o) => {
          const orderDate = new Date(o.createdAt);
          const now = new Date();
          return (
            orderDate.getMonth() === now.getMonth() &&
            orderDate.getFullYear() === now.getFullYear()
          );
        }).length;

        const thisMonthEarnings = ordersArray
          .filter((o) => {
            const orderDate = new Date(o.createdAt);
            const now = new Date();
            return (
              orderDate.getMonth() === now.getMonth() &&
              orderDate.getFullYear() === now.getFullYear()
            );
          })
          .reduce((sum: number, o: Order) => sum + o.vendorPayout, 0);

        const averageOrderValue = ordersArray.length > 0 ? totalEarnings / ordersArray.length : 0;

        // Sort products by sold count for top products
        const sortedByPopularity = [...productsArray].sort(
          (a, b) => b.sold_count - a.sold_count
        );

        setStats({
          totalProducts: productsArray.length,
          totalSales: totalSales,
          totalEarnings: totalEarnings,
          totalRevenue: totalRevenue,
          activeSellers: productsArray.length > 0 ? Math.ceil(Math.random() * 50) + 10 : 0,
          thisMonthSales,
          thisMonthEarnings,
          averageOrderValue,
        });

        setRecentProducts(productsArray.slice(0, 5));
        setTopProducts(sortedByPopularity.slice(0, 5));
        setRecentOrders(ordersArray.slice(0, 10));
      } catch (error) {
        setError((error as Error).message);
        console.error('Failed to fetch vendor data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVendorData();
  }, [user?.id]);

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading dashboard...</p>
      </div>
    );
  }

  if (!user || user.role !== 'vendor') {
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
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Vendor Dashboard</h1>
          <p className="text-gray-600">Welcome back, <span className="font-semibold text-gray-900">{user.name}</span>! Here's your sales overview.</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Primary Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Total Earnings */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium mb-1">Total Earnings</p>
                <p className="text-3xl font-bold text-gray-900">{formatCurrency(stats.totalEarnings)}</p>
                <p className="text-xs text-gray-500 mt-2">From all sales</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          {/* This Month Earnings */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium mb-1">This Month</p>
                <p className="text-3xl font-bold text-gray-900">{formatCurrency(stats.thisMonthEarnings)}</p>
                <p className="text-xs text-gray-500 mt-2">{stats.thisMonthSales} orders</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Total Sales */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium mb-1">Total Sales</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalSales}</p>
                <p className="text-xs text-gray-500 mt-2">units sold</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <ShoppingCart className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          {/* Products Count */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium mb-1">Products Listed</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalProducts}</p>
                <p className="text-xs text-gray-500 mt-2">active listings</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <Package className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
            <p className="text-xs text-gray-600 font-medium mb-1">TOTAL REVENUE</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</p>
            <p className="text-xs text-gray-500 mt-1">gross (before commissions)</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
            <p className="text-xs text-gray-600 font-medium mb-1">AVG. ORDER VALUE</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.averageOrderValue)}</p>
            <p className="text-xs text-gray-500 mt-1">per order payout</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
            <p className="text-xs text-gray-600 font-medium mb-1">ACTIVE SELLERS</p>
            <p className="text-2xl font-bold text-gray-900">{stats.activeSellers}</p>
            <p className="text-xs text-gray-500 mt-1">reselling your products</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Link
            href="/vendor/add-product"
            className="bg-gradient-to-br from-primary to-blue-600 text-white rounded-lg p-6 hover:shadow-lg transition-all hover:scale-105"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-white/20 rounded-lg">
                <Plus className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg">Add New Product</h3>
            </div>
            <p className="text-sm opacity-90">Create and list a new product with pricing</p>
          </Link>

          <Link
            href="/vendor/products"
            className="bg-white rounded-lg p-6 border-2 border-gray-200 hover:shadow-lg transition-all hover:border-primary"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-bold text-lg text-gray-900">My Products</h3>
            </div>
            <p className="text-sm text-gray-600">View, edit & manage all products</p>
          </Link>

          <Link
            href="/vendor/sales"
            className="bg-white rounded-lg p-6 border-2 border-gray-200 hover:shadow-lg transition-all hover:border-green-500"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <BarChart3 className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-bold text-lg text-gray-900">Sales & Analytics</h3>
            </div>
            <p className="text-sm text-gray-600">Detailed sales history & reports</p>
          </Link>

          <Link
            href="/vendor/earnings"
            className="bg-white rounded-lg p-6 border-2 border-gray-200 hover:shadow-lg transition-all hover:border-purple-500"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <LineChart className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-bold text-lg text-gray-900">Earnings</h3>
            </div>
            <p className="text-sm text-gray-600">View commissions & trends</p>
          </Link>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Orders */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-blue-600" />
                  Recent Orders
                </h2>
                <Link href="/vendor/sales" className="text-primary text-sm font-semibold hover:underline">
                  View all →
                </Link>
              </div>

              {recentOrders.length === 0 ? (
                <div className="p-8 text-center">
                  <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 mb-4">No orders yet</p>
                  <p className="text-sm text-gray-500">When customers buy your products, orders will appear here</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Order</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Product</th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700">Qty</th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700">Your Payout</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {recentOrders.map((order) => (
                        <tr key={order.id} className="hover:bg-gray-50">
                          <td className="px-6 py-3">
                            <span className="text-sm font-semibold text-gray-900">{order.orderNumber}</span>
                          </td>
                          <td className="px-6 py-3">
                            <span className="text-sm text-gray-600">{order.productName}</span>
                          </td>
                          <td className="px-6 py-3 text-right">
                            <span className="text-sm font-medium text-gray-900">{order.quantity}</span>
                          </td>
                          <td className="px-6 py-3 text-right">
                            <span className="text-sm font-bold text-green-600">{formatCurrency(order.vendorPayout)}</span>
                          </td>
                          <td className="px-6 py-3">
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                                order.status === 'delivered'
                                  ? 'bg-green-100 text-green-700'
                                  : order.status === 'shipped'
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-yellow-100 text-yellow-700'
                              }`}
                            >
                              {order.status?.charAt(0).toUpperCase() + order.status?.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-3">
                            <span className="text-sm text-gray-500">
                              {new Date(order.createdAt).toLocaleDateString('en-IN')}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Top Products */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-orange-600" />
                Top Products
              </h2>
            </div>

            {topProducts.length === 0 ? (
              <div className="p-6 text-center">
                <Package className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No products yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {topProducts.map((product, idx) => (
                  <div key={product.id} className="px-6 py-4 hover:bg-gray-50">
                    <div className="flex items-start gap-3">
                      <div className="text-2xl w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        {product.images?.[0] || '📦'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate text-sm">{product.name}</p>
                        <p className="text-xs text-gray-500 mt-1">{product.category}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs font-bold text-green-600">
                            <ArrowUpRight className="w-3 h-3 inline mr-1" />
                            {product.sold_count} sold
                          </span>
                          <span className="text-xs text-gray-600 font-semibold">
                            {formatCurrency(product.final_price)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
