'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Edit2, Trash2, Plus, Search, Package, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency, getImageUrl } from '@/utils/calculations';

interface Product {
  id: string;
  name: string;
  category: string;
  basePrice: number;
  finalPrice: number;
  soldCount: number;
  isActive: boolean;
  coverImage?: string;
  createdAt: string;
}

export default function VendorProductsPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!isLoading && user?.role !== 'vendor') {
      router.push('/');
    }
    if (user?.id) fetchProducts();
  }, [user, isLoading, router]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/products?vendorId=${user?.id}`);
      if (!res.ok) throw new Error('Failed to fetch products');
      const data = await res.json();
      const raw: any[] = Array.isArray(data) ? data : data.products ?? [];
      setProducts(
        raw.map((p) => ({
          id: p.id,
          name: p.name,
          category: p.category,
          basePrice: p.base_price ?? p.basePrice ?? 0,
          finalPrice: p.final_price ?? p.finalPrice ?? 0,
          soldCount: p.sold_count ?? p.soldCount ?? 0,
          isActive: p.is_active !== false,
          coverImage: p.images?.[0] ?? undefined,
          createdAt: p.created_at ?? p.createdAt ?? '',
        }))
      );
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setDeleting(true);
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete product');
      setProducts((prev) => prev.filter((p) => p.id !== id));
      setDeleteTarget(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setDeleting(false);
    }
  };

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) return null;
  if (!user || user.role !== 'vendor') return null;

  return (
    <div className="px-6 py-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Products</h1>
          <p className="text-sm text-gray-500 mt-1">
            {products.length} product{products.length !== 1 ? 's' : ''} listed
          </p>
        </div>
        <Link
          href="/vendor/add-product"
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-md transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Product
        </Link>
      </div>

      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg mb-5">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Search */}
      {products.length > 0 && (
        <div className="relative mb-6">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
          />
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center min-h-48">
          <div className="w-7 h-7 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 py-16 text-center">
          <Package className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">
            {search ? 'No products match your search' : 'No products listed yet'}
          </p>
          {!search && (
            <Link
              href="/vendor/add-product"
              className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-md transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add your first product
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-lg border border-gray-200 p-4 flex items-center gap-4 hover:border-gray-300 transition-colors"
            >
              {/* Thumbnail */}
              <div className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {getImageUrl(product.coverImage) ? (
                  <img
                    src={getImageUrl(product.coverImage)!}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Package className="w-6 h-6 text-gray-400" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-semibold text-gray-900 truncate">{product.name}</p>
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${
                      product.isActive
                        ? 'bg-green-50 text-green-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {product.isActive ? 'Live' : 'Draft'}
                  </span>
                </div>
                <p className="text-xs text-gray-400">{product.category}</p>
              </div>

              {/* Stats */}
              <div className="hidden sm:flex items-center gap-6 flex-shrink-0 text-center">
                <div>
                  <p className="text-sm font-bold text-gray-900">{formatCurrency(product.finalPrice)}</p>
                  <p className="text-xs text-gray-400">Price</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-700">{product.soldCount}</p>
                  <p className="text-xs text-gray-400">Sold</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <Link
                  href={`/vendor/products/${product.id}/edit`}
                  className="p-2 text-gray-400 hover:text-primary-500 hover:bg-primary-50 rounded-lg transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </Link>
                <button
                  onClick={() => setDeleteTarget(product.id)}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-sm w-full">
            <h3 className="text-base font-bold text-gray-900 mb-2">Delete product?</h3>
            <p className="text-sm text-gray-500 mb-5">
              This action cannot be undone. The product will be permanently removed from the
              marketplace.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 border border-gray-200 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteTarget)}
                disabled={deleting}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
