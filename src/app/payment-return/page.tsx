'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useCashfreePayment } from '@/hooks/useCashfreePayment';

export default function PaymentReturnPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { verifyPayment } = useCashfreePayment();

  const orderId = searchParams.get('order_id');
  const cfOrderId = searchParams.get('cf_order_id');

  const [status, setStatus] = useState<'verifying' | 'success' | 'failed'>('verifying');
  const [message, setMessage] = useState('Verifying your payment...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifyPaymentStatus = async () => {
      try {
        if (!orderId) {
          setStatus('failed');
          setMessage('Missing order information');
          return;
        }

        // Wait a moment for webhook to process
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Verify payment status
        const result = await verifyPayment(orderId);

        if (result?.success && result?.paymentStatus === 'completed') {
          setStatus('success');
          setMessage('Payment completed successfully!');
          
          // Redirect to order confirmation after 2 seconds
          setTimeout(() => {
            router.push(`/order-confirmation?orderId=${orderId}`);
          }, 2000);
        } else if (result?.paymentStatus === 'pending') {
          // Still pending, poll again
          await new Promise(resolve => setTimeout(resolve, 3000));
          verifyPaymentStatus();
        } else {
          setStatus('failed');
          setMessage(result?.message || 'Payment could not be verified');
          setError(result?.error);
        }
      } catch (err) {
        console.error('Payment verification error:', err);
        setStatus('failed');
        setMessage('An error occurred while verifying payment');
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    };

    verifyPaymentStatus();
  }, [orderId, verifyPayment, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        {status === 'verifying' && (
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-spin" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Verifying Payment</h2>
            <p className="text-gray-600">{message}</p>
            <p className="text-sm text-gray-500 mt-4">Order ID: {orderId}</p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center">
            <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
            <p className="text-gray-600 mb-4">{message}</p>
            <p className="text-sm text-gray-500">Order ID: {orderId}</p>
            <p className="text-sm text-gray-600 mt-2">Redirecting to order confirmation...</p>
          </div>
        )}

        {status === 'failed' && (
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Verification Failed</h2>
            <p className="text-gray-600 mb-4">{message}</p>
            {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
            <div className="flex gap-3">
              <button
                onClick={() => router.push(`/order-confirmation?orderId=${orderId}`)}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
              >
                Go to Order
              </button>
              <button
                onClick={() => router.push('/cart')}
                className="flex-1 bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700"
              >
                Back to Cart
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
