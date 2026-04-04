import { useState, useCallback } from 'react';

export interface PaymentInitRequest {
  orderId: string;
  orderAmount: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
}

export interface PaymentInitResponse {
  success: boolean;
  orderToken?: any;
  paymentUrl?: string;
  cfOrderId?: number;
  orderId?: string;
  error?: string;
}

export interface PaymentVerifyResponse {
  success: boolean;
  paymentStatus: string;
  message?: string;
  error?: string;
}

/**
 * useCashfreePayment
 * Hook for managing Cashfree payment flow
 * 
 * Usage:
 * const { initiatePayment, verifyPayment, loading, error } = useCashfreePayment();
 * 
 * await initiatePayment({
 *   orderId: 'ORD-123',
 *   orderAmount: 500,
 *   customerName: 'John Doe',
 *   customerEmail: 'john@example.com',
 *   customerPhone: '9876543210'
 * });
 */
export function useCashfreePayment() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);

  /**
   * Initiate payment with Cashfree
   */
  const initiatePayment = useCallback(
    async (request: PaymentInitRequest): Promise<PaymentInitResponse | null> => {
      try {
        setLoading(true);
        setError(null);
        setPaymentUrl(null);

        // Validate request with detailed messages
        if (!request.orderId) {
          const err = 'Order ID is missing';
          setError(err);
          return { success: false, error: err };
        }
        if (!request.orderAmount) {
          const err = 'Order amount is missing or invalid';
          setError(err);
          return { success: false, error: err };
        }
        if (!request.customerName) {
          const err = 'Customer name is missing';
          setError(err);
          return { success: false, error: err };
        }
        if (!request.customerEmail) {
          const err = 'Customer email is missing';
          setError(err);
          return { success: false, error: err };
        }
        if (!request.customerPhone) {
          const err = 'Customer phone is missing';
          setError(err);
          return { success: false, error: err };
        }

        // Call payment initiation endpoint
        console.log('Calling payment initiate endpoint with:', request);
        const response = await fetch('/api/payments/initiate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
        });

        const data: PaymentInitResponse = await response.json();
        console.log('Payment initiate response:', { status: response.status, success: data.success, orderId: data.orderId });

        if (!response.ok || !data.success) {
          const err = data.error || 'Failed to initiate payment';
          console.error('Payment initiation failed:', err);
          setError(err);
          return { success: false, error: err };
        }

        if (!data.paymentUrl) {
          const err = 'No payment URL received';
          setError(err);
          return { success: false, error: err };
        }

        setPaymentUrl(data.paymentUrl);
        return data;
      } catch (err) {
        const error = err instanceof Error ? err.message : 'Unknown error';
        setError(error);
        console.error('Payment initiation error:', error);
        return { success: false, error };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Redirect customer to payment URL
   */
  const redirectToPayment = useCallback((url: string) => {
    if (typeof window !== 'undefined') {
      window.location.href = url;
    }
  }, []);

  /**
   * Verify payment after redirect
   */
  const verifyPayment = useCallback(
    async (orderId: string): Promise<PaymentVerifyResponse | null> => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/payments/verify?orderId=${encodeURIComponent(orderId)}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const data: PaymentVerifyResponse = await response.json();

        if (!response.ok) {
          const err = data.error || 'Failed to verify payment';
          setError(err);
          return { success: false, paymentStatus: 'unknown', error: err };
        }

        if (!data.success) {
          setError(data.message || 'Payment verification failed');
        }

        return data;
      } catch (err) {
        const error = err instanceof Error ? err.message : 'Unknown error';
        setError(error);
        console.error('Payment verification error:', error);
        return { success: false, paymentStatus: 'unknown', error };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Poll payment status (for retry scenarios)
   */
  const pollPaymentStatus = useCallback(
    async (
      orderId: string,
      maxRetries: number = 10,
      intervalMs: number = 3000
    ): Promise<PaymentVerifyResponse | null> => {
      let retries = 0;

      const checkStatus = async (): Promise<PaymentVerifyResponse | null> => {
        try {
          const response = await verifyPayment(orderId);

          if (response?.success || response?.paymentStatus === 'completed') {
            return response;
          }

          retries++;
          if (retries < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, intervalMs));
            return checkStatus();
          }

          return response;
        } catch (err) {
          console.error('Error polling payment status:', err);
          return null;
        }
      };

      return checkStatus();
    },
    [verifyPayment]
  );

  /**
   * Server-side payment verification
   */
  const verifyPaymentServerSide = useCallback(
    async (orderId: string, customerId?: string): Promise<PaymentVerifyResponse | null> => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/payments/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ orderId, customerId }),
        });

        const data: PaymentVerifyResponse = await response.json();

        if (!response.ok) {
          const err = data.error || 'Failed to verify payment';
          setError(err);
          return { success: false, paymentStatus: 'unknown', error: err };
        }

        return data;
      } catch (err) {
        const error = err instanceof Error ? err.message : 'Unknown error';
        setError(error);
        console.error('Payment verification error:', error);
        return { success: false, paymentStatus: 'unknown', error };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    initiatePayment,
    redirectToPayment,
    verifyPayment,
    verifyPaymentServerSide,
    pollPaymentStatus,
    clearError,
    loading,
    error,
    paymentUrl,
  };
}
