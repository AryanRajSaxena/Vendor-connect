'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ShoppingCart, Check, ChevronLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency, getImageUrl } from '@/utils/calculations';

interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  final_price: number;
  sold_count: number;
  is_active: boolean;
  images: string[];
  specifications: Record<string, string>;
  vendor_id: string;
  created_at: string;
}

export default function ProductDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isBuying, setIsBuying] = useState(false);

  const getSafeCart = () => {
    try {
      const parsed = JSON.parse(localStorage.getItem('cart') || '[]');
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch (error) {
      console.warn('Invalid cart in localStorage, resetting cart.', error);
    }

    localStorage.setItem('cart', '[]');
    return [];
  };

  const syncLocalCart = (cart: any[]) => {
    localStorage.setItem('cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('cart-updated'));
  };

  useEffect(() => {
    const code =
      searchParams.get('ref') ||
      searchParams.get('referral') ||
      searchParams.get('code') ||
      '';

    const normalized = code.trim().toUpperCase();
    if (!normalized) return;

    localStorage.setItem('referralCode', normalized);
  }, [searchParams]);

  // Fetch product details
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/products/${params.id}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
          throw new Error('Product not found');
        }

        const data = await response.json();
        setProduct(data);
      } catch (error) {
        console.error('Failed to fetch product:', error);
        setError((error as Error).message);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchProduct();
    }
  }, [params.id]);

  const handleAddToCart = () => {
    if (!product) return;

    const addToLocalCart = () => {
      const cart = getSafeCart();
      const existingItem = cart.find((item: any) => item.id === product.id);

      if (existingItem) {
        existingItem.quantity = 1; // Always 1 for digital products
      } else {
        cart.push({
          id: product.id,
          name: product.name,
          price: product.final_price,
          quantity: 1,
          image: product.images?.[0] || '📦',
          vendorId: product.vendor_id,
        });
      }

      syncLocalCart(cart);
    };

    if (!user?.id) {
      try {
        addToLocalCart();
        alert(`Added to cart!`);
      } catch (error) {
        console.error('Failed to add to cart:', error);
      }
      return;
    }

    (async () => {
      try {
        setIsBuying(true);
        const response = await fetch('/api/cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerId: user.id,
            productId: product.id,
            quantity: 1,
          }),
        });

        if (!response.ok) {
          const apiError = await response.json().catch(() => ({}));
          throw new Error(apiError.error || 'Failed to add to database cart');
        }

        const data = await response.json();
        syncLocalCart(data.items || []);
        alert(`Added to cart!`);
      } catch (error) {
        console.error('Failed to add to database cart, falling back to local cart:', error);
        try {
          addToLocalCart();
          alert(`Added to cart!`);
        } catch (fallbackError) {
          console.error('Failed to add to fallback local cart:', fallbackError);
        }
      } finally {
        setIsBuying(false);
      }
    })();
  };

  const handleBuyNow = () => {
    if (!user?.id) {
      alert('Please login to continue');
      return;
    }
    handleAddToCart();
    // Redirect to checkout after adding to cart
    setTimeout(() => {
      window.location.href = '/checkout';
    }, 500);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500 text-lg">Loading product...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg mb-4">{error || 'Product not found'}</p>
          <Link href="/products" className="btn btn-primary">
            Back to Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumb */}
      <div className="bg-gray-50 border-b border-gray-200 px-4 py-3">
        <div className="max-w-7xl mx-auto">
          <Link href="/products" className="inline-flex items-center gap-1 text-gray-600 hover:text-gray-900 text-sm">
            <ChevronLeft className="w-4 h-4" />
            Back to Products
          </Link>
        </div>
      </div>

      {/* Main Product Section */}
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          
          {/* Left: Image Gallery - Amazon Style */}
          <div className="flex flex-col gap-4">
            {/* Main Image */}
            <div className="bg-white border border-gray-300 rounded-lg p-8 flex items-center justify-center h-[500px] sticky top-20 hover:shadow-lg transition-shadow">
              {getImageUrl(product.images?.[activeImageIndex]) ? (
                <img
                  src={getImageUrl(product.images?.[activeImageIndex])!}
                  alt={product.name}
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <span className="text-8xl">📦</span>
              )}
            </div>
            
            {/* Thumbnail Gallery */}
            {product.images && product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`w-20 h-20 rounded flex-shrink-0 border-2 transition-all overflow-hidden flex items-center justify-center bg-white ${ 
                      activeImageIndex === idx ? 'border-orange-500 shadow-md' : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {getImageUrl(img) ? (
                      <img src={getImageUrl(img)!} alt={`${product.name} ${idx + 1}`} className="w-full h-full object-contain" />
                    ) : (
                      <span className="text-lg">📦</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Product Details - Amazon Style */}
          <div className="flex flex-col gap-6">
            
            {/* Title */}
            <div>
              <p className="text-sm text-gray-500 mb-2">{product.category}</p>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">{product.name}</h1>
            </div>

            {/* Rating & Reviews */}
            <div className="flex items-center gap-4 pb-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <span key={i} className="text-yellow-400 text-lg">★</span>
                  ))}
                </div>
                <span className="text-blue-600 font-semibold text-sm">{product.sold_count} Reviews</span>
              </div>
              <span className="text-gray-600 text-sm">|</span>
              <span className="text-gray-700 font-semibold text-sm">{product.sold_count}+ bought</span>
            </div>

            {/* Pricing - Large & Prominent */}
            <div className="pb-6 border-b border-gray-200">
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Price</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-gray-900">{formatCurrency(product.final_price)}</span>
                  <span className="text-green-700 font-semibold text-sm">Inclusive of all taxes</span>
                </div>
                <p className="text-xs text-gray-500">Free Digital Delivery</p>
              </div>
            </div>

            {/* Key Features / Highlights */}
            {product.specifications && Object.keys(product.specifications).length > 0 && (
              <div className="pb-6 border-b border-gray-200">
                <h3 className="font-bold text-gray-900 mb-4">About this item</h3>
                <ul className="space-y-3">
                  {Object.entries(product.specifications).slice(0, 5).map(([key, value]) => (
                    <li key={key} className="flex gap-3">
                      <span className="text-blue-600 font-bold text-lg">•</span>
                      <span className="text-gray-700 text-sm">
                        <span className="font-semibold">{key}:</span> {value}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Main CTA Buttons */}
            <div className="space-y-3 pb-6 border-b border-gray-200">
              <button
                onClick={handleBuyNow}
                disabled={isBuying}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-4 rounded-full text-lg transition-all shadow-md hover:shadow-lg disabled:opacity-50"
              >
                Buy Now
              </button>
              <button
                onClick={handleAddToCart}
                disabled={isBuying}
                className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-3 px-4 rounded-full text-lg transition-all shadow-md hover:shadow-lg disabled:opacity-50"
              >
                <ShoppingCart className="w-5 h-5 inline mr-2" />
                Add to Cart
              </button>
            </div>

            {/* Additional Info */}
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Secure Transaction</p>
                  <p className="text-gray-600 text-xs">Your transaction is secure. We work hard to protect your security and privacy.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Digital Access</p>
                  <p className="text-gray-600 text-xs">Get instant access to your digital product after purchase.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-gray-900 text-sm">7-Day Guarantee</p>
                  <p className="text-gray-600 text-xs">Not satisfied? Get a full refund within 7 days.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Description & Details - Below the fold */}
        <div className="mt-16 pt-10 border-t border-gray-200">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Main Description */}
            <div className="lg:col-span-2">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Product Details</h2>
              <div className="prose prose-sm max-w-none">
                <p className="text-gray-700 leading-relaxed mb-6">{product.description}</p>
              </div>

              {/* Detailed Specifications */}
              {product.specifications && Object.keys(product.specifications).length > 0 && (
                <div className="mt-10">
                  <h3 className="text-xl font-bold text-gray-900 mb-6">Technical Specifications</h3>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    {Object.entries(product.specifications).map(([key, value], idx) => (
                      <div
                        key={key}
                        className={`flex py-4 px-6 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                      >
                        <div className="w-1/3">
                          <p className="font-semibold text-gray-900">{key}</p>
                        </div>
                        <div className="w-2/3">
                          <p className="text-gray-700">{value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar - Quick Info */}
            <div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 sticky top-20">
                <h3 className="font-bold text-gray-900 mb-4">Have a Question?</h3>
                <p className="text-sm text-gray-700 mb-4">Help other customers find helpful answers.</p>
                
                <div className="space-y-4 pt-4 border-t border-gray-200">
                  <div>
                    <p className="text-xs text-gray-600 font-semibold uppercase tracking-wide">Category</p>
                    <p className="text-gray-900 font-semibold mt-1">{product.category}</p>
                  </div>
                  
                  <div>
                    <p className="text-xs text-gray-600 font-semibold uppercase tracking-wide">Item Type</p>
                    <p className="text-gray-900 font-semibold mt-1">Digital Product</p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-600 font-semibold uppercase tracking-wide">Total Reviews</p>
                    <p className="text-gray-900 font-semibold mt-1">{product.sold_count}+</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
