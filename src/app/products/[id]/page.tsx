'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Star, ShoppingCart, Heart, Share2, Check } from 'lucide-react';
import { formatCurrency } from '@/utils/calculations';

interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  base_price: number;
  final_price: number;
  markup: number;
  markup_percentage: number;
  stock: number;
  sold_count: number;
  is_active: boolean;
  images: string[];
  specifications: Record<string, string>;
  vendor_id: string;
  created_at: string;
}

export default function ProductDetailPage() {
  const params = useParams();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');
  const [isSaved, setIsSaved] = useState(false);

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

    try {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      const existingItem = cart.find((item: any) => item.id === product.id);

      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        cart.push({
          id: product.id,
          name: product.name,
          price: product.final_price,
          quantity: quantity,
          image: product.images?.[0] || '📦',
          vendorId: product.vendor_id,
        });
      }

      localStorage.setItem('cart', JSON.stringify(cart));
      alert(`Added ${quantity} item(s) to cart!`);
      setQuantity(1);
    } catch (error) {
      console.error('Failed to add to cart:', error);
    }
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Link href="/products" className="text-primary hover:underline mb-6 inline-block">
          ← Back to Products
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Image Section */}
          <div>
            <div className="bg-white rounded-lg p-8 mb-4">
              <div className="w-full aspect-square bg-gray-100 rounded-lg flex items-center justify-center text-9xl">
                {product.images?.[0] || '📦'}
              </div>
            </div>
            {product.images && product.images.length > 1 && (
              <div className="flex gap-4 overflow-x-auto">
                {product.images.map((img, idx) => (
                  <div key={idx} className="w-20 h-20 bg-white rounded-lg flex items-center justify-center text-2xl flex-shrink-0">
                    {img}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Details Section */}
          <div>
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-start justify-between mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
              </div>
              <p className="text-gray-500 mb-2">Category: {product.category}</p>

              {/* Rating */}
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${i <= 4 ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                    />
                  ))}
                </div>
                <span className="text-gray-600 text-sm">({product.sold_count} reviews)</span>
              </div>
            </div>

            {/* Pricing Breakdown (CRITICAL) */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
              <h3 className="font-semibold text-gray-900 mb-4">Pricing Breakdown</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Vendor Base Price:</span>
                  <span className="font-semibold">{formatCurrency(product.base_price)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Platform Markup ({product.markup_percentage}%):</span>
                  <span className="font-semibold text-green-600">+{formatCurrency(product.markup)}</span>
                </div>
                <div className="border-t pt-3 flex justify-between items-center">
                  <span className="font-semibold text-gray-900">Final Price You Pay:</span>
                  <span className="text-2xl font-bold text-primary">{formatCurrency(product.final_price)}</span>
                </div>
              </div>
            </div>

            {/* Stock & Availability */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-2">Availability</h3>
              {product.stock > 0 ? (
                <div className="flex items-center gap-2 text-green-600">
                  <Check className="w-5 h-5" />
                  <span>In Stock ({product.stock} available)</span>
                </div>
              ) : (
                <div className="text-red-600">Out of Stock</div>
              )}
            </div>

            {/* Quantity Selector */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">Quantity</h3>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                >
                  −
                </button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  min="1"
                  max={product.stock}
                  className="w-16 text-center border border-gray-300 rounded-lg py-2"
                />
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                >
                  +
                </button>
                <span className="text-gray-600 ml-4">
                  Total: {formatCurrency(product.final_price * quantity)}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 gap-3 mb-8">
              <button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className="btn btn-primary py-3 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <ShoppingCart className="w-5 h-5" />
                Add to Cart
              </button>
              <button
                onClick={() => setIsSaved(!isSaved)}
                className="btn btn-outline py-3 flex items-center justify-center gap-2"
              >
                <Heart className={`w-5 h-5 ${isSaved ? 'fill-red-500 text-red-500' : ''}`} />
                {isSaved ? 'Saved' : 'Save for Later'}
              </button>
              <button className="btn btn-outline py-3 flex items-center justify-center gap-2">
                <Share2 className="w-5 h-5" />
                Share
              </button>
            </div>

            {/* Trust Badges */}
            <div className="border-t pt-6 space-y-3">
              <div className="flex gap-3">
                <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-gray-900">Genuine Product</p>
                  <p className="text-sm text-gray-600">100% Authentic Guarantee</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-gray-900">Free Returns</p>
                  <p className="text-sm text-gray-600">7-day return period</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-gray-900">Secure Payment</p>
                  <p className="text-sm text-gray-600">SSL Encrypted Transactions</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="bg-white rounded-lg overflow-hidden">
          {/* Tab Headers */}
          <div className="border-b border-gray-200 flex">
            {[
              { id: 'description', label: 'Description' },
              { id: 'specifications', label: 'Specifications' },
              { id: 'reviews', label: 'Reviews' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-4 font-semibold border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'text-primary border-primary'
                    : 'text-gray-600 border-transparent hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'description' && (
              <div>
                <p className="text-gray-700 leading-relaxed">{product.description}</p>
              </div>
            )}

            {activeTab === 'specifications' && (
              <div>
                {product.specifications && Object.keys(product.specifications).length > 0 ? (
                  <table className="w-full">
                    <tbody>
                      {Object.entries(product.specifications).map(([key, value]) => (
                        <tr key={key} className="border-b border-gray-200">
                          <td className="py-3 px-4 font-semibold text-gray-700">{key}</td>
                          <td className="py-3 px-4 text-gray-600">{value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-gray-600">No specifications available</p>
                )}
              </div>
            )}

            {activeTab === 'reviews' && (
              <div>
                <p className="text-gray-600">
                  This product has been sold {product.sold_count} times. Share your reviews!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Related Products Section */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Similar Products</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="card">
                <div className="bg-gray-100 h-32 rounded-lg mb-3 flex items-center justify-center text-3xl">
                  📦
                </div>
                <h3 className="font-semibold text-gray-900">Similar Product {i}</h3>
                <p className="text-sm text-gray-500 mb-2">₹499</p>
                <button className="btn btn-sm btn-outline w-full">View Product</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
