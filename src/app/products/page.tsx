'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ShoppingCart, ChevronDown, Star, Filter } from 'lucide-react';
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
      <div className="bg-white border-b border-gray-200 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Products</h1>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="md:hidden flex items-center gap-2 text-gray-600"
          >
            <Filter className="w-5 h-5" />
            Filters
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Sidebar Filters */}
          <div className={`${showFilters ? 'block' : 'hidden'} md:block md:col-span-1`}>
            <div className="bg-white rounded-lg p-6 space-y-6">
              {/* Category Filter */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Category</h3>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedCategory === ''}
                      onChange={() => setSelectedCategory('')}
                      className="w-4 h-4 text-primary"
                    />
                    <span className="ml-2 text-gray-700">All Categories</span>
                  </label>
                  {categories.map((cat) => (
                    <label key={cat} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedCategory === cat}
                        onChange={() => setSelectedCategory(cat)}
                        className="w-4 h-4 text-primary"
                      />
                      <span className="ml-2 text-gray-700">{cat}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Range Filter */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Price Range</h3>
                <div className="space-y-2">
                  <input
                    type="range"
                    min="0"
                    max="10000"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>{formatCurrency(priceRange[0])}</span>
                    <span>{formatCurrency(priceRange[1])}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="md:col-span-3">
            {/* Sort Options */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-gray-600">{products.length} products found</p>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="text-center py-12">
                <p className="text-gray-500">Loading products...</p>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-600">Error: {error}</p>
              </div>
            )}

            {/* Products Grid */}
            {!loading && !error && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.length > 0 ? (
                  products.map((product) => (
                    <div key={product.id} className="card hover:shadow-lg transition-shadow">
                      {/* Image */}
                      <div className="bg-gray-100 rounded-lg p-4 mb-4 h-40 flex items-center justify-center text-4xl">
                        {product.images?.[0] || '📦'}
                      </div>

                      {/* Details */}
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
                          {product.name}
                        </h3>
                        <p className="text-sm text-gray-500 mb-3 line-clamp-1">Category: {product.category}</p>

                        {/* Pricing */}
                        <div className="mb-3">
                          <div className="flex items-baseline gap-2">
                            <span className="text-xl font-bold text-gray-900">
                              {formatCurrency(product.final_price)}
                            </span>
                            <span className="text-sm text-gray-500 line-through">
                              {formatCurrency(product.base_price)}
                            </span>
                            <span className="badge badge-success text-xs">
                              {product.markup_percentage}% OFF
                            </span>
                          </div>
                        </div>

                        {/* Stock & Rating */}
                        <div className="flex items-center gap-4 mb-4 text-sm">
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-gray-700">{product.sold_count} sold</span>
                          </div>
                          <div className="text-gray-600">
                            {product.stock > 0 ? (
                              <span className="text-green-600 font-medium">In Stock</span>
                            ) : (
                              <span className="text-red-600 font-medium">Out of Stock</span>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="grid grid-cols-2 gap-2">
                          <Link
                            href={`/products/${product.id}`}
                            className="btn btn-outline text-center py-2"
                          >
                            View
                          </Link>
                          <button
                            onClick={() => handleAddToCart(product)}
                            disabled={product.stock === 0}
                            className="btn btn-primary flex items-center justify-center gap-2 py-2 disabled:opacity-50"
                          >
                            <ShoppingCart className="w-4 h-4" />
                            Cart
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-12">
                    <p className="text-gray-500 text-lg">No products found</p>
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
