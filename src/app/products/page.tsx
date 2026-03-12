'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ShoppingCart, ChevronDown, Star, Filter, Package } from 'lucide-react';
import { formatCurrency, getImageUrl } from '@/utils/calculations';

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
  vendor_id: string;
  created_at: string;
}

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.get('category') || '');
  const [sortBy, setSortBy] = useState('relevance');
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [showFilters, setShowFilters] = useState(false);

  const categories = [
    'Electronics',
    'Fashion',
    'Home Appliances',
    'Services',
    'Education',
    'Healthcare',
    'Books',
    'Other',
  ];

  const sortOptions = [
    { value: 'relevance', label: 'Relevance' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'rating', label: 'Rating' },
    { value: 'newest', label: 'Newest' },
  ];

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams();
        if (selectedCategory) {
          params.append('category', selectedCategory);
        }
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

        // Filter by price range
        filtered = filtered.filter(
          (p: Product) => p.final_price >= priceRange[0] && p.final_price <= priceRange[1]
        );

        // Sort products
        if (sortBy === 'price-low') {
          filtered.sort((a: Product, b: Product) => a.final_price - b.final_price);
        } else if (sortBy === 'price-high') {
          filtered.sort((a: Product, b: Product) => b.final_price - a.final_price);
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
  }, [selectedCategory, sortBy, priceRange]);

  const handleAddToCart = (product: Product) => {
    try {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      const existingItem = cart.find((item: any) => item.id === product.id);

      if (existingItem) {
        existingItem.quantity += 1;
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

      localStorage.setItem('cart', JSON.stringify(cart));
      alert('Product added to cart!');
    } catch (error) {
      console.error('Failed to add to cart:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-16 z-40 shadow-soft">
        <div className="container-custom py-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Discover Products</h1>
            <p className="text-gray-600 mt-1">Browse our curated collection of quality products</p>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="md:hidden btn-outline flex items-center gap-2"
          >
            <Filter className="w-5 h-5" />
            Filters
          </button>
        </div>
      </div>

      <div className="container-custom py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Sidebar Filters */}
          <div className={`${showFilters ? 'block' : 'hidden'} md:block md:col-span-1`}>
            <div className="card p-6 space-y-6 sticky top-32">
              {/* Category Filter */}
              <div>
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Filter className="w-4 h-4 text-primary-500" />
                  Category
                </h3>
                <div className="space-y-2.5">
                  <label className="flex items-center group cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedCategory === ''}
                      onChange={() => setSelectedCategory('')}
                      className="w-4 h-4 text-primary-500 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <span className="ml-3 text-sm text-gray-700 group-hover:text-gray-900 transition-colors">All Categories</span>
                  </label>
                  {categories.map((cat) => (
                    <label key={cat} className="flex items-center group cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedCategory === cat}
                        onChange={() => setSelectedCategory(cat)}
                        className="w-4 h-4 text-primary-500 border-gray-300 rounded focus:ring-primary-500"
                      />
                      <span className="ml-3 text-sm text-gray-700 group-hover:text-gray-900 transition-colors">{cat}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="divider"></div>

              {/* Price Range Filter */}
              <div>
                <h3 className="font-bold text-gray-900 mb-4">Price Range</h3>
                <div className="space-y-3">
                  <input
                    type="range"
                    min="0"
                    max="10000"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-500"
                  />
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-gray-900">{formatCurrency(priceRange[0])}</span>
                    <span className="text-sm font-semibold text-primary-600">{formatCurrency(priceRange[1])}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="md:col-span-3">
            {/* Sort Options */}
            <div className="flex items-center justify-between mb-6 bg-white rounded-xl p-4 shadow-soft border border-gray-100">
              <p className="text-gray-600 font-medium">
                <span className="text-gray-900 font-bold">{products.length}</span> products found
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
                {products.length > 0 ? (
                  products.map((product) => (
                    <div key={product.id} className="card-interactive group">
                      {/* Image */}
                      <div className="relative">
                        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-t-xl h-52 flex items-center justify-center overflow-hidden group-hover:scale-105 transition-transform duration-300">
                          {getImageUrl(product.images?.[0]) ? (
                            <img
                              src={getImageUrl(product.images?.[0])!}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-5xl">📦</span>
                          )}
                        </div>
                        {product.markup_percentage > 0 && (
                          <div className="absolute top-3 right-3 badge-error font-bold shadow-sm">
                            {product.markup_percentage}% OFF
                          </div>
                        )}
                      </div>

                      {/* Details */}
                      <div className="p-5 space-y-3">
                        <div>
                          <h3 className="font-bold text-gray-900 mb-1 line-clamp-2 group-hover:text-primary-600 transition-colors">
                            {product.name}
                          </h3>
                          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{product.category}</p>
                        </div>

                        {/* Pricing */}
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-bold text-gray-900">
                            {formatCurrency(product.final_price)}
                          </span>
                          {product.base_price !== product.final_price && (
                            <span className="text-sm text-gray-500 line-through">
                              {formatCurrency(product.base_price)}
                            </span>
                          )}
                        </div>

                        {/* Stock & Rating */}
                        <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-100">
                          <div className="flex items-center gap-1.5">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-gray-700 font-semibold">{product.sold_count} sold</span>
                          </div>
                          <div>
                            {product.stock > 0 ? (
                              <span className="badge-success text-xs">In Stock</span>
                            ) : (
                              <span className="badge-error text-xs">Out of Stock</span>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="grid grid-cols-2 gap-2 pt-2">
                          <Link
                            href={`/products/${product.id}`}
                            className="btn-outline text-center py-2.5 text-sm"
                          >
                            View Details
                          </Link>
                          <button
                            onClick={() => handleAddToCart(product)}
                            disabled={product.stock === 0}
                            className="btn-primary flex items-center justify-center gap-2 py-2.5 text-sm disabled:opacity-50"
                          >
                            <ShoppingCart className="w-4 h-4" />
                            Add
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-20">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gray-100 text-gray-400 mb-4">
                      <Package className="w-10 h-10" />
                    </div>
                    <p className="text-gray-500 text-lg font-medium">No products found</p>
                    <p className="text-gray-400 text-sm mt-2">Try adjusting your filters</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
