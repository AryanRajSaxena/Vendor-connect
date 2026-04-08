'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, ShoppingBag } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCashfreePayment } from '@/hooks/useCashfreePayment';
import {
  Card,
  Button,
  Input,
  Select,
  Checkbox,
  AlertBanner,
  EmptyState,
} from '@/components/customer';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  vendorId: string;
}

interface DeliveryData {
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();
  const { initiatePayment } = useCashfreePayment();
  
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [referralCode, setReferralCode] = useState('');
  const [step, setStep] = useState<'review' | 'payment'>('review');

  const [deliveryData, setDeliveryData] = useState<DeliveryData>({
    name: user?.name || '',
    phone: user?.phone || '',
    email: user?.email || '',
    address: '',
    city: '',
    state: '',
    pincode: '',
  });

  const [paymentMethod, setPaymentMethod] = useState('online');
  const [agreeTerms, setAgreeTerms] = useState(false);

  // Calculate totals
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryCharges = subtotal > 500 ? 0 : 50;
  const total = subtotal + deliveryCharges;

  const S = [
    { value: 'AN', label: 'Andaman and Nicobar' },
    { value: 'AP', label: 'Andhra Pradesh' },
    { value: 'AR', label: 'Arunachal Pradesh' },
    { value: 'AS', label: 'Assam' },
    { value: 'BR', label: 'Bihar' },
    { value: 'CG', label: 'Chhattisgarh' },
    { value: 'CH', label: 'Chandigarh' },
    { value: 'DD', label: 'Daman and Diu' },
    { value: 'DL', label: 'Delhi' },
    { value: 'DN', label: 'Dadra and Nagar Haveli' },
    { value: 'GA', label: 'Goa' },
    { value: 'GJ', label: 'Gujarat' },
    { value: 'HR', label: 'Haryana' },
    { value: 'HP', label: 'Himachal Pradesh' },
    { value: 'JK', label: 'Jammu and Kashmir' },
    { value: 'JH', label: 'Jharkhand' },
    { value: 'KA', label: 'Karnataka' },
    { value: 'KL', label: 'Kerala' },
    { value: 'LA', label: 'Ladakh' },
    { value: 'LD', label: 'Lakshadweep' },
    { value: 'MP', label: 'Madhya Pradesh' },
    { value: 'MH', label: 'Maharashtra' },
    { value: 'MN', label: 'Manipur' },
    { value: 'ML', label: 'Meghalaya' },
    { value: 'MZ', label: 'Mizoram' },
    { value: 'NL', label: 'Nagaland' },
    { value: 'OD', label: 'Odisha' },
    { value: 'PB', label: 'Punjab' },
    { value: 'RJ', label: 'Rajasthan' },
    { value: 'SK', label: 'Sikkim' },
    { value: 'TN', label: 'Tamil Nadu' },
    { value: 'TR', label: 'Tripura' },
    { value: 'TS', label: 'Telangana' },
    { value: 'UK', label: 'Uttarakhand' },
    { value: 'UP', label: 'Uttar Pradesh' },
    { value: 'WB', label: 'West Bengal' },
  ];

  // Load cart
  useEffect(() => {
    const loadCart = async () => {
      try {
        setLoading(true);
        
        // Check for direct purchase item first (from "Buy Now" button)
        const directPurchase = sessionStorage.getItem('directPurchaseItem');
        if (directPurchase) {
          try {
            const item = JSON.parse(directPurchase);
            setCartItems([item]);
            // Clear the sessionStorage after loading
            sessionStorage.removeItem('directPurchaseItem');
            setLoading(false);
            return;
          } catch (error) {
            console.error('Failed to parse direct purchase item:', error);
          }
        }

        // No items found, redirect to products
        setCartItems([]);
        setLoading(false);
      } catch (err) {
        console.error('Failed to load cart:', err);
      } finally {
        setLoading(false);
      }
    };

    loadCart();
  }, [user?.id]);

  // Handle referral code from URL
  useEffect(() => {
    const code = searchParams.get('ref') || searchParams.get('referral') || '';
    if (code) {
      setReferralCode(code.toUpperCase());
    }
  }, [searchParams]);

