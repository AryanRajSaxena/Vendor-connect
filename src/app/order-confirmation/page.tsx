'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Check, Package, Truck } from 'lucide-react';

interface Order {
  id: string;
  order_status: string;
  payment_method: string;
  final_price: number;
  created_at: string;
  delivery_address: {
    address: string;
    city: string;
    state: string;
    pincode: string;
  };
}

export default function OrderConfirmationPage() {
  const searchParams = useSearchParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  const orderId = searchParams.get('orderId');

  // Fetch order details
  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/orders/${orderId}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });

        if (response.ok) {
          const data = await response.json();
          setOrder(data);
        } else {
          console.error('Failed to fetch order');
        }
      } catch (error) {
        console.error('Failed to fetch order:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading order details...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-16">
        {/* Success Animation */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6 mx-auto">
            <Check className="w-10 h-10 text-green-600 animate-bounce" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Order Confirmed!</h1>
          <p className="text-gray-600 text-lg">Thank you for your purchase</p>
        </div>

        {/* Order Details Card */}
        <div className="bg-white rounded-lg p-8 mb-8">
          {/* Order ID */}
          <div className="mb-8 pb-8 border-b border-gray-200">
            <p className="text-gray-600 text-sm mb-1">Order ID</p>
            <p className="text-3xl font-bold text-gray-900 font-mono">{orderId || 'ORD-'}</p>
          </div>

          {/* Status Timeline */}
          <div className="mb-8">
            <h3 className="font-semibold text-gray-900 mb-6">Order Status</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Order Placed</p>
                  <p className="text-sm text-gray-600">
                    {order?.created_at ? new Date(order.created_at).toLocaleDateString() : 'Today'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Package className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Order Confirmed</p>
                  <p className="text-sm text-gray-600">Vendor will confirm within 2 hours</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Truck className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Shipped</p>
                  <p className="text-sm text-gray-600">3-5 business days</p>
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="mb-8 pb-8 border-t border-gray-200 pt-8">
            <h3 className="font-semibold text-gray-900 mb-4">Order Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Order Total</span>
                <span className="font-semibold text-gray-900">
                  ₹{order?.final_price || '0'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Payment Method</span>
                <span className="font-semibold text-gray-900 capitalize">
                  {order?.payment_method === 'cod' ? 'Cash on Delivery' : order?.payment_method}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Payment Status</span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-yellow-100 text-yellow-800">
                  Pending
                </span>
              </div>
            </div>
          </div>

          {/* Delivery Address */}
          {order?.delivery_address && (
            <div className="pb-8 border-t border-gray-200 pt-8">
              <h3 className="font-semibold text-gray-900 mb-4">Delivery Address</h3>
              <div className="text-gray-600 space-y-1">
                <p>{order.delivery_address.address}</p>
                <p>
                  {order.delivery_address.city}, {order.delivery_address.state}{' '}
                  {order.delivery_address.pincode}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Email Confirmation */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <p className="text-blue-900">
            📧 A confirmation email has been sent to your registered email address. You can track your order status anytime.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href={`/order-tracking/${orderId}`}
            className="btn btn-primary py-3 text-center"
          >
            Track Order
          </Link>
          <Link
            href="/products"
            className="btn btn-outline py-3 text-center"
          >
            Continue Shopping
          </Link>
        </div>

        {/* Help Section */}
        <div className="mt-12 p-6 bg-gray-100 rounded-lg">
          <h4 className="font-semibold text-gray-900 mb-2">Need Help?</h4>
          <p className="text-gray-600 text-sm mb-3">
            If you have any questions about your order, please don't hesitate to contact us.
          </p>
          <div className="space-y-2 text-sm">
            <p className="text-gray-600">
              <strong>Email:</strong> support@vendorconnect.com
            </p>
            <p className="text-gray-600">
              <strong>Phone:</strong> 1-800-VENDOR-1
            </p>
            <p className="text-gray-600">
              <strong>Hours:</strong> Mon-Fri 9 AM - 6 PM IST
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
