'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  TrendingUp,
  ShoppingBag,
  DollarSign,
  AlertCircle,
  Search,
  Users,
  Package,
  BarChart3,
  Plus,
  X,
  ChevronRight,
  Copy,
  CheckCircle2,
} from 'lucide-react';
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
  sellerCount: number;
  isSellerProduct: boolean;
}

interface SellerProduct {
  id: string;
  productId: string;
  sellerId: string;
  product_name: string;
  description: string;
  base_price: number;
  final_price: number;
  stock: number;
  seller_markup_percentage: number;
  sold_count: number;
  clicks: number;
  earnings: number;
  images?: string[];
  category: string;
  referral_code: string;
  vendor_id: string;
  created_at: string;
}

interface SellerProductDetail {
  id: string;
  productId: string;
  sellerId: string;
  soldCount: number;
  Revenue: number;
  createdAt: string;
}

interface DashboardStats {
  totalProducts: number;
  totalSales: number;
  totalEarnings: number;
  activeListings: number;
  thisMonthEarnings: number;
  thisMonthSales: number;
  averageOrderValue: number;
}

export default function SellerDashboard() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  // Section state
  const [activeSection, setActiveSection] = useState<'products' | 'myStore' | 'dashboard'>('myStore');

  // Products section state
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productError, setProductError] = useState<string | null>(null);
  const [addingProducts, setAddingProducts] = useState<Set<string>>(new Set());

  // My Store section state
  const [sellerProducts, setSellerProducts] = useState<SellerProduct[]>([]);
  const [loadingSellerProducts, setLoadingSellerProducts] = useState(true);
  const [sellerProductError, setSellerProductError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Dashboard stats state
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalSales: 0,
    totalEarnings: 0,
    activeListings: 0,
    thisMonthEarnings: 0,
    thisMonthSales: 0,
    averageOrderValue: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [topProducts, setTopProducts] = useState<SellerProductDetail[]>([]);

  // Authentication check
  useEffect(() => {
    if (!isLoading && user?.role !== 'seller') {
      router.push('/');
      return;
    }

    if (user?.id) {
      fetchSellerProducts();
      fetchProductsData();
      fetchStatsData();
    }
  }, [user, isLoading, router]);

  // Filter products based on search and category
  useEffect(() => {
    let filtered = products;

    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filterCategory) {
      filtered = filtered.filter((p) => p.category === filterCategory);
    }

    setFilteredProducts(filtered);
  }, [searchQuery, filterCategory, products]);

  // GET seller's products with full details
  const fetchSellerProducts = async () => {
    try {
      setLoadingSellerProducts(true);
      setSellerProductError(null);

      const response = await fetch(`/api/seller-products?sellerId=${user?.id}`);
      if (!response.ok) throw new Error('Failed to fetch your products');

      const rawProducts = await response.json();
      const products = Array.isArray(rawProducts) ? rawProducts : [];
      
      setSellerProducts(products);
    } catch (err) {
      setSellerProductError((err as Error).message);
      console.error('Failed to fetch seller products:', err);
    } finally {
      setLoadingSellerProducts(false);
    }
  };

  // GET products with seller count
  const fetchProductsData = async () => {
    try {
      setLoadingProducts(true);
      setProductError(null);

      const response = await fetch(
        `/api/products/with-seller-count?isActive=true&sellerId=${user?.id}`
      );
      if (!response.ok) throw new Error('Failed to fetch products');

      const rawProducts = await response.json();
      
      // Transform snake_case API response to camelCase
      const transformedProducts = rawProducts.map((p: any) => ({
        id: p.id,
        name: p.name,
        category: p.category,
        description: p.description,
        basePrice: p.base_price || 0,
        finalPrice: p.final_price || 0,
        markup: p.markup || 0,
        markup_percentage: p.markup_percentage || 0,
        stock: p.stock || 0,
        sold_count: p.sold_count || 0,
        is_active: p.is_active,
        images: p.images || [],
        vendorId: p.vendor_id,
        sellerCount: p.sellerCount || 0,
        isSellerProduct: p.isSellerProduct || false,
      }));
      
      setProducts(transformedProducts);
      setFilteredProducts(transformedProducts);
    } catch (err) {
      setProductError((err as Error).message);
      console.error('Failed to fetch products:', err);
    } finally {
      setLoadingProducts(false);
    }
  };

  // GET seller stats data
  const fetchStatsData = async () => {
    try {
      setLoadingStats(true);
      setStatsError(null);

      const [ordersResponse, productsResponse] = await Promise.all([
        fetch(`/api/orders?sellerId=${user?.id}`),
        fetch(`/api/seller-products?sellerId=${user?.id}`),
      ]);

      let orders = [];
      if (ordersResponse.ok) {
        const data = await ordersResponse.json();
        const rawOrders = Array.isArray(data) ? data : data.orders || [];
        // Transform snake_case to camelCase
        orders = rawOrders.map((o: any) => ({
          sellerCommission: o.seller_commission || o.sellerCommission || 0,
          createdAt: o.created_at || o.createdAt,
        }));
      }

      let sellerProducts = [];
      if (productsResponse.ok) {
        const data = await productsResponse.json();
        const rawProducts = Array.isArray(data) ? data : data.products || [];
        // Transform snake_case to camelCase
        sellerProducts = rawProducts.map((p: any) => ({
          soldCount: p.sold_count || p.soldCount || 0,
        }));
      }

      // Calculate stats
      const totalEarnings = orders.reduce((sum: number, o: any) => sum + (o.sellerCommission || 0), 0);
      const totalSales = sellerProducts.reduce((sum: number, p: any) => sum + (p.soldCount || 0), 0);

      const now = new Date();
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const thisMonthSales = orders.filter((o: any) => new Date(o.createdAt) >= thisMonthStart).length;
      const thisMonthEarnings = orders
        .filter((o: any) => new Date(o.createdAt) >= thisMonthStart)
        .reduce((sum: number, o: any) => sum + (o.sellerCommission || 0), 0);

      const averageOrderValue = orders.length > 0 ? totalEarnings / orders.length : 0;

      setStats({
        totalProducts: sellerProducts.length,
        totalSales,
        totalEarnings,
        activeListings: sellerProducts.length,
        thisMonthEarnings,
        thisMonthSales,
        averageOrderValue,
      });

      // Top products
      const sorted = [...sellerProducts].sort((a: any, b: any) => (b.soldCount || 0) - (a.soldCount || 0));
      setTopProducts(sorted.slice(0, 5));
    } catch (err) {
      setStatsError((err as Error).message);
      console.error('Failed to fetch stats:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  // Handle adding product to seller store
  const handleAddProduct = async (productId: string) => {
    try {
      setAddingProducts((prev) => new Set([...prev, productId]));

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
          productId,
          referralCode,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add product');
      }

      // Update products to reflect the change
      setProducts((prev) =>
        prev.map((p) =>
          p.id === productId ? { ...p, isSellerProduct: true, sellerCount: p.sellerCount + 1 } : p
        )
      );
      setFilteredProducts((prev) =>
        prev.map((p) =>
          p.id === productId ? { ...p, isSellerProduct: true, sellerCount: p.sellerCount + 1 } : p
        )
      );

      // Refresh seller products to show in My Store
      await fetchSellerProducts();

      // Switch to My Store tab and close modal
      setActiveSection('myStore');
      setSelectedProduct(null);
    } catch (err) {
      setProductError((err as Error).message);
      console.error('Failed to add product:', err);
    } finally {
      setAddingProducts((prev) => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }
  };

  const categories = Array.from(new Set(products.map((p) => p.category)));

  // Copy referral code to clipboard
  const copyReferralCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Seller Dashboard</h1>
              <p className="text-gray-600 mt-1">Manage your products and track performance</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setActiveSection('myStore')}
                className={`px-6 py-2 rounded-lg font-medium transition ${
                  activeSection === 'myStore'
                    ? 'bg-primary text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <ShoppingBag className="inline w-4 h-4 mr-2" />
                My Store
              </button>
              <button
                onClick={() => setActiveSection('products')}
                className={`px-6 py-2 rounded-lg font-medium transition ${
                  activeSection === 'products'
                    ? 'bg-primary text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <ShoppingBag className="inline w-4 h-4 mr-2" />
                Available Products
              </button>
              <button
                onClick={() => setActiveSection('dashboard')}
                className={`px-6 py-2 rounded-lg font-medium transition ${
                  activeSection === 'dashboard'
                    ? 'bg-primary text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <BarChart3 className="inline w-4 h-4 mr-2" />
                Dashboard & Stats
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* MY STORE SECTION */}
        {activeSection === 'myStore' && (
          <div>
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">My Store</h2>
              <p className="text-gray-600 mb-6">Products you've added to your store with unique referral codes for tracking</p>
            </div>

            {loadingSellerProducts ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-gray-600">Loading your products...</p>
              </div>
            ) : sellerProductError ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2 mb-6">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <p className="text-red-700">{sellerProductError}</p>
              </div>
            ) : sellerProducts.length === 0 ? (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
                <ShoppingBag className="w-12 h-12 text-blue-400 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Products in Your Store</h3>
                <p className="text-gray-600 mb-4">Browse available products and add them to start selling</p>
                <button
                  onClick={() => setActiveSection('products')}
                  className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90 transition inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Products
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sellerProducts.map((product) => (
                  <div key={product.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition overflow-hidden">
                    {/* Product Image */}
                    <div className="w-full h-48 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center text-3xl">
                      {product.images && product.images[0] ? product.images[0] : '📦'}
                    </div>

                    {/* Product Info */}
                    <div className="p-4 space-y-4">
                      <div>
                        <h3 className="font-semibold text-gray-900 text-lg line-clamp-2">{product.product_name}</h3>
                        <p className="text-sm text-gray-600 mt-1">{product.category}</p>
                      </div>

                      {/* Price Section */}
                      <div className="flex items-baseline gap-2 border-t pt-3">
                        <p className="text-2xl font-bold text-primary">{formatCurrency(product.base_price)}</p>
                        <p className="text-sm text-gray-500">Base Price</p>
                      </div>

                      {/* Referral Code Section */}
                      <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                        <p className="text-xs font-semibold text-gray-700 uppercase">Your Referral Code</p>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 bg-white px-3 py-2 rounded border border-gray-200 font-mono text-sm text-gray-900">
                            {product.referral_code}
                          </code>
                          <button
                            onClick={() => copyReferralCode(product.referral_code)}
                            className="bg-primary text-white p-2 rounded hover:bg-primary/90 transition"
                            title="Copy referral code"
                          >
                            {copiedCode === product.referral_code ? (
                              <CheckCircle2 className="w-4 h-4" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                        <p className="text-xs text-gray-600">Share this code to track referrals and earn commission</p>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-2 text-sm border-t pt-3">
                        <div className="bg-gray-50 rounded p-2 text-center">
                          <p className="text-gray-600 text-xs">Sales</p>
                          <p className="font-bold text-green-600">{product.sold_count || 0}</p>
                        </div>
                        <div className="bg-gray-50 rounded p-2 text-center">
                          <p className="text-gray-600 text-xs">Clicks</p>
                          <p className="font-bold text-blue-600">{product.clicks || 0}</p>
                        </div>
                        <div className="bg-gray-50 rounded p-2 text-center">
                          <p className="text-gray-600 text-xs">Earned</p>
                          <p className="font-bold text-purple-600">{formatCurrency(product.earnings || 0)}</p>
                        </div>
                      </div>

                      {/* Stock Info */}
                      <div className="flex items-center justify-between text-sm bg-gray-50 rounded p-2">
                        <span className="text-gray-600">Stock Available:</span>
                        <span className={`font-semibold ${product.stock > 10 ? 'text-green-600' : product.stock > 0 ? 'text-orange-600' : 'text-red-600'}`}>
                          {product.stock} units
                        </span>
                      </div>

                      {/* Actions */}
                      <Link
                        href={`/seller/dashboard/products/${product.id}`}
                        className="block text-center bg-gray-100 text-gray-900 py-2 rounded-lg hover:bg-gray-200 transition font-medium text-sm"
                      >
                        View Details →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeSection === 'products' && (
          <div>
            {/* Products Header */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Browse & Add Products to Your Store</h2>

              {/* Search and Filter */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
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
              </div>
            </div>

            {/* Products Grid */}
            {loadingProducts ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-gray-600">Loading products...</p>
              </div>
            ) : productError ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <p className="text-red-700">{productError}</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No products found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className="bg-white rounded-lg shadow-sm hover:shadow-md transition cursor-pointer"
                    onClick={() => setSelectedProduct(product)}
                  >
                    <div className="p-4 border-b">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-gray-900 flex-1">{product.name}</h3>
                        {product.isSellerProduct && (
                          <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">
                            ✓ Added
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{product.category}</p>
                    </div>

                    <div className="p-4 space-y-3">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Base Price</p>
                        <p className="text-xl font-bold text-primary">
                          {formatCurrency(product.basePrice)}
                        </p>
                      </div>

                      <div className="flex items-center gap-4 pt-2 border-t">
                        <div className="flex-1">
                          <p className="text-xs text-gray-500 mb-1">Sellers</p>
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4 text-blue-600" />
                            <span className="font-semibold text-gray-900">{product.sellerCount}</span>
                            <span className="text-xs text-gray-600">selling</span>
                          </div>
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-gray-500 mb-1">Stock</p>
                          <p className="font-semibold text-gray-900">{product.stock} units</p>
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedProduct(product);
                        }}
                        className="w-full mt-2 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition font-medium text-sm"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SECTION 2: Dashboard & Stats */}
        {activeSection === 'dashboard' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Your Performance Metrics</h2>

            {loadingStats ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-gray-600">Loading your stats...</p>
              </div>
            ) : statsError ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <p className="text-red-700">{statsError}</p>
              </div>
            ) : (
              <>
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-600 text-sm mb-1">Active Products</p>
                        <p className="text-3xl font-bold text-gray-900">{stats.activeListings}</p>
                      </div>
                      <ShoppingBag className="w-10 h-10 text-blue-500 opacity-20" />
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-500">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-600 text-sm mb-1">Total Sales</p>
                        <p className="text-3xl font-bold text-gray-900">{stats.totalSales}</p>
                      </div>
                      <TrendingUp className="w-10 h-10 text-green-500 opacity-20" />
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-purple-500">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-600 text-sm mb-1">Total Earnings</p>
                        <p className="text-3xl font-bold text-gray-900">{formatCurrency(stats.totalEarnings)}</p>
                      </div>
                      <DollarSign className="w-10 h-10 text-purple-500 opacity-20" />
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-orange-500">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-600 text-sm mb-1">Avg Order Value</p>
                        <p className="text-3xl font-bold text-gray-900">
                          {formatCurrency(stats.averageOrderValue)}
                        </p>
                      </div>
                      <DollarSign className="w-10 h-10 text-orange-500 opacity-20" />
                    </div>
                  </div>
                </div>

                {/* This Month Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">This Month</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Orders</span>
                        <span className="text-2xl font-bold text-gray-900">{stats.thisMonthSales}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Earnings</span>
                        <span className="text-2xl font-bold text-green-600">
                          {formatCurrency(stats.thisMonthEarnings)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Commission Info</h3>
                    <div className="space-y-3 text-sm">
                      <p className="text-gray-600">
                        You earn <span className="font-semibold text-green-600">10%</span> commission on all sales
                      </p>
                      <Link href="/seller/earnings" className="text-blue-600 hover:text-blue-700 font-medium">
                        Manage Payouts →
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Top Products */}
                {topProducts.length > 0 && (
                  <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
                    <h3 className="font-semibold text-gray-900 mb-4">Your Top Selling Products</h3>
                    <div className="space-y-3">
                      {topProducts.map((product, index) => (
                        <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3 flex-1">
                            <span className="text-gray-600 font-medium">#{index + 1}</span>
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">Product ID: {product.productId}</p>
                              <p className="text-sm text-gray-600">{product.soldCount} units sold</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-green-600">{formatCurrency(product.Revenue)}</p>
                            <p className="text-xs text-gray-600">earned (10%)</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick Links */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Link
                    href="/seller/sales"
                    className="bg-blue-50 hover:bg-blue-100 rounded-lg p-4 transition flex items-center justify-between"
                  >
                    <span className="font-medium text-gray-900">View Sales</span>
                    <ChevronRight className="w-5 h-5 text-blue-600" />
                  </Link>
                  <Link
                    href="/seller/earnings"
                    className="bg-green-50 hover:bg-green-100 rounded-lg p-4 transition flex items-center justify-between"
                  >
                    <span className="font-medium text-gray-900">Manage Earnings</span>
                    <ChevronRight className="w-5 h-5 text-green-600" />
                  </Link>
                  <Link
                    href="/seller/settings"
                    className="bg-purple-50 hover:bg-purple-100 rounded-lg p-4 transition flex items-center justify-between"
                  >
                    <span className="font-medium text-gray-900">Settings</span>
                    <ChevronRight className="w-5 h-5 text-purple-600" />
                  </Link>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Product Details</h2>
              <button
                onClick={() => setSelectedProduct(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Info Notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-blue-900 mb-1">View Only - Vendor Information</h4>
                    <p className="text-sm text-blue-800">
                      All product details are set by the vendor and cannot be edited. You can add this product to your store to earn 10% commission on sales.
                    </p>
                  </div>
                </div>
              </div>

              {/* Product Info */}
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{selectedProduct.name}</h3>
                <p className="text-gray-600 mb-4">{selectedProduct.description}</p>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Category</p>
                    <p className="font-semibold text-gray-900">{selectedProduct.category}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Base Price</p>
                    <p className="text-2xl font-bold text-primary">{formatCurrency(selectedProduct.basePrice)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Final Price (Customer)</p>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(selectedProduct.finalPrice)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Stock Available</p>
                    <p className="text-2xl font-bold text-gray-900">{selectedProduct.stock} units</p>
                  </div>
                </div>
              </div>

              {/* Seller Count */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center gap-3">
                  <Users className="w-6 h-6 text-blue-600" />
                  <div>
                    <p className="font-semibold text-gray-900">{selectedProduct.sellerCount} Sellers</p>
                    <p className="text-sm text-gray-600">currently selling this product</p>
                  </div>
                </div>
              </div>

              {/* Commission Info */}
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <p className="text-sm text-gray-600 mb-2">Your Earnings When Selling This Product:</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-green-600">10%</span>
                  <span className="text-gray-600">of the final customer price</span>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  Example: If customer pays {formatCurrency(selectedProduct.finalPrice)}, you earn{' '}
                  {formatCurrency((selectedProduct.finalPrice * 0.1))}
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t p-6 flex gap-3">
              <button
                onClick={() => setSelectedProduct(null)}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-100 transition"
              >
                Close
              </button>
              {selectedProduct.isSellerProduct ? (
                <button
                  disabled
                  className="flex-1 px-4 py-3 bg-gray-300 text-gray-600 rounded-lg font-medium cursor-not-allowed flex items-center justify-center gap-2"
                >
                  ✓ Already Added to Your Store
                </button>
              ) : (
                <button
                  onClick={() => handleAddProduct(selectedProduct.id)}
                  disabled={addingProducts.has(selectedProduct.id)}
                  className="flex-1 px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {addingProducts.has(selectedProduct.id) ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5" />
                      Add to Your Store
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