  // Redirect if not authenticated or cart is empty
  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      router.push('/auth/login');
      return;
    }

    if (cartItems.length === 0 && !loading) {
      router.push('/products');
    }
  }, [authLoading, user, cartItems, loading, router]);

  const validateDeliveryData = (): boolean => {
    if (!deliveryData.name?.trim()) {
      setError('Please enter your name');
      return false;
    }
    if (!deliveryData.phone?.trim()) {
      setError('Please enter your phone number');
      return false;
    }
    if (!/^[0-9]{10}$/.test(deliveryData.phone.replace(/\D/g, ''))) {
      setError('Please enter a valid 10-digit phone number');
      return false;
    }
    if (!deliveryData.email?.trim()) {
      setError('Please enter your email address');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(deliveryData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    if (!deliveryData.address?.trim()) {
      setError('Please enter your address');
      return false;
    }
    if (!deliveryData.city?.trim()) {
      setError('Please enter your city');
      return false;
    }
    if (!deliveryData.state) {
      setError('Please select your state');
      return false;
    }
    if (!/^[0-9]{6}$/.test(deliveryData.pincode)) {
      setError('Please enter a valid 6-digit pincode');
      return false;
    }
    return true;
  };

  const handlePlaceOrder = async () => {
    try {
      setError(null);
      setSuccess(null);

      if (!validateDeliveryData()) return;
      if (!agreeTerms) {
        setError('Please accept the terms and conditions');
        return;
      }

      setProcessing(true);

      const createdOrders: any[] = [];

      for (let i = 0; i < cartItems.length; i++) {
        const item = cartItems[i];
        const orderId = `ORD-${Date.now()}-${i + 1}`;

        const orderResponse = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: orderId,
            customerId: user?.id,
            vendorId: item.vendorId,
            productId: item.id,
            quantity: item.quantity,
            referralCode: referralCode || null,
            customerDetails: {
              name: deliveryData.name,
              email: deliveryData.email,
              phone: deliveryData.phone,
            },
            deliveryAddress: {
              address: deliveryData.address,
              city: deliveryData.city,
              state: deliveryData.state,
              pincode: deliveryData.pincode,
            },
            paymentMethod,
            orderStatus: 'pending',
          }),
        });

        if (!orderResponse.ok) {
          const errorData = await orderResponse.json();
          throw new Error(errorData.error || 'Failed to create order');
        }

        const createdOrder = await orderResponse.json();
        createdOrders.push(createdOrder);
      }

      // Handle payment
      if (paymentMethod === 'cod') {
        // Clear cart
        if (user?.id) {
          await fetch('/api/cart', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ customerId: user.id }),
          });
        }
        localStorage.removeItem('cart');
        window.dispatchEvent(new Event('cart-updated'));
        router.push(`/order-confirmation?orderId=${createdOrders[0].id}`);
      } else {
        // Online payment
        const totalAmount = createdOrders.reduce(
          (sum, order) => sum + (Number(order.final_price) || 0),
          0
        );

        const paymentPayload = {
          orderId: createdOrders[0].id,
          orderAmount: Math.round(totalAmount * 100) / 100,
          customerName: deliveryData.name,
          customerEmail: deliveryData.email,
          customerPhone: deliveryData.phone.replace(/\D/g, ''),
        };

        const paymentResult = await initiatePayment(paymentPayload);

        if (!paymentResult?.success || !paymentResult?.paymentUrl) {
          throw new Error(paymentResult?.error || 'Failed to initiate payment');
        }

        window.location.href = paymentResult.paymentUrl;
      }
    } catch (err) {
      setError((err as Error).message);
      console.error('Checkout error:', err);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-920 to-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-3 border-primary-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-300">Loading checkout...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-920 to-gray-950">
        <div className="max-w-lg mx-auto px-4 py-8">
          <EmptyState
            icon={<ShoppingBag className="w-16 h-16" />}
            title="Cart is Empty"
            description="Add some products to your cart to checkout"
            action={{
              label: 'Continue Shopping',
              onClick: () => router.push('/products'),
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-920 to-gray-950 pb-20 md:pb-8">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            {step === 'review' ? 'Order Review' : 'Complete Payment'}
          </h1>
          <p className="text-gray-400 mt-2">
            {step === 'review'
              ? 'Review your order and enter delivery details'
              : 'Choose payment method and confirm'}
          </p>
        </div>

        {/* Error & Success Alerts */}
        {error && (
          <AlertBanner
            variant="error"
            message={error}
            onClose={() => setError(null)}
          />
        )}
        {success && (
          <AlertBanner
            variant="success"
            message={success}
            onClose={() => setSuccess(null)}
          />
        )}

        {step === 'review' ? (
          // REVIEW STEP
          <div className="space-y-6">
            {/* Order Items */}
            <Card>
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-800">
                <h2 className="text-lg font-bold text-white">Your Items</h2>
                <span className="text-primary-400 font-semibold">{cartItems.length} item(s)</span>
              </div>
              <div className="space-y-3">
                {cartItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between pb-3 border-b border-gray-800 last:border-0"
                  >
                    <div>
                      <p className="text-white font-medium">{item.name}</p>
                      <p className="text-sm text-gray-400">QTY: {item.quantity}</p>
                    </div>
                    <p className="text-white font-semibold">
                      ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                    </p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Order Summary */}
            <Card>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Subtotal</span>
                  <span className="text-white">₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Delivery Charges</span>
                  <span className={`${deliveryCharges === 0 ? 'text-green-400' : 'text-white'}`}>
                    {deliveryCharges === 0 ? 'FREE' : `₹${deliveryCharges}`}
                  </span>
                </div>
                <div className="pt-3 border-t border-gray-800 flex items-center justify-between">
                  <span className="text-white font-bold">Total</span>
                  <span className="text-2xl font-bold text-primary-400">
                    ₹{total.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </Card>

            {/* Delivery Details */}
            <Card>
              <div className="mb-4 pb-4 border-b border-gray-800">
                <h3 className="text-lg font-bold text-white">Delivery Details</h3>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Name *</label>
                    <Input
                      value={deliveryData.name}
                      onChange={(e) =>
                        setDeliveryData({ ...deliveryData, name: e.target.value })
                      }
                      placeholder="Full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Phone *</label>
                    <Input
                      value={deliveryData.phone}
                      onChange={(e) =>
                        setDeliveryData({ ...deliveryData, phone: e.target.value })
                      }
                      placeholder="10-digit number"
                      maxLength={10}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">Email *</label>
                  <Input
                    type="email"
                    value={deliveryData.email}
                    onChange={(e) =>
                      setDeliveryData({ ...deliveryData, email: e.target.value })
                    }
                    placeholder="your@email.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">Address *</label>
                  <Input
                    value={deliveryData.address}
                    onChange={(e) =>
                      setDeliveryData({ ...deliveryData, address: e.target.value })
                    }
                    placeholder="Street address"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">City *</label>
                    <Input
                      value={deliveryData.city}
                      onChange={(e) =>
                        setDeliveryData({ ...deliveryData, city: e.target.value })
                      }
                      placeholder="City"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Pincode *</label>
                    <Input
                      value={deliveryData.pincode}
                      onChange={(e) =>
                        setDeliveryData({ ...deliveryData, pincode: e.target.value })
                      }
                      placeholder="6-digit code"
                      maxLength={6}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">State *</label>
                  <Select
                    options={S}
                    value={deliveryData.state}
                    onChange={(e) =>
                      setDeliveryData({ ...deliveryData, state: e.target.value })
                    }
                  />
                </div>
              </div>
            </Card>

            {/* Referral Code */}
            <Card>
              <div>
                <label className="block text-sm font-medium text-white mb-2">Referral Code (Optional)</label>
                <Input
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                  placeholder="Enter referee code"
                />
              </div>
            </Card>

            {/* Next Button */}
            <Button
              onClick={() => {
                if (validateDeliveryData()) {
                  setStep('payment');
                }
              }}
              fullWidth
              size="lg"
              disabled={processing}
            >
              Continue to Payment
            </Button>
          </div>
        ) : (
          // PAYMENT STEP
          <div className="space-y-6">
            {/* Order Summary (Compact) */}
            <Card>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">{cartItems.length} item(s) - Total</span>
                <span className="text-2xl font-bold text-primary-400">
                  ₹{total.toLocaleString('en-IN')}
                </span>
              </div>
            </Card>

            {/* Payment Method */}
            <Card>
              <div className="mb-4 pb-4 border-b border-gray-800">
                <h3 className="text-lg font-bold text-white">Payment Method</h3>
              </div>
              <div className="space-y-3">
                <label className="flex items-center p-4 border border-gray-700 rounded-lg cursor-pointer hover:border-primary-500 hover:bg-gray-800/50 transition"
                >
                  <input
                    type="radio"
                    name="payment"
                    value="online"
                    checked={paymentMethod === 'online'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-4 h-4 text-primary-500"
                  />
                  <span className="ml-3">
                    <p className="font-medium text-white">Card / UPI / Wallet</p>
                    <p className="text-xs text-gray-400 mt-1">Powered by Cashfree</p>
                  </span>
                </label>

                <label className="flex items-center p-4 border border-gray-700 rounded-lg cursor-pointer hover:border-primary-500 hover:bg-gray-800/50 transition"
                >
                  <input
                    type="radio"
                    name="payment"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-4 h-4 text-primary-500"
                  />
                  <span className="ml-3">
                    <p className="font-medium text-white">Cash on Delivery</p>
                    <p className="text-xs text-gray-400 mt-1">Pay when you receive the order</p>
                  </span>
                </label>
              </div>
            </Card>

            {/* Delivery Address Summary */}
            <Card>
              <div className="mb-4 pb-4 border-b border-gray-800">
                <h3 className="text-lg font-bold text-white">Delivery To</h3>
              </div>
              <div className="text-sm space-y-1">
                <p className="text-white font-medium">{deliveryData.name}</p>
                <p className="text-gray-400">{deliveryData.phone}</p>
                <p className="text-gray-400">{deliveryData.email}</p>
                <p className="text-gray-400 mt-2">
                  {deliveryData.address}, {deliveryData.city}, {deliveryData.state} {deliveryData.pincode}
                </p>
              </div>
            </Card>

            {/* Terms Checkbox */}
            <Checkbox
              label="I agree to the Terms & Conditions and Privacy Policy"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
            />

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={() => setStep('review')}
                variant="ghost"
                fullWidth
                disabled={processing}
              >
                Back
              </Button>
              <Button
                onClick={handlePlaceOrder}
                fullWidth
                size="lg"
                isLoading={processing}
                disabled={!agreeTerms}
              >
                {processing ? 'Processing...' : `Pay ₹${total.toLocaleString('en-IN')}`}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-b from-gray-920 to-gray-950 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-primary-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-300">Loading...</p>
          </div>
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
