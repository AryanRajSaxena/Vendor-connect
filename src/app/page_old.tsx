'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, ShoppingCart, Lock, RotateCcw, Star, Package } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

export default function HomePage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  // Redirect non-customer users to their dashboards
  useEffect(() => {
    if (!isLoading && user) {
      switch (user.role) {
        case 'vendor':
          router.push('/vendor/dashboard');
          return;
        case 'seller':
          router.push('/seller/dashboard');
          return;
        case 'admin':
          router.push('/admin/dashboard');
          return;
      }
    }
  }, [user, isLoading, router]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const categories = [
    { name: 'Electronics', icon: '🔌', color: 'bg-blue-100' },
    { name: 'Fashion', icon: '👕', color: 'bg-pink-100' },
    { name: 'Home Appliances', icon: '🏠', color: 'bg-orange-100' },
    { name: 'Services', icon: '💼', color: 'bg-green-100' },
    { name: 'Education', icon: '📚', color: 'bg-purple-100' },
    { name: 'Healthcare', icon: '⚕️', color: 'bg-red-100' },
    { name: 'Books', icon: '📖', color: 'bg-yellow-100' },
    { name: 'Other', icon: '📦', color: 'bg-gray-100' },
  ];

  const featuredProducts = [
    { id: 1, name: 'Wireless Earbuds', price: 2500, originalPrice: 3000, image: '🎧', rating: 4.5 },
    { id: 2, name: 'USB-C Cable', price: 500, originalPrice: 800, image: '🔌', rating: 4.2 },
    { id: 3, name: 'Phone Stand', price: 800, originalPrice: 1200, image: '📱', rating: 4.7 },
    { id: 4, name: 'Laptop Bag', price: 1500, originalPrice: 2200, image: '👜', rating: 4.4 },
  ];

  const trustBadges = [
    { icon: Lock, label: 'Secure Payment', desc: 'SSL Encrypted' },
    { icon: RotateCcw, label: 'Easy Returns', desc: '7-day return period' },
    { icon: Package, label: 'Fast Delivery', desc: 'Quick shipping' },
  ];

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary to-secondary text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-5xl font-bold mb-4">Welcome to VendorConnect</h1>
          <p className="text-xl mb-8 opacity-90">
            Discover thousands of products from trusted vendors and sellers
          </p>

          {/* Search Bar */}
          <div className="relative max-w-2xl">
            <Search className="absolute left-4 top-4 w-6 h-6 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for products..."
              className="w-full pl-14 pr-4 py-3 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-white"
            />
            <Link href={`/products?search=${searchQuery}`}>
              <button className="absolute right-2 top-2 bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-md transition">
                Search
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <h2 className="text-3xl font-bold mb-8">Shop by Category</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.name}
              href={`/products?category=${cat.name}`}
              className={`${cat.color} p-6 rounded-lg hover:shadow-lg transition text-center`}
            >
              <div className="text-4xl mb-2">{cat.icon}</div>
              <h3 className="font-semibold text-gray-900">{cat.name}</h3>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-4 py-12 bg-white rounded-lg shadow-sm">
        <h2 className="text-3xl font-bold mb-8">Featured Products</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredProducts.map((product) => (
            <Link
              key={product.id}
              href={`/products/${product.id}`}
              className="card-hover p-4 group"
            >
              <div className="text-5xl mb-3 text-center group-hover:scale-110 transition-transform">
                {product.image}
              </div>
              <h3 className="font-semibold text-gray-900 mb-2 truncate">{product.name}</h3>
              <div className="flex items-center gap-2 mb-3">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm text-gray-600">{product.rating}</span>
              </div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl font-bold text-primary">₹{product.price}</span>
                <span className="text-sm text-gray-500 line-through">₹{product.originalPrice}</span>
              </div>
              <button className="w-full bg-primary text-white py-2 rounded-lg hover:bg-primary/90 transition flex items-center justify-center gap-2">
                <ShoppingCart className="w-4 h-4" />
                Add to Cart
              </button>
            </Link>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <h2 className="text-3xl font-bold mb-8 text-center">How VendorConnect Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="bg-primary text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">1</div>
            <h3 className="font-semibold text-gray-900 mb-2">Browse Products</h3>
            <p className="text-gray-600">Explore thousands of products from verified vendors</p>
          </div>
          <div className="text-center">
            <div className="bg-primary text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">2</div>
            <h3 className="font-semibold text-gray-900 mb-2">Place Order</h3>
            <p className="text-gray-600">Add items to cart and checkout with secure payment</p>
          </div>
          <div className="text-center">
            <div className="bg-primary text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">3</div>
            <h3 className="font-semibold text-gray-900 mb-2">Get Delivery</h3>
            <p className="text-gray-600">Track your order and receive it at your doorstep</p>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="bg-gray-100 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {trustBadges.map((badge) => {
              const Icon = badge.icon;
              return (
                <div key={badge.label} className="flex items-center gap-4 text-center md:text-left">
                  <Icon className="w-12 h-12 text-primary flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900">{badge.label}</h3>
                    <p className="text-sm text-gray-600">{badge.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-primary to-secondary text-white py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Selling?</h2>
          <p className="text-lg mb-8 opacity-90">Join our community of vendors and sellers today</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth?role=vendor" className="bg-white text-primary px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition">
              Become a Vendor
            </Link>
            <Link href="/auth?role=seller" className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-primary transition">
              Become a Seller
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
