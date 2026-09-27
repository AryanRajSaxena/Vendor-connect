'use client';

import { Suspense, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Check,
  Package,
  Truck,
  Home,
  Clock,
  Phone,
  Mail,
  AlertCircle,
  X,
  RefreshCw,
  ChevronRight,
} from 'lucide-react';

interface Order {
  id: string;
  order_status: string;
  payment_method: string;
  payment_status: string;
  base_price: number;
  seller_commission: number;
  created_at: string;
  updated_at: string;
  quantity: number;
  customer_details: {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
  } | null;
  delivery_address: {
    address: string;
    city: string;
    state: string;
    pincode: string;
  } | null;
  product?: {
    name: string;
  };
  commission_release_date?: string;
  vendor_id?: string;
  seller_id?: string;
}

interface TrackingEvent {
  status: string;
  label: string;
  description: string;
  timestamp?: string;
  completed: boolean;
  current: boolean;
}

function OrderTrackingContent() {
  const params = useParams();
  const orderId = params.id as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrder = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);

    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        const data = await response.json();
        setOrder(data);
        setError(null);
      } else {
        const errData = await response.json();
        setError(errData.error || 'Failed to fetch order');
      }
    } catch (err) {
      setError('Unable to load order details. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrder();
    // Auto-refresh every 30 seconds for live updates
    const interval = setInterval(() => fetchOrder(), 30000);
    return () => clearInterval(interval);
  }, [orderId]);

  const getTrackingTimeline = (): TrackingEvent[] => {
    if (!order) return [];

    const statusOrder = ['pending', 'confirmed', 'shipped', 'delivered'];
    const currentStatusIndex = statusOrder.indexOf(order.order_status);

    const events: TrackingEvent[] = [
      {
        status: 'pending',
        label: 'Order Placed',
        description: 'Your order has been placed successfully',
        timestamp: order.created_at,
        completed: currentStatusIndex >= 0,
        current: currentStatusIndex === 0,
      },
      {
        status: 'confirmed',
        label: 'Order Confirmed',
        description: 'Vendor has confirmed your order',
        completed: currentStatusIndex >= 1,
        current: currentStatusIndex === 1,
      },
      {
        status: 'shipped',
        label: 'Shipped',
        description: 'Your order is on the way',
        completed: currentStatusIndex >= 2,
        current: currentStatusIndex === 2,
      },
      {
        status: 'delivered',
        label: 'Delivered',
        description: 'Order delivered successfully',
        completed: currentStatusIndex >= 3,
        current: currentStatusIndex === 3,
      },
    ];

    return events;
  };

  const getStepIcon = (event: TrackingEvent) => {
    if (event.status === 'delivered') {
      return event.completed ? (
        <Check className="w-5 h-5 text-white" />
      ) : (
        <Home className="w-5 h-5 text-gray-500" />
      );
    }
    if (event.status === 'shipped') {
      return event.completed ? (
        <Check className="w-5 h-5 text-white" />
      ) : (
        <Truck className="w-5 h-5 text-gray-500" />
      );
    }
    if (event.status === 'confirmed') {
      return event.completed ? (
        <Check className="w-5 h-5 text-white" />
      ) : (
        <Package className="w-5 h-5 text-gray-500" />
      );
    }
    return event.completed ? (
      <Check className="w-5 h-5 text-white" />
    ) : (
      <Clock className="w-5 h-5 text-gray-500" />
    );
  };

  const getStatusColor = (event: TrackingEvent) => {
    if (event.completed) return 'bg-green-500';
    if (event.current) return 'bg-blue-500 animate-pulse';
    return 'bg-gray-200';
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      cod: 'Cash on Delivery',
      upi: 'UPI Payment',
      card: 'Credit/Debit Card',
      netbanking: 'Net Banking',
      wallet: 'Digital Wallet',
    };
    return labels[method] || method;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Unable to Load Order</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={() => fetchOrder(true)}
              className="w-full btn btn-primary py-3"
            >
              Try Again
            </button>
            <Link href="/" className="block w-full btn btn-outline py-3">
              Go to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <X className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Order Not Found</h1>
          <p className="text-gray-600 mb-6">This order may have been removed or does not exist.</p>
          <Link href="/" className="btn btn-primary py-3">
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  const tracking = getTrackingTimeline();
  const isCancelled = order.order_status === 'cancelled';

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Track Order</h1>
              <p className="text-gray-500 mt-1">Order ID: {order.id}</p>
            </div>
            <button
              onClick={() => fetchOrder(true)}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Cancelled Order Alert */}
        {isCancelled && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <X className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-900">Order Cancelled</h3>
                <p className="text-red-700 text-sm mt-1">
                  This order has been cancelled. If you believe this is an error, please contact us at team@agentcroww.com
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Status Timeline */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Order Progress</h2>

          <div className="relative">
            {tracking.map((event, index) => (
              <div key={event.status} className="relative flex items-start gap-4 pb-8 last:pb-0">
                {/* Connector Line */}
                {index < tracking.length - 1 && (
                  <div
                    className={`absolute left-5 top-10 w-0.5 h-full ${
                      event.completed ? 'bg-green-500' : 'bg-gray-200'
                    }`}
                  />
                )}

                {/* Status Icon */}
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${getStatusColor(
                    event
                  )}`}
                >
                  {getStepIcon(event)}
                </div>

                {/* Status Content */}
                <div className="flex-1 pt-1">
                  <div className="flex items-center justify-between">
                    <p className={`font-semibold ${event.completed ? 'text-gray-900' : 'text-gray-400'}`}>
                      {event.label}
                    </p>
                    {event.timestamp && (
                      <p className="text-xs text-gray-500">{formatDate(event.timestamp)}</p>
                    )}
                  </div>
                  <p className={`text-sm mt-1 ${event.completed ? 'text-gray-600' : 'text-gray-400'}`}>
                    {event.description}
                  </p>
                  {event.current && !isCancelled && (
                    <span className="inline-block mt-2 px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                      Current Status
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Details */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Details</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Product Info */}
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Product</h3>
              <p className="text-gray-900 font-medium">{order.product?.name || 'Digital Product'}</p>
              <p className="text-sm text-gray-500 mt-1">Quantity: {order.quantity}</p>
            </div>

            {/* Order Value */}
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Order Value</h3>
              <p className="text-2xl font-bold text-gray-900">₹{order.base_price}</p>
            </div>

            {/* Payment Method */}
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Payment Method</h3>
              <p className="text-gray-900">{getPaymentMethodLabel(order.payment_method)}</p>
            </div>

            {/* Payment Status */}
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Payment Status</h3>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  order.payment_status === 'completed'
                    ? 'bg-green-100 text-green-800'
                    : order.payment_status === 'failed'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}
              >
                {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
              </span>
            </div>
          </div>
        </div>

        {/* Customer & Delivery Address */}
        {(order.customer_details || order.delivery_address) && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h2>

            {order.customer_details && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 pb-6 border-b border-gray-100">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Contact Details</h3>
                  <p className="text-gray-900">{order.customer_details.name}</p>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                    <Phone className="w-3 h-3" />
                    {order.customer_details.phone}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                    <Mail className="w-3 h-3" />
                    {order.customer_details.email}
                  </div>
                </div>
              </div>
            )}

            {order.delivery_address && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Delivery Address</h3>
                <p className="text-gray-900">{order.delivery_address.address}</p>
                <p className="text-gray-600">
                  {order.delivery_address.city}, {order.delivery_address.state}{' '}
                  {order.delivery_address.pincode}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Timeline */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Timeline</h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Order Placed</span>
              <span className="text-gray-900 font-medium">{formatDate(order.created_at)}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Last Updated</span>
              <span className="text-gray-900 font-medium">{formatDate(order.updated_at)}</span>
            </div>
            {order.commission_release_date && (
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Commission Release Date</span>
                <span className="text-gray-900 font-medium">
                  {formatDate(order.commission_release_date)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Help Section */}
        <div className="bg-gray-100 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-3">Need Help?</h3>
          <p className="text-gray-600 text-sm mb-4">
            If you have any questions about your order, our support team is here to help.
          </p>

          <div className="space-y-3">
            <a
              href="mailto:team@agentcroww.com"
              className="flex items-center gap-3 text-gray-700 hover:text-gray-900 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <p className="font-medium">Email Support</p>
                <p className="text-sm text-gray-500">team@agentcroww.com</p>
              </div>
              <ChevronRight className="w-4 h-4 ml-auto" />
            </a>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Response time: Within 24-48 hours | Mon-Fri, 9 AM - 6 PM IST
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link href="/" className="btn btn-primary py-3 text-center">
            Continue Shopping
          </Link>
          <Link href="/order-confirmation?orderId=" className="btn btn-outline py-3 text-center">
            View Order Confirmation
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function OrderTrackingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading order tracking...</p>
          </div>
        </div>
      }
    >
      <OrderTrackingContent />
    </Suspense>
  );
}
