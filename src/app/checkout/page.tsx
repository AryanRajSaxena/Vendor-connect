'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency, calculateCommissions, generateReferralCode } from '@/utils/calculations';

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

export default function CheckoutPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [deliveryData, setDeliveryData] = useState<DeliveryData>({
    name: user?.name || '',
    phone: user?.phone || '',
    email: user?.email || '',
    address: '',
    city: '',
    state: '',
    pincode: '',
  });

  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [agreeTerms, setAgreeTerms] = useState(false);

  // Load cart
  useEffect(() => {
    try {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      setCartItems(cart);
    } catch (error) {
      console.error('Failed to load cart:', error);
    }
  }, []);

  // Redirect if not authenticated or cart is empty
  useEffect(() => {
    if (!user) {
      router.push('/');
      return;
    }
    if (cartItems.length === 0 && currentStep > 1) {
      router.push('/cart');
    }
  }, [user, cartItems, currentStep, router]);

  const handleDeliveryDataChange = (field: keyof DeliveryData, value: string) => {
    setDeliveryData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateDeliveryData = () => {
    if (!deliveryData.name || !deliveryData.phone || !deliveryData.email) {
      setError('Please fill all required fields');
      return false;
    }
    if (!deliveryData.address || !deliveryData.city || !deliveryData.state || !deliveryData.pincode) {
      setError('Please fill complete address');
      return false;
    }
    if (deliveryData.pincode.length !== 6) {
      setError('Pincode must be 6 digits');
      return false;
    }
    return true;
  };

  const handlePaymentSubmit = () => {
    if (!agreeTerms) {
      setError('Please accept terms and conditions');
      return;
    }
    setCurrentStep(3);
  };

  const handlePlaceOrder = async () => {
    try {
      setLoading(true);
      setError(null);

      // Validate
      if (cartItems.length === 0) {
        throw new Error('Cart is empty');
      }

      // Create order for each cart item (in production, handle multiple items)
      const orderId = `ORD-${Date.now()}`;
      const firstItem = cartItems[0];

      // Calculate commissions
      const commission = calculateCommissions(firstItem.price * 0.8); // Assume 80% of final price is base

      // Get referral code from localStorage if available
      const referralCode = localStorage.getItem('referralCode') || undefined;

      // Create order via API
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: orderId,
          customerId: user?.id,
          sellerId: referralCode ? generateReferralCode(user?.id || '', firstItem.id) : null,
          vendorId: firstItem.vendorId,
          productId: firstItem.id,
          quantity: cartItems.reduce((sum, item) => sum + item.quantity, 0),
          finalPrice: calculateTotal(),
          sellerCommission: commission.sellerCommission,
          platformCommission: commission.platformCommission,
          vendorPayout: commission.vendorPayout,
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
          paymentMethod: paymentMethod,
          paymentStatus: 'completed',
          orderStatus: 'pending',
          commissionStatus: 'pending',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create order');
      }

      const order = await response.json();

      // Clear cart
      localStorage.removeItem('cart');
      localStorage.removeItem('referralCode');

      // Redirect to confirmation
      router.push(`/order-confirmation?orderId=${order.id}`);
    } catch (err) {
      setError((err as Error).message);
      console.error('Failed to place order:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const subtotal = calculateTotal();
  const deliveryCharges = subtotal > 500 ? 0 : 50;
  const total = subtotal + deliveryCharges;

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Redirecting to login...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    currentStep >= step
                      ? 'bg-primary text-white'
                      : 'bg-gray-300 text-gray-600'
                  }`}
                >
                  {step}
                </div>
                {step < 3 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      currentStep > step ? 'bg-primary' : 'bg-gray-300'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span className={currentStep >= 1 ? 'text-gray-900 font-semibold' : ''}>
              Delivery Address
            </span>
            <span className={currentStep >= 2 ? 'text-gray-900 font-semibold' : ''}>
              Payment Method
            </span>
            <span className={currentStep >= 3 ? 'text-gray-900 font-semibold' : ''}>
              Review Order
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Step 1: Delivery Address */}
            {currentStep === 1 && (
              <div className="bg-white rounded-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Delivery Address</h2>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Full Name *"
                      value={deliveryData.name}
                      onChange={(e) => handleDeliveryDataChange('name', e.target.value)}
                      className="col-span-2 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="tel"
                      placeholder="Phone Number *"
                      value={deliveryData.phone}
                      onChange={(e) => handleDeliveryDataChange('phone', e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <input
                      type="email"
                      placeholder="Email *"
                      value={deliveryData.email}
                      onChange={(e) => handleDeliveryDataChange('email', e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <input
                    type="text"
                    placeholder="Street Address *"
                    value={deliveryData.address}
                    onChange={(e) => handleDeliveryDataChange('address', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />

                  <div className="grid grid-cols-3 gap-4">
                    <input
                      type="text"
                      placeholder="City *"
                      value={deliveryData.city}
                      onChange={(e) => handleDeliveryDataChange('city', e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <input
                      type="text"
                      placeholder="State *"
                      value={deliveryData.state}
                      onChange={(e) => handleDeliveryDataChange('state', e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <input
                      type="text"
                      placeholder="Pincode *"
                      value={deliveryData.pincode}
                      onChange={(e) => handleDeliveryDataChange('pincode', e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  {error && <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg text-sm">{error}</div>}

                  <button
                    onClick={() => {
                      if (validateDeliveryData()) {
                        setError(null);
                        setCurrentStep(2);
                      }
                    }}
                    className="btn btn-primary w-full py-3 flex items-center justify-center gap-2"
                  >
                    Continue to Payment <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Payment Method */}
            {currentStep === 2 && (
              <div className="bg-white rounded-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Payment Method</h2>

                <div className="space-y-4 mb-6">
                  {[
                    { value: 'cod', label: 'Cash on Delivery', icon: '💵' },
                    { value: 'upi', label: 'UPI (GPay, PhonePe, Paytm)', icon: '📱' },
                    { value: 'card', label: 'Credit/Debit Card', icon: '💳' },
                    { value: 'netbanking', label: 'Net Banking', icon: '🏦' },
                    { value: 'wallet', label: 'Digital Wallets', icon: '👛' },
                  ].map((method) => (
                    <label
                      key={method.value}
                      className="flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all"
                      style={{
                        borderColor: paymentMethod === method.value ? '#FF6B35' : '#e5e7eb',
                        backgroundColor: paymentMethod === method.value ? '#fff5f0' : 'white',
                      }}
                    >
                      <input
                        type="radio"
                        name="payment"
                        value={method.value}
                        checked={paymentMethod === method.value}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-4 h-4"
                      />
                      <span className="text-xl ml-3">{method.icon}</span>
                      <span className="ml-3 font-semibold text-gray-900">{method.label}</span>
                    </label>
                  ))}
                </div>

                {/* Terms */}
                <label className="flex items-start mb-6">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="w-4 h-4 mt-1"
                  />
                  <span className="ml-3 text-gray-600 text-sm">
                    I agree to the terms and conditions and privacy policy
                  </span>
                </label>

                {error && <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg text-sm mb-4">{error}</div>}

                <div className="flex gap-4">
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="btn btn-outline flex-1 py-3"
                  >
                    Back
                  </button>
                  <button
                    onClick={handlePaymentSubmit}
                    className="btn btn-primary flex-1 py-3 flex items-center justify-center gap-2"
                  >
                    Review Order <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Review Order */}
            {currentStep === 3 && (
              <div className="bg-white rounded-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Review Your Order</h2>

                {/* Items */}
                <div className="mb-6 pb-6 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-4">Order Items</h3>
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex justify-between py-2">
                      <span className="text-gray-600">
                        {item.name} x {item.quantity}
                      </span>
                      <span className="font-semibold">{formatCurrency(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>

                {/* Address */}
                <div className="mb-6 pb-6 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-2">Delivery To</h3>
                  <p className="text-gray-600">
                    {deliveryData.name}, {deliveryData.phone} <br />
                    {deliveryData.address}, {deliveryData.city}, {deliveryData.state} {deliveryData.pincode}
                  </p>
                </div>

                {/* Payment */}
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-2">Payment Method</h3>
                  <p className="text-gray-600 capitalize">
                    {paymentMethod === 'cod'
                      ? 'Cash on Delivery'
                      : paymentMethod === 'upi'
                        ? 'UPI'
                        : paymentMethod === 'card'
                          ? 'Card'
                          : 'Other'}
                  </p>
                </div>

                {error && <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg text-sm mb-4">{error}</div>}

                <div className="flex gap-4">
                  <button
                    onClick={() => setCurrentStep(2)}
                    className="btn btn-outline flex-1 py-3"
                  >
                    Back
                  </button>
                  <button
                    onClick={handlePlaceOrder}
                    disabled={loading}
                    className="btn btn-primary flex-1 py-3 disabled:opacity-50"
                  >
                    {loading ? 'Placing Order...' : 'Place Order'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg p-6 sticky top-20">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h3>

              <div className="space-y-3 mb-6 pb-6 border-b border-gray-200">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {item.name} x{item.quantity}
                    </span>
                    <span className="font-semibold">{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Delivery</span>
                  <span>{deliveryCharges === 0 ? 'FREE' : formatCurrency(deliveryCharges)}</span>
                </div>
              </div>

              <div className="border-t pt-4 flex justify-between items-center">
                <span className="font-bold text-gray-900">Total</span>
                <span className="text-2xl font-bold text-primary">{formatCurrency(total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
