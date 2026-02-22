'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, TrendingUp, BarChart3, PieChart, Calendar } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency } from '@/utils/calculations';

interface VendorAnalytics {
  totalRevenue: number;
  totalEarnings: number;
  totalCommissions: number;
  totalOrders: number;
  averageOrderValue: number;
  topProduct: {
    name: string;
    sales: number;
    revenue: number;
  } | null;
}

interface Order {
  id: string;
  finalPrice: number;
  vendorPayout: number;
  platformCommission: number;
  sellerCommission: number;
  quantity: number;
  createdAt: string;
}

export default function VendorEarningsPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [analytics, setAnalytics] = useState<VendorAnalytics>({
    totalRevenue: 0,
    totalEarnings: 0,
    totalCommissions: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    topProduct: null,
  });

  const [monthlyData, setMonthlyData] = useState<{ month: string; earnings: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && user?.role !== 'vendor') {
      router.push('/');
      return;
    }

    if (user?.id) {
      fetchAnalyticsData();
    }
  }, [user, isLoading, router]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch vendor's products and orders
      const [productsRes, ordersRes] = await Promise.all([
        fetch(`/api/products?vendorId=${user?.id}`),
        fetch(`/api/orders?vendorId=${user?.id}`),
      ]);

      if (!ordersRes.ok) throw new Error('Failed to fetch orders');

      const orders = await ordersRes.json();
      const ordersArray = Array.isArray(orders) ? orders : orders.orders || [];

      // Calculate analytics
      const totalRevenue = ordersArray.reduce((sum: number, o: Order) => sum + o.finalPrice * o.quantity, 0);
      const totalEarnings = ordersArray.reduce((sum: number, o: Order) => sum + o.vendorPayout, 0);
      const totalCommissions = ordersArray.reduce(
        (sum: number, o: Order) => sum + o.sellerCommission + o.platformCommission,
        0
      );

      // Process monthly data
      const monthlyEarnings: { [key: string]: number } = {};
      ordersArray.forEach((o: Order) => {
        const date = new Date(o.createdAt);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthlyEarnings[monthKey] = (monthlyEarnings[monthKey] || 0) + o.vendorPayout;
      });

      const sortedMonths = Object.keys(monthlyEarnings)
        .sort()
        .slice(-12)
        .map((month) => {
          const [year, monthNum] = month.split('-');
          const monthName = new Date(parseInt(year), parseInt(monthNum) - 1).toLocaleDateString('en-IN', {
            month: 'short',
          });
          return { month: monthName, earnings: monthlyEarnings[month] };
        });

      setMonthlyData(sortedMonths);

      setAnalytics({
        totalRevenue,
        totalEarnings,
        totalCommissions,
        totalOrders: ordersArray.length,
        averageOrderValue: ordersArray.length > 0 ? totalEarnings / ordersArray.length : 0,
        topProduct: null, // Can be calculated from products if needed
      });
    } catch (err) {
      setError((err as Error).message);
      console.error('Failed to fetch analytics:', err);
    } finally {
      setLoading(false);
    }
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
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Earnings & Analytics</h1>
          <p className="text-gray-600">Track your revenue, commissions, and earnings over time</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Primary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium mb-1">TOTAL EARNINGS</p>
                <p className="text-3xl font-bold text-gray-900">{formatCurrency(analytics.totalEarnings)}</p>
                <p className="text-xs text-gray-500 mt-2">Your net payout</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium mb-1">TOTAL REVENUE</p>
                <p className="text-3xl font-bold text-gray-900">{formatCurrency(analytics.totalRevenue)}</p>
                <p className="text-xs text-gray-500 mt-2">Before commissions</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium mb-1">TOTAL COMMISSIONS</p>
                <p className="text-3xl font-bold text-gray-900">{formatCurrency(analytics.totalCommissions)}</p>
                <p className="text-xs text-gray-500 mt-2">Paid to platform & sellers</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <PieChart className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium mb-1">AVG ORDER PAYOUT</p>
                <p className="text-3xl font-bold text-gray-900">{formatCurrency(analytics.averageOrderValue)}</p>
                <p className="text-xs text-gray-500 mt-2">{analytics.totalOrders} orders</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Earnings Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Commission Structure */}
          <div className="lg:col-span-1 bg-white rounded-lg p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Commission Breakdown</h2>

            <div className="space-y-4">
              <div className="pb-4 border-b border-gray-100">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Gross Revenue</span>
                  <span className="font-bold text-gray-900">{formatCurrency(analytics.totalRevenue)}</span>
                </div>
              </div>

              <div className="pb-4 border-b border-gray-100">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Less: Seller Commission (10%)</span>
                  <span className="font-semibold text-red-600">
                    -{formatCurrency((analytics.totalRevenue * 10) / 100)}
                  </span>
                </div>
              </div>

              <div className="pb-4 border-b border-gray-100">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Less: Platform Commission (15%)</span>
                  <span className="font-semibold text-red-600">
                    -{formatCurrency((analytics.totalRevenue * 15) / 100)}
                  </span>
                </div>
              </div>

              <div className="pt-4 flex justify-between items-center">
                <span className="text-sm font-bold text-gray-900">Your Net Payout</span>
                <span className="text-xl font-bold text-green-600">{formatCurrency(analytics.totalEarnings)}</span>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-900">
                <strong>💡 Note:</strong> Your actual payout may vary based on the markup percentage and product-specific commission rates.
              </p>
            </div>
          </div>

          {/* Monthly Earnings Chart */}
          <div className="lg:col-span-2 bg-white rounded-lg p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Earnings Trend</h2>

            {monthlyData.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No data available yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {monthlyData.length > 0 ? (
                  <>
                    {monthlyData.map((data, idx) => {
                      const maxEarnings = Math.max(...monthlyData.map((d) => d.earnings));
                      const percentage = maxEarnings > 0 ? (data.earnings / maxEarnings) * 100 : 0;

                      return (
                        <div key={idx} className="flex items-center gap-4">
                          <div className="w-16 text-sm font-semibold text-gray-600">{data.month}</div>
                          <div className="flex-1 bg-gray-100 rounded-full h-8 overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-primary to-blue-600 h-full flex items-center justify-end pr-3 transition-all"
                              style={{ width: `${percentage}%` }}
                            >
                              {percentage > 15 && (
                                <span className="text-xs font-bold text-white">{formatCurrency(data.earnings)}</span>
                              )}
                            </div>
                          </div>
                          {percentage <= 15 && <span className="text-xs font-semibold text-gray-600 w-24 text-right">{formatCurrency(data.earnings)}</span>}
                        </div>
                      );
                    })}
                  </>
                ) : null}
              </div>
            )}
          </div>
        </div>

        {/* Additional Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg p-6">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              How You Earn
            </h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>✓ You set the base price for your products</li>
              <li>✓ Platform adds 25% markup (customers see final price)</li>
              <li>✓ Sellers earn 10% commission on each sale</li>
              <li>✓ Platform takes 15% commission on each sale</li>
              <li>✓ You receive the remaining 75% of the final price</li>
            </ul>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-lg p-6">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              Payout Example
            </h3>
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex justify-between">
                <span>You set base price:</span>
                <span className="font-semibold">₹1000</span>
              </div>
              <div className="flex justify-between">
                <span>+25% platform markup:</span>
                <span className="font-semibold">+₹250</span>
              </div>
              <div className="border-t border-blue-300 pt-2 flex justify-between">
                <span>Customer pays:</span>
                <span className="font-bold text-blue-600">₹1250</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>10% seller commission:</span>
                <span className="font-semibold">-₹125</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>15% platform commission:</span>
                <span className="font-semibold">-₹187.50</span>
              </div>
              <div className="border-t border-blue-300 pt-2 flex justify-between">
                <span>You receive:</span>
                <span className="font-bold text-green-600">₹937.50</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
