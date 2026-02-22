'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency } from '@/utils/calculations';

interface Product {
  id: string;
  name: string;
  category: string;
  basePrice: number;
  finalPrice: number;
  stock: number;
  images?: string[];
  vendorId: string;
  description: string;
}

interface SellerProduct {
  productId: string;
}

export default function SellerMarketplacePage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [sellerProducts, setSellerProducts] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterPrice, setFilterPrice] = useState<'all' | 'budget' | 'mid' | 'premium'>('all');
  const [sortBy, setSortBy] = useState<'relevant' | 'price-low' | 'price-high' | 'newest'>('relevant');
  const [addingProduct, setAddingProduct] = useState<string | null>(null);
  const [pricePercentage, setPricePercentage] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    if (!isLoading && user?.role !== 'seller') {
      router.push('/');
      return;
    }

    if (user?.id) {
      fetchMarketplaceData();
    }
  }, [user, isLoading, router]);

  const fetchMarketplaceData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [productsRes, sellerProdsRes] = await Promise.all([
        fetch('/api/products'),
        fetch(`/api/seller-products?sellerId=${user?.id}`),
      ]);

      if (!productsRes.ok) throw new Error('Failed to fetch products');

      const allProducts = await productsRes.json();
      const products = Array.isArray(allProducts) ? allProducts : allProducts.products || [];
      
      // Transform snake_case API response to camelCase
      const transformedProducts = products.map((p: any) => ({
        id: p.id,
        name: p.name,
        category: p.category,
        basePrice: p.base_price || 0,
        finalPrice: p.final_price || 0,
        stock: p.stock || 0,
        images: p.images || [],
        vendorId: p.vendor_id,
        description: p.description,
        createdAt: p.created_at,
      }));
      setProducts(transformedProducts);

      if (sellerProdsRes.ok) {
        const sellerProds = await sellerProdsRes.json();
        const rawProducts = Array.isArray(sellerProds) ? sellerProds : sellerProds.products || [];
        
        // Transform snake_case to camelCase
        const productIdSet = new Set(
          rawProducts.map((p: any) => p.product_id || p.productId)
        );
        setSellerProducts(productIdSet);
      }
    } catch (err) {
      setError((err as Error).message);
      console.error('Failed to fetch marketplace data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async (productId: string) => {
    try {
      setAddingProduct(productId);

      // Generate a short referral code (max 20 chars)
      const shortSellerId = (user?.id || '').substring(0, 6);
      const shortProductId = productId.substring(0, 6);
      const rand = Math.random().toString(36).substring(2, 5).toUpperCase();
      const referralCode = `${shortSellerId}${shortProductId}${rand}`.substring(0, 20);

      const response = await fetch('/api/seller-products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sellerId: user?.id,
          productId: productId,
          referralCode,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add product');
      }

      setSellerProducts((prev) => new Set([...prev, productId]));
      alert('✓ Product added to your store!');
    } catch (err) {
      alert('Error: ' + (err as Error).message);
    } finally {
      setAddingProduct(null);
    }
  };

  const filteredAndSorted = products
    .filter((p) => !filterCategory || p.category === filterCategory)
    .filter((p) => {
      if (filterPrice === 'budget') return p.basePrice <= 2000;
      if (filterPrice === 'mid') return p.basePrice > 2000 && p.basePrice <= 10000;
      if (filterPrice === 'premium') return p.basePrice > 10000;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'price-low') return a.basePrice - b.basePrice;
      if (sortBy === 'price-high') return b.basePrice - a.basePrice;
      if (sortBy === 'newest') return new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime();
      return 0;
    });

  const categories = Array.from(new Set(products.map((p) => p.category)));

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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/seller/dashboard" className="text-primary hover:underline mb-2 inline-block">
              ← Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Marketplace</h1>
            <p className="text-gray-600">Browse and add products to your store</p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Price Range</label>
              <select
                value={filterPrice}
                onChange={(e) => setFilterPrice(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">All Prices</option>
                <option value="budget">Budget (0-₹2000)</option>
                <option value="mid">Mid-range (₹2000-₹10000)</option>
                <option value="premium">Premium (₹10000+)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="relevant">Most Relevant</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="newest">Newest First</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setFilterCategory('');
                  setFilterPrice('all');
                  setSortBy('relevant');
                }}
                className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Reset Filters
              </button>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading products...</p>
          </div>
        ) : filteredAndSorted.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-gray-500 mb-4">No products match your filters</p>
            <button
              onClick={() => {
                setFilterCategory('');
                setFilterPrice('all');
              }}
              className="text-primary hover:underline"
            >
              Clear filters →
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSorted.map((product) => (
              <div key={product.id} className="bg-white rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                {/* Product Image */}
                <div className="h-48 bg-gray-100 flex items-center justify-center text-5xl">
                  {product.images?.[0] || '📦'}
                </div>

                {/* Product Info */}
                <div className="p-4">
                  <h3 className="font-bold text-gray-900 truncate">{product.name}</h3>
                  <p className="text-xs text-gray-500 mb-2">{product.category}</p>

                  {/* Description */}
                  <p className="text-sm text-gray-600 line-clamp-2 mb-4">{product.description}</p>

                  {/* Pricing */}
                  <div className="bg-gray-50 rounded-lg p-3 mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs text-gray-600">Vendor Base Price:</span>
                      <span className="font-semibold text-gray-900">{formatCurrency(product.basePrice)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600">Customer Final Price:</span>
                      <span className="font-bold text-primary">{formatCurrency(product.finalPrice)}</span>
                    </div>
                    {sellerProducts.has(product.id) && (
                      <div className="text-xs text-green-600 font-semibold mt-2">✓ Already in your store</div>
                    )}
                  </div>

                  {/* Your Markup */}
                  {!sellerProducts.has(product.id) && (
                    <div className="mb-4">
                      <label className="text-xs text-gray-700 font-semibold mb-1 block">
                        Your Markup % (optional):
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={pricePercentage[product.id] || 0}
                        onChange={(e) =>
                          setPricePercentage({ ...pricePercentage, [product.id]: parseFloat(e.target.value) || 0 })
                        }
                        placeholder="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        You'll earn 10% commission from {formatCurrency(product.finalPrice)}
                      </p>
                    </div>
                  )}

                  {/* Stock Status */}
                  <div className="mb-4">
                    <p className="text-xs text-gray-600">
                      Vendor Stock:{' '}
                      <span className={product.stock > 10 ? 'text-green-600 font-semibold' : 'text-orange-600 font-semibold'}>
                        {product.stock} units
                      </span>
                    </p>
                  </div>

                  {/* Action Button */}
                  {sellerProducts.has(product.id) ? (
                    <Link
                      href={`/seller/dashboard/products/${product.id}`}
                      className="w-full btn btn-outline text-center"
                    >
                      View in Store
                    </Link>
                  ) : (
                    <button
                      onClick={() => handleAddProduct(product.id)}
                      disabled={addingProduct === product.id}
                      className="w-full btn btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <Plus className="w-4 h-4" />
                      {addingProduct === product.id ? 'Adding...' : 'Add to Store'}
                    </button>
                  )}

                  {/* View Product */}
                  <Link
                    href={`/products/${product.id}`}
                    className="w-full block text-center mt-2 text-primary hover:underline text-sm"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
