'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Edit2, Trash2, Plus } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency } from '@/utils/calculations';

interface Product {
  id: string;
  name: string;
  category: string;
  basePrice: number;
  finalPrice: number;
  stock: number;
  soldCount?: number;
  images?: string[];
  vendorId: string;
  createdAt: string;
}

export default function VendorProductsPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [sortBy, setSortBy] = useState<'recent' | 'price' | 'stock'>('recent');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!isLoading && user?.role !== 'vendor') {
      router.push('/');
      return;
    }

    if (user?.id) {
      fetchProducts();
    }
  }, [user, isLoading, router]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/products?vendorId=${user?.id}`);
      if (!response.ok) throw new Error('Failed to fetch products');

      const data = await response.json();
      const products = Array.isArray(data) ? data : data.products || [];
      
      // Transform snake_case API response to camelCase
      const transformedProducts = products.map((p: any) => ({
        id: p.id,
        name: p.name,
        category: p.category,
        basePrice: p.base_price || 0,
        finalPrice: p.final_price || 0,
        stock: p.stock || 0,
        soldCount: p.sold_count || 0,
        images: p.images || [],
        vendorId: p.vendor_id,
        createdAt: p.created_at || new Date().toISOString(),
      }));
      
      setProducts(transformedProducts);
    } catch (err) {
      setError((err as Error).message);
      console.error('Failed to fetch products:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (productId: string) => {
    try {
      setDeleting(true);
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete product');

      setProducts(products.filter((p) => p.id !== productId));
      setDeleteConfirm(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setDeleting(false);
    }
  };

  const filteredProducts = products
    .filter((p) => !filterCategory || p.category === filterCategory)
    .sort((a, b) => {
      if (sortBy === 'price') return b.basePrice - a.basePrice;
      if (sortBy === 'stock') return b.stock - a.stock;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const categories = Array.from(new Set(products.map((p) => p.category)));

  const totalStockValue = products.reduce((sum, p) => sum + p.basePrice * p.stock, 0);
  const totalSold = products.reduce((sum, p) => sum + (p.soldCount || 0), 0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!user || user.role !== 'vendor') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Unauthorized access</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/vendor/dashboard" className="text-primary hover:underline mb-2 inline-block">
              ← Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Your Products</h1>
            <p className="text-gray-600">Manage and monitor your product listings</p>
          </div>
          <Link href="/vendor/add-product" className="btn btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Add Product
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Total Products</p>
            <p className="text-2xl font-bold text-gray-900">{products.length}</p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Total Sold</p>
            <p className="text-2xl font-bold text-green-600">{totalSold}</p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Stock Value</p>
            <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalStockValue)}</p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Avg Base Price</p>
            <p className="text-2xl font-bold text-purple-600">
              {products.length > 0
                ? formatCurrency(products.reduce((sum, p) => sum + p.basePrice, 0) / products.length)
                : '₹0'}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg p-4 mb-6 flex gap-4 items-center flex-wrap">
          {categories.length > 0 && (
            <div>
              <label className="text-sm font-semibold text-gray-700 mr-2">Category:</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="text-sm font-semibold text-gray-700 mr-2">Sort By:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="recent">Most Recent</option>
              <option value="price">Price (High to Low)</option>
              <option value="stock">Stock (High to Low)</option>
            </select>
          </div>

          <div className="ml-auto text-sm text-gray-600">
            Showing {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Products Table */}
        {loading ? (
          <div className="bg-white rounded-lg p-8 text-center">
            <p className="text-gray-500">Loading products...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-white rounded-lg p-12 text-center">
            <p className="text-gray-500 mb-4">No products found</p>
            <Link href="/vendor/add-product" className="btn btn-primary">
              Add Your First Product
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Product</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Category</th>
                    <th className="px-6 py-3 text-right font-semibold text-gray-700">Base Price / Final Price</th>
                    <th className="px-6 py-3 text-right font-semibold text-gray-700">Stock</th>
                    <th className="px-6 py-3 text-right font-semibold text-gray-700">Sold</th>
                    <th className="px-6 py-3 text-center font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                            {product.images?.[0] ? (
                              product.images[0].startsWith('data:image') ? (
                                <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-2xl">{product.images[0]}</span>
                              )
                            ) : (
                              <span className="text-2xl">📦</span>
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 max-w-xs truncate">{product.name}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(product.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-700">{product.category}</td>
                      <td className="px-6 py-4 text-right">
                        <div>
                          <p className="font-semibold text-gray-900">{formatCurrency(product.basePrice)}</p>
                          <p className="text-xs text-gray-500">{formatCurrency(product.finalPrice)} final</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-gray-900">
                        <span className={product.stock > 10 ? 'text-green-600' : product.stock > 0 ? 'text-yellow-600' : 'text-red-600'}>
                          {product.stock} units
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-gray-700">{product.soldCount || 0}</td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-2">
                          <Link
                            href={`/vendor/products/${product.id}/edit`}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit product"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Link>

                          <button
                            onClick={() => setDeleteConfirm(product.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Product</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this product? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={deleting}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
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
