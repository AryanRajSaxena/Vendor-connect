'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  AlertCircle,
  Plus,
  CheckCircle2,
  Tag,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency, getImageUrl } from '@/utils/calculations';

interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  basePrice: number;
  finalPrice: number;
  images?: string[];
  sellerCount: number;
  isSellerProduct: boolean;
}

const categoryGradient = (category: string) => {
  const map: Record<string, string> = {
    'Course': 'from-violet-100 to-purple-50',
    'Ebook': 'from-sky-100 to-blue-50',
    'Template': 'from-teal-100 to-emerald-50',
    'Software': 'from-orange-100 to-amber-50',
    'Design': 'from-pink-100 to-rose-50',
    'Music': 'from-indigo-100 to-blue-50',
    'Video': 'from-red-100 to-orange-50',
  };
  return map[category] || 'from-gray-100 to-gray-50';
};

export default function SellerMarketplacePage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [sortBy, setSortBy] = useState<'featured' | 'high-commission' | 'price-low' | 'price-high'>('featured');
  const [addingProducts, setAddingProducts] = useState<Set<string>>(new Set());
  const [addError, setAddError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && user?.role !== 'seller') {
      router.push('/');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user?.id) {
      fetchProducts();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`/api/products/with-seller-count?isActive=true&sellerId=${user!.id}`);
      if (!res.ok) throw new Error('Failed to fetch products');

      const raw = await res.json();
      const data = (Array.isArray(raw) ? raw : raw.products || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        category: p.category || '',
        description: p.description || '',
        basePrice: p.base_price || 0,
        finalPrice: p.final_price || 0,
        images: p.images || [],
        sellerCount: p.sellerCount || 0,
        isSellerProduct: p.isSellerProduct || false,
      }));

      setProducts(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async (productId: string) => {
    try {
      setAddingProducts((prev) => new Set([...prev, productId]));
      setAddError(null);

      const shortSellerId = (user!.id).substring(0, 6);
      const shortProductId = productId.substring(0, 6);
      const rand = Math.random().toString(36).substring(2, 5).toUpperCase();
      const referralCode = `${shortSellerId}${shortProductId}${rand}`.substring(0, 20);

      const res = await fetch('/api/seller-products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sellerId: user!.id, productId, referralCode }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to add product');
      }

      setProducts((prev) =>
        prev.map((p) =>
          p.id === productId
            ? { ...p, isSellerProduct: true, sellerCount: p.sellerCount + 1 }
            : p
        )
      );
    } catch (err) {
      setAddError((err as Error).message);
    } finally {
      setAddingProducts((prev) => {
        const s = new Set(prev);
        s.delete(productId);
        return s;
      });
    }
  };

  const categories = Array.from(new Set(products.map((p) => p.category).filter(Boolean)));

  const filtered = products.filter((p) => {
    const q = search.toLowerCase();
    const matchSearch = !q || p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
    const matchCategory = !filterCategory || p.category === filterCategory;
    return matchSearch && matchCategory;
  });

  const sortedProducts = [...filtered].sort((a, b) => {
    const aPrice = a.finalPrice || a.basePrice;
    const bPrice = b.finalPrice || b.basePrice;
    const aCommission = aPrice * 0.1;
    const bCommission = bPrice * 0.1;

    if (sortBy === 'high-commission') return bCommission - aCommission;
    if (sortBy === 'price-low') return aPrice - bPrice;
    if (sortBy === 'price-high') return bPrice - aPrice;

    // featured: prioritize products not yet added + higher commission potential
    if (a.isSellerProduct !== b.isSellerProduct) {
      return a.isSellerProduct ? 1 : -1;
    }
    return bCommission - aCommission;
  });

  const estimatedTotalCommission = sortedProducts.reduce(
    (sum, p) => sum + ((p.finalPrice || p.basePrice) * 0.1),
    0
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || user.role !== 'seller') return null;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6 border-b border-gray-200 pb-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-500">Seller Growth Hub</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-gray-900">Turn product picks into steady income</h1>
            <p className="mt-1 text-sm text-gray-600">
              Choose high-performing products, add them in seconds, and grow your commission with every sale.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-700">
              <span className="font-semibold text-gray-900">{sortedProducts.length}</span> visible products
            </div>
            <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs text-emerald-800">
              potential: <span className="font-bold">{formatCurrency(estimatedTotalCommission)}</span>
            </div>
          </div>
        </div>
        <div className="mt-4 h-px w-full bg-gradient-to-r from-emerald-300/60 to-transparent" />
      </div>

      {/* Add error */}
      {addError && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg mb-5 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {addError}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-3.5 mb-5 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 text-gray-700"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'featured' | 'high-commission' | 'price-low' | 'price-high')}
          className="px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 text-gray-700"
        >
          <option value="featured">Featured (Best to Add)</option>
          <option value="high-commission">Highest Commission</option>
          <option value="price-low">Price: Low to High</option>
          <option value="price-high">Price: High to Low</option>
        </select>
        {(search || filterCategory) && (
          <button
            onClick={() => { setSearch(''); setFilterCategory(''); setSortBy('featured'); }}
            className="text-xs text-gray-400 hover:text-gray-700 px-2 py-1 rounded transition-colors"
          >
            Clear
          </button>
        )}
        <span className="ml-auto text-xs text-gray-400">
          {filtered.length} product{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 py-16 text-center">
          <Search className="w-8 h-8 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400">No products found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedProducts.map((product) => {
            const imgUrl = getImageUrl(product.images?.[0]);
            const price = product.finalPrice || product.basePrice;
            const commission = price * 0.1;
            const projectedFiveSales = commission * 5;

            return (
              <div
                key={product.id}
                className="rounded-xl border border-slate-700/80 bg-slate-900/80 overflow-hidden hover:border-emerald-400/50 hover:shadow-[0_10px_30px_rgba(16,185,129,0.08)] transition-all duration-200 flex flex-col"
              >
                {/* Cover */}
                <div
                  className={`h-36 bg-gradient-to-br ${categoryGradient(product.category)} flex-shrink-0 overflow-hidden relative`}
                >
                  {imgUrl ? (
                    <img
                      src={imgUrl}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : null}
                  {product.isSellerProduct && (
                    <div className="absolute top-2 right-2 flex items-center gap-1 bg-emerald-200/95 text-emerald-900 text-xs font-semibold px-2 py-0.5 rounded-full border border-emerald-300">
                      <CheckCircle2 className="w-3 h-3" />
                      In Store
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4 flex flex-col flex-1">
                  <div className="flex items-start gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-lg font-semibold text-slate-100 leading-snug line-clamp-2">
                        {product.name}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    <span className="inline-flex items-center gap-1 text-xs text-slate-300 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">
                      <Tag className="w-2.5 h-2.5" />
                      {product.category}
                    </span>
                  </div>

                  <div className="mt-auto mb-3 rounded-xl border border-emerald-400/25 bg-gradient-to-b from-emerald-500/10 to-emerald-600/5 p-3.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-medium text-slate-400">Selling Price</span>
                      <span className="text-lg font-bold text-slate-200 tabular-nums">
                        {formatCurrency(price)}
                      </span>
                    </div>
                    <div className="mt-3 rounded-lg border border-emerald-400/25 bg-emerald-400/5 px-2.5 py-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-emerald-300">Your Commission</span>
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-emerald-400">per sale</span>
                      </div>
                      <p className="mt-1 text-2xl font-black tracking-tight text-emerald-300 tabular-nums [text-shadow:0_0_6px_rgba(52,211,153,0.22),0_0_12px_rgba(16,185,129,0.12)]">
                        {formatCurrency(commission)}
                      </p>
                    </div>
                    <div className="mt-2.5 flex items-center justify-between rounded-md bg-slate-900/60 border border-slate-700 px-2.5 py-1.5">
                      <span className="text-[11px] font-medium text-slate-400">If you sell 5 units</span>
                      <span className="text-sm font-bold text-emerald-300 tabular-nums">{formatCurrency(projectedFiveSales)}</span>
                    </div>
                  </div>

                  {product.isSellerProduct ? (
                    <div className="flex items-center justify-center gap-1.5 w-full py-2 bg-slate-900 border border-slate-700 text-slate-300 text-sm rounded-md">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      Added to your store
                    </div>
                  ) : (
                    <button
                      onClick={() => handleAddProduct(product.id)}
                      disabled={addingProducts.has(product.id)}
                      className="flex items-center justify-center gap-1.5 w-full py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-semibold rounded-md transition-colors"
                    >
                      {addingProducts.has(product.id) ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                          Adding...
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          Add & Start Earning
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}