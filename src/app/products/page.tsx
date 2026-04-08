'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ShoppingCart, ChevronDown, Search, Package } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency, getImageUrl } from '@/utils/calculations';

interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  base_price: number;
  markup: number;
  markup_percentage: number;
  stock: number;
  sold_count: number;
  is_active: boolean;
  images: string[];
  vendor_id: string;
  created_at: string;
}

function ProductsContent() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const isUnauthenticated = !user?.id;
  const guestRoleParam = (searchParams.get('guestRole') || '').toLowerCase();
  const isGuestVendorOrSeller =
    !user?.id && (guestRoleParam === 'vendor' || guestRoleParam === 'seller');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>(searchParams.get('q') || '');
  const [sortBy, setSortBy] = useState('relevance');
  const [activeReferralCode, setActiveReferralCode] = useState<string>('');
  const [imageLoadErrors, setImageLoadErrors] = useState<Record<string, boolean>>({});



  const sortOptions = [
    { value: 'relevance', label: 'Relevance' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'rating', label: 'Rating' },
    { value: 'newest', label: 'Newest' },
  ];

  // Fetch products
  useEffect(() => {
    const code =
      searchParams.get('ref') ||
      searchParams.get('referral') ||
      searchParams.get('code') ||
      '';

    const normalized = code.trim().toUpperCase();
    if (normalized) {
      setActiveReferralCode(normalized);
      localStorage.setItem('referralCode', normalized);
      return;
    }

    const storedCode = (localStorage.getItem('referralCode') || '').trim().toUpperCase();
    if (storedCode) {
      setActiveReferralCode(storedCode);
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams();
        params.append('isActive', 'true');

        const response = await fetch(`/api/products?${params}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }

        const data = await response.json();
        let filtered = data;

        // Sort products
        if (sortBy === 'price-low') {
          filtered.sort((a: Product, b: Product) => a.base_price - b.base_price);
        } else if (sortBy === 'price-high') {
          filtered.sort((a: Product, b: Product) => b.base_price - a.base_price);
        } else if (sortBy === 'newest') {
          filtered.sort(
            (a: Product, b: Product) =>
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        } else if (sortBy === 'rating') {
          filtered.sort((a: Product, b: Product) => b.sold_count - a.sold_count);
        }

        setProducts(filtered);
      } catch (error) {
        console.error('Failed to fetch products:', error);
        setError((error as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [sortBy]);

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );



  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-16 z-40 shadow-soft">
        <div className="container-custom py-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Discover Products</h1>
            <p className="text-gray-600 mt-1">Browse our curated collection of quality products</p>
          </div>
        </div>
      </div>

      <div className="container-custom py-8">
        <div>
            {/* Sort Options */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 bg-white rounded-xl p-4 shadow-soft border border-gray-100">
              <div className="relative w-full md:max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search courses by name..."
                  className="w-full rounded-lg border border-gray-200 bg-white pl-10 pr-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500"
                />
              </div>

              <p className="text-gray-600 font-medium md:order-3">
                <span className="text-gray-900 font-bold">{filteredProducts.length}</span> products found
              </p>

              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="select pr-10 text-sm font-medium"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="text-center py-20">
                <div className="spinner w-12 h-12 mx-auto mb-4"></div>
                <p className="text-gray-500 font-medium">Loading products...</p>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="alert-error">
                <p className="font-semibold">Error: {error}</p>
              </div>
            )}

            {/* Products Grid */}
            {!loading && !error && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((product) => {
                    return (
                    <div key={product.id} className="group rounded-xl border border-slate-700/80 bg-slate-900/80 overflow-hidden hover:border-emerald-400/50 hover:shadow-[0_10px_30px_rgba(16,185,129,0.08)] transition-all duration-200 flex flex-col">
                      {/* Media */}
                      <div className="relative h-44 bg-gradient-to-br from-slate-200 to-slate-100 overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/20 via-transparent to-transparent z-10" />

                        <div className="h-full w-full flex items-center justify-center">
                          {getImageUrl(product.images?.[0]) && !imageLoadErrors[product.id] ? (
                            <img
                              src={getImageUrl(product.images?.[0])!}
                              alt={product.name}
                              className="w-full h-full object-cover"
                              onError={() => {
                                setImageLoadErrors((prev) => ({ ...prev, [product.id]: true }));
                              }}
                            />
                          ) : (
                            <div className="w-14 h-14 rounded-xl bg-slate-900 text-slate-200 flex items-center justify-center text-3xl shadow-sm">
                              📦
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Details */}
                      <div className="p-4 flex flex-col flex-1">
                        <div className="mb-3 min-h-[66px]">
                          <h3 className="text-lg leading-snug font-semibold text-slate-100 line-clamp-2">
                            {product.name}
                          </h3>
                          <p className="mt-1 text-sm text-slate-300 line-clamp-2">
                            {product.description || 'Premium course with practical learning outcomes.'}
                          </p>
                        </div>

                        <div className="mb-3 rounded-xl border border-emerald-400/25 bg-gradient-to-b from-emerald-500/10 to-emerald-600/5 p-3">
                          <p className="text-[11px] text-slate-400 font-medium">Course Price</p>
                          <span className="text-2xl font-black tracking-tight text-slate-100 tabular-nums">
                            {formatCurrency(product.base_price)}
                          </span>
                          <span className="ml-2 text-xs font-medium text-slate-300 bg-slate-800 px-2 py-1 rounded-md border border-slate-700">
                            Lifetime access
                          </span>
                        </div>

                        {/* Action Buttons */}
                        <div className="mt-auto">
                          {isUnauthenticated ? (
                            <span
                              aria-disabled="true"
                              className="inline-flex items-center justify-center w-full rounded-lg border border-slate-700 bg-slate-800/40 text-slate-500 cursor-not-allowed py-2.5 text-sm font-medium"
                            >
                              View Details
                            </span>
                          ) : (
                            <Link
                              href={`/products/${product.id}${(() => {
                                const detailParams = new URLSearchParams();
                                if (activeReferralCode) {
                                  detailParams.set('ref', activeReferralCode);
                                }
                                if (isGuestVendorOrSeller) {
                                  detailParams.set('guestRole', guestRoleParam);
                                }
                                const query = detailParams.toString();
                                return query ? `?${query}` : '';
                              })()}`}
                              className="inline-flex items-center justify-center w-full rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 py-2.5 text-sm font-medium transition-colors"
                            >
                              <ShoppingCart className="w-4 h-4 mr-2" />
                              Buy Now
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  )})
                ) : (
                  <div className="col-span-full text-center py-20">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gray-100 text-gray-400 mb-4">
                      <Package className="w-10 h-10" />
                    </div>
                    <p className="text-gray-500 text-lg font-medium">No products found</p>
                    <p className="text-gray-400 text-sm mt-2">Try a different course name</p>
                  </div>
                )}
              </div>
            )}
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <p className="text-gray-500">Loading products...</p>
        </div>
      }
    >
      <ProductsContent />
    </Suspense>
  );
}
