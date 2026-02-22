'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, DollarSign, TrendingUp, CheckCircle, Calendar } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency } from '@/utils/calculations';

interface CommissionPayout {
  id: string;
  amount: number;
  status: 'processing' | 'completed' | 'failed';
  orderId: string;
  productName: string;
  createdAt: string;
  completedAt?: string;
}

export default function SellerEarningsPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [earnings, setEarnings] = useState(0);
  const [nextPayout, setNextPayout] = useState(0);
  const [payouts, setPayouts] = useState<CommissionPayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && user?.role !== 'seller') {
      router.push('/');
      return;
    }

    if (user?.id) {
      fetchEarningsData();
    }
  }, [user, isLoading, router]);

  const fetchEarningsData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch seller products to calculate total earnings
      const productsRes = await fetch(`/api/seller-products?sellerId=${user?.id}`);
      if (!productsRes.ok) throw new Error('Failed to fetch earnings');

      const products = await productsRes.json();
      const prods = Array.isArray(products) ? products : products.products || [];
      
      // Transform snake_case to camelCase for earnings calculation
      const transformedProds = prods.map((p: any) => ({
        finalPrice: p.final_price || p.finalPrice || 0,
        basePrice: p.base_price || p.basePrice || 0,
        soldCount: p.sold_count || p.soldCount || 0,
      }));
      
      const totalEarnings = transformedProds.reduce(
        (sum: number, p: any) => sum + ((p.finalPrice || p.basePrice) * 0.1 * (p.soldCount || 0)),
        0
      );

      setEarnings(totalEarnings);

      // Fetch orders to calculate commissions and payouts
      try {
        const ordersRes = await fetch(`/api/orders?sellerId=${user?.id}`);
        if (ordersRes.ok) {
          const orderData = await ordersRes.json();
          const orders = Array.isArray(orderData) ? orderData : orderData.orders || [];

          // Transform snake_case to camelCase for orders
          const transformedOrders = orders.map((o: any) => ({
            id: o.id,
            status: o.status,
            sellerCommission: o.seller_commission || o.sellerCommission || 0,
            orderNumber: o.order_number || o.orderNumber,
            productName: o.product_name || o.productName,
            createdAt: o.created_at || o.createdAt,
            completedAt: o.completed_at || o.completedAt,
          }));

          // Calculate commissions from delivered orders
          const commissionPayouts: CommissionPayout[] = transformedOrders
            .filter((o: any) => o.status === 'delivered')
            .map((o: any) => ({
              id: o.id,
              amount: o.sellerCommission || 0,
              status: 'completed',
              orderId: o.orderNumber,
              productName: o.productName,
              createdAt: o.createdAt,
              completedAt: o.completedAt || o.createdAt,
            }));

          // Calculate processing commissions (from pending/shipped orders)
          const processingCommissions = transformedOrders
            .filter((o: any) => o.status === 'pending' || o.status === 'shipped')
            .reduce((sum: number, o: any) => sum + (o.sellerCommission || 0), 0);

          setPayouts(commissionPayouts);
          setNextPayout(processingCommissions);
        }
      } catch {
        // Orders API might not be available yet
      }
    } catch (err) {
      setError((err as Error).message);
      console.error('Failed to fetch earnings:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
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

  const totalPaidOut = payouts
    .filter((p) => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0);
  const processingAmount = payouts
    .filter((p) => p.status === 'processing')
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/seller/dashboard" className="text-primary hover:underline mb-2 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Earnings & Commissions</h1>
          <p className="text-gray-600">Your commission payouts are processed automatically when customers receive their orders</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8 flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-blue-900">Automatic Commission Processing</p>
            <p className="text-sm text-blue-800 mt-1">
              When customers receive their orders, your 10% commission is automatically calculated and processed to your bank account.
            </p>
          </div>
        </div>

        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Total Earnings */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium mb-1">Total Commissions Earned</p>
                <p className="text-3xl font-bold text-gray-900">{formatCurrency(earnings)}</p>
                <p className="text-xs text-gray-500 mt-2">10% of all sales</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          {/* Processing Payouts */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium mb-1">Processing Payouts</p>
                <p className="text-3xl font-bold text-gray-900">{formatCurrency(nextPayout)}</p>
                <p className="text-xs text-gray-500 mt-2">from pending orders</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Already Paid Out */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium mb-1">Already Paid Out</p>
                <p className="text-3xl font-bold text-gray-900">{formatCurrency(totalPaidOut)}</p>
                <p className="text-xs text-gray-500 mt-2">automatically processed</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Commission History */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Commission Payment History</h2>

              {loading ? (
                <p className="text-gray-500 text-center py-8">Loading...</p>
              ) : payouts.length === 0 ? (
                <div className="text-center py-12">
                  <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600 font-medium">No commissions yet</p>
                  <p className="text-sm text-gray-500 mt-2">Once customers purchase and receive products, commissions will appear here</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {payouts.map((payout) => (
                    <div
                      key={payout.id}
                      className={`border rounded-lg p-4 hover:bg-gray-50 transition-colors ${
                        payout.status === 'completed' ? 'border-green-200' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <p className="font-semibold text-gray-900">{formatCurrency(payout.amount)}</p>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(payout.status)}`}
                            >
                              {payout.status === 'completed'
                                ? '✓ Processed'
                                : payout.status === 'processing'
                                  ? 'Processing'
                                  : 'Failed'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">{payout.productName}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>Order: {payout.orderId}</span>
                            <span>
                              {new Date(payout.createdAt).toLocaleDateString('en-IN', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          {payout.status === 'completed' && payout.completedAt && (
                            <p className="text-xs text-gray-500">
                              Paid{' '}
                              {new Date(payout.completedAt).toLocaleDateString('en-IN', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* How It Works */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <h3 className="font-bold text-gray-900 mb-4">How Commission Works</h3>
              <div className="space-y-4 text-sm">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">
                    1
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Customer Purchases</p>
                    <p className="text-gray-600">Customer buys product at final price</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">
                    2
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Order Delivered</p>
                    <p className="text-gray-600">Vendor ships and customer receives</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">
                    3
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Commission Auto-Processed</p>
                    <p className="text-gray-600">10% commission automatically sent to your bank</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Commission Rate Info */}
            <div className="bg-primary/5 rounded-lg p-6 border border-primary/20">
              <h3 className="font-bold text-gray-900 mb-3">Your Commission Rate</h3>
              <p className="text-3xl font-bold text-primary mb-2">10%</p>
              <p className="text-sm text-gray-600 mb-4">
                You earn 10% on every customer order
              </p>
              <div className="bg-white rounded p-3 text-sm">
                <p className="text-gray-600 mb-2">Example:</p>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Customer Price:</span>
                    <span className="font-semibold">₹1,000</span>
                  </div>
                  <div className="flex justify-between text-primary">
                    <span>Your Commission (10%):</span>
                    <span className="font-semibold">₹100</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bank Account Info */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <h3 className="font-bold text-gray-900 mb-3">Payout Account</h3>
              <p className="text-sm text-gray-600 mb-4">
                Commissions are sent to the bank account you provided in your settings
              </p>
              <Link
                href="/seller/settings"
                className="inline-block text-primary hover:text-primary/80 font-semibold text-sm"
              >
                Update Bank Details →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
