'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Users,
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
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900 mb-1">Marketplace</h1>
        <p className="text-sm text-gray-500">
          Browse vendor products and add them to your store — earn 10% commission on every sale.
        </p>
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
        {(search || filterCategory) && (
          <button
            onClick={() => { setSearch(''); setFilterCategory(''); }}
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
          {filtered.map((product) => {
            const imgUrl = getImageUrl(product.images?.[0]);
            const commission = product.finalPrice * 0.1;

            return (
              <div
                key={product.id}
                className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:border-gray-300 transition-colors flex flex-col"
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
                    <div className="absolute top-2 right-2 flex items-center gap-1 bg-white/90 text-green-700 text-xs font-semibold px-2 py-0.5 rounded-full border border-green-200">
                      <CheckCircle2 className="w-3 h-3" />
                      In Store
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4 flex flex-col flex-1">
                  <div className="flex items-start gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2">
                        {product.name}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                      <Tag className="w-2.5 h-2.5" />
                      {product.category}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                      <Users className="w-2.5 h-2.5" />
                      {product.sellerCount} seller{product.sellerCount !== 1 ? 's' : ''}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between mb-1 mt-auto">
                    <span className="text-base font-semibold text-gray-900">
                      {formatCurrency(product.finalPrice || product.basePrice)}
                    </span>
                    <span className="text-xs text-gray-500">
                      Earn <span className="font-medium text-gray-700">{formatCurrency(commission)}</span>
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-400 mb-3">10% commission per sale</p>

                  {product.isSellerProduct ? (
                    <div className="flex items-center justify-center gap-1.5 w-full py-2 bg-gray-50 border border-gray-200 text-gray-500 text-sm rounded-md">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                      Added to your store
                    </div>
                  ) : (
                    <button
                      onClick={() => handleAddProduct(product.id)}
                      disabled={addingProducts.has(product.id)}
                      className="flex items-center justify-center gap-1.5 w-full py-2 bg-primary-500 hover:bg-primary-600 disabled:opacity-60 text-white text-sm font-medium rounded-md transition-colors"
                    >
                      {addingProducts.has(product.id) ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                          Adding...
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          Add to Store
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