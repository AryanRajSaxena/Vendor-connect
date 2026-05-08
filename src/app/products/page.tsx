'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronDown, Search, Package, Users, BookOpen, Clock } from 'lucide-react';
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
  duration?: number; // Duration in hours
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
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900">
      {/* Header */}
      <div className="border-b border-slate-700/50 sticky top-16 z-40 bg-slate-950/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="mb-4">
            <h1 className="text-3xl font-bold text-slate-100 mb-1">Explore Courses</h1>
            <p className="text-slate-400">Learn from top instructors and expand your skills</p>
          </div>

          {/* Search and Sort Bar */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search courses..."
                className="w-full rounded-lg border border-slate-700 bg-slate-900/50 pl-10 pr-4 py-3 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition"
              />
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-400">
                <span className="font-semibold text-slate-300">{filteredProducts.length}</span> courses
              </span>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="rounded-lg border border-slate-700 bg-slate-900/50 px-4 py-3 text-slate-100 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 appearance-none transition cursor-pointer pr-10"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value} className="bg-slate-900">
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Loading State */}
        {loading && (
          <div className="text-center py-20">
            <div className="inline-block animate-spin mb-4">
              <BookOpen className="w-10 h-10 text-emerald-500" />
            </div>
            <p className="text-slate-400 font-medium text-lg">Loading courses...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-500/10 border border-red-400/30 text-red-300 p-4 rounded-lg mb-6 flex items-start gap-3">
            <Package className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Products Grid - Udemy Style */}
        {!loading && !error && (
          <>
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {filteredProducts.map((product) => {
                  const courseImage = getImageUrl(product.images?.[0]);
                  
                  return (
                    <div
                      key={product.id}
                      className="group rounded-lg overflow-hidden bg-slate-900/60 border border-slate-700/60 hover:border-emerald-500/40 transition-all duration-300 flex flex-col hover:shadow-xl hover:shadow-emerald-500/10"
                    >
                      {/* Course Thumbnail */}
                      <div className="relative h-40 bg-gradient-to-br from-slate-800 to-slate-900 overflow-hidden">
                        {courseImage && !imageLoadErrors[product.id] ? (
                          <img
                            src={courseImage}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            loading="eager"
                            fetchPriority="high"
                            onError={() => {
                              setImageLoadErrors((prev) => ({ ...prev, [product.id]: true }));
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
                            <BookOpen className="w-12 h-12 text-slate-700" />
                          </div>
                        )}
                      </div>

                      {/* Course Content */}
                      <div className="flex flex-col flex-1 p-4">
                        {/* Title */}
                        <h3 className="text-sm font-bold text-slate-100 line-clamp-2 mb-2 group-hover:text-emerald-400 transition-colors">
                          {product.name}
                        </h3>

                        {/* Instructor placeholder */}
                        <p className="text-xs text-slate-500 mb-3">By Expert Instructor</p>

                        {/* Stats */}
                        <div className="flex items-center gap-3 text-xs text-slate-500 mb-4 pb-3 border-b border-slate-700/30 flex-wrap">
                          <div className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            <span>{product.sold_count} enrolled</span>
                          </div>
                          {product.duration && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>{product.duration}h</span>
                            </div>
                          )}
                        </div>

                        {/* Price */}
                        <div className="mt-auto">
                          <div className="flex items-baseline gap-2 mb-3">
                            <span className="text-lg font-bold text-slate-100">
                              {formatCurrency(product.base_price)}
                            </span>
                            <span className="text-xs text-emerald-400 font-semibold">Lifetime access</span>
                          </div>

                          {/* Action Button */}
                          {isUnauthenticated ? (
                            <span
                              aria-disabled="true"
                              className="block w-full items-center justify-center rounded-lg border border-slate-700 bg-slate-800/40 text-slate-500 cursor-not-allowed py-2 text-xs font-semibold text-center"
                            >
                              Sign in to enroll
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
                              className="block w-full rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white py-2 text-xs font-bold text-center transition-colors"
                            >
                              View Details
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="col-span-full text-center py-20">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-slate-900 text-slate-700 mb-4">
                  <Package className="w-10 h-10" />
                </div>
                <p className="text-slate-300 text-lg font-medium mb-2">No courses found</p>
                <p className="text-slate-500 text-sm">Try adjusting your search</p>
              </div>
            )}
          </>
        )}
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
