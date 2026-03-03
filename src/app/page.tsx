'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, ShoppingCart, Lock, RotateCcw, Star, Package, TrendingUp, Users, Shield, Zap, ArrowRight, CheckCircle } from 'lucide-react';
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
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="spinner w-12 h-12 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  const categories = [
    { name: 'Electronics', icon: '🔌', color: 'from-blue-500 to-blue-600', count: '2.5k+' },
    { name: 'Fashion', icon: '👕', color: 'from-pink-500 to-rose-600', count: '5k+' },
    { name: 'Home Appliances', icon: '🏠', color: 'from-orange-500 to-amber-600', count: '1.8k+' },
    { name: 'Services', icon: '💼', color: 'from-green-500 to-emerald-600', count: '3k+' },
    { name: 'Education', icon: '📚', color: 'from-purple-500 to-violet-600', count: '1.2k+' },
    { name: 'Healthcare', icon: '⚕️', color: 'from-red-500 to-rose-600', count: '800+' },
    { name: 'Books', icon: '📖', color: 'from-yellow-500 to-amber-600', count: '4k+' },
    { name: 'Other', icon: '📦', color: 'from-gray-500 to-slate-600', count: '2k+' },
  ];

  const featuredProducts = [
    { id: 1, name: 'Wireless Earbuds Pro', price: 2500, originalPrice: 3000, image: '🎧', rating: 4.5, reviews: 234, discount: 17 },
    { id: 2, name: 'USB-C Fast Cable', price: 500, originalPrice: 800, image: '🔌', rating: 4.2, reviews: 156, discount: 38 },
    { id: 3, name: 'Adjustable Phone Stand', price: 800, originalPrice: 1200, image: '📱', rating: 4.7, reviews: 89, discount: 33 },
    { id: 4, name: 'Premium Laptop Bag', price: 1500, originalPrice: 2200, image: '👜', rating: 4.4, reviews: 178, discount: 32 },
  ];

  const trustBadges = [
    { icon: Shield, label: 'Secure Payment', desc: '256-bit SSL Encrypted', color: 'text-green-600' },
    { icon: RotateCcw, label: 'Easy Returns', desc: '7-day hassle-free returns', color: 'text-blue-600' },
    { icon: Zap, label: 'Fast Delivery', desc: 'Express shipping available', color: 'text-orange-600' },
    { icon: Lock, label: 'Buyer Protection', desc: '100% purchase protection', color: 'text-purple-600' },
  ];

  const stats = [
    { value: '10k+', label: 'Active Products', icon: Package },
    { value: '5k+', label: 'Happy Vendors', icon: Users },
    { value: '15k+', label: 'Sellers Earning', icon: TrendingUp },
    { value: '50k+', label: 'Orders Delivered', icon: CheckCircle },
  ];

  return (
    <div className="bg-gray-50">
      {/* Hero Section */}
      <section className="gradient-hero text-white py-20 md:py-28 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>
        
        <div className="container-custom relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6 animate-fade-in">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              <span className="text-sm font-medium">India's #1 Vendor Connect Platform</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight animate-slide-up">
              Connect, Sell & Grow Your Business
            </h1>
            <p className="text-lg md:text-xl mb-10 opacity-95 leading-relaxed animate-slide-up">
              Join thousands of vendors and sellers in India's fastest-growing commission-based marketplace
            </p>

            {/* Search Bar */}
            <div className="relative max-w-2xl mx-auto animate-slide-up">
              <div className="bg-white rounded-2xl shadow-large p-2 flex items-center gap-2">
                <Search className="ml-3 w-6 h-6 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for products, categories, or brands..."
                  className="flex-1 px-3 py-3 text-gray-900 focus:outline-none bg-transparent"
                />
                <Link href={`/products?search=${searchQuery}`}>
                  <button className="btn-primary whitespace-nowrap">
                    Search
                  </button>
                </Link>
              </div>
            </div>

            {/* Popular Searches */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2 animate-fade-in">
              <span className="text-sm opacity-75">Popular:</span>
              {['Electronics', 'Fashion', 'Home Decor', 'Services'].map((term) => (
                <Link
                  key={term}
                  href={`/products?category=${term}`}
                  className="text-sm bg-white/20 hover:bg-white/30 backdrop-blur-sm px-4 py-1.5 rounded-full transition-all duration-200"
                >
                  {term}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-white border-y border-gray-100">
        <div className="container-custom">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary-50 text-primary-600 mb-3">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="section-sm">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Shop by Category</h2>
            <p className="text-gray-600 text-lg">Explore thousands of products across multiple categories</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {categories.map((cat) => (
              <Link
                key={cat.name}
                href={`/products?category=${cat.name}`}
                className="group relative overflow-hidden rounded-2xl p-6 md:p-8 text-center hover-lift bg-white border border-gray-100 hover:border-transparent hover:shadow-large transition-all duration-300"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${cat.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
                <div className="relative z-10">
                  <div className="text-5xl md:text-6xl mb-4 transform group-hover:scale-110 transition-transform duration-300">{cat.icon}</div>
                  <h3 className="font-bold text-gray-900 mb-1">{cat.name}</h3>
                  <p className="text-sm text-gray-500">{cat.count} products</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="section-sm bg-white">
        <div className="container-custom">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Featured Products</h2>
              <p className="text-gray-600">Handpicked deals just for you</p>
            </div>
            <Link href="/products" className="hidden md:flex items-center gap-2 text-primary-600 hover:text-primary-700 font-semibold group">
              View All
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <Link
                key={product.id}
                href={`/products/${product.id}`}
                className="card-interactive group"
              >
                {/* Product Image */}
                <div className="relative">
                  <div className="w-full h-56 bg-gradient-to-br from-gray-50 to-gray-100 rounded-t-xl flex items-center justify-center text-6xl group-hover:scale-105 transition-transform duration-300">
                    {product.image}
                  </div>
                  <div className="absolute top-3 right-3 badge-error font-bold">
                    {product.discount}% OFF
                  </div>
                </div>

                {/* Product Info */}
                <div className="p-5 space-y-3">
                  <h3 className="font-bold text-gray-900 text-lg line-clamp-2 group-hover:text-primary-600 transition-colors">
                    {product.name}
                  </h3>
                  
                  {/* Rating */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-semibold text-gray-900">{product.rating}</span>
                    </div>
                    <span className="text-sm text-gray-500">({product.reviews} reviews)</span>
                  </div>

                  {/* Price */}
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-gray-900">₹{product.price}</span>
                    <span className="text-sm text-gray-500 line-through">₹{product.originalPrice}</span>
                  </div>

                  {/* Add to Cart Button */}
                  <button className="w-full btn-primary flex items-center justify-center gap-2 group-hover:shadow-md">
                    <ShoppingCart className="w-4 h-4" />
                    Add to Cart
                  </button>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-8 text-center md:hidden">
            <Link href="/products" className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-semibold">
              View All Products
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="section-sm">
        <div className="container-custom">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">How VendorConnect Works</h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Simple, transparent, and efficient - start your journey in three easy steps
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            {[
              { step: '01', title: 'Browse Products', desc: 'Explore thousands of verified products from trusted vendors across India', icon: Search },
              { step: '02', title: 'Place Order', desc: 'Add items to cart and checkout securely with multiple payment options', icon: ShoppingCart },
              { step: '03', title: 'Get Delivery', desc: 'Track your order in real-time and receive it at your doorstep', icon: Package },
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={index} className="relative">
                  {index < 2 && (
                    <div className="hidden md:block absolute top-16 left-full w-full h-0.5 bg-gradient-to-r from-primary-200 to-transparent"></div>
                  )}
                  <div className="text-center relative z-10">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-primary text-white mb-6 shadow-large">
                      <Icon className="w-10 h-10" />
                    </div>
                    <div className="text-5xl font-bold text-primary-100 mb-4">{item.step}</div>
                    <h3 className="font-bold text-xl text-gray-900 mb-3">{item.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="section-sm bg-white">
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {trustBadges.map((badge, index) => {
              const Icon = badge.icon;
              return (
                <div key={index} className="flex flex-col items-center text-center p-6 rounded-2xl hover:bg-gray-50 transition-colors duration-300">
                  <div className={`w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-4 ${badge.color}`}>
                    <Icon className="w-8 h-8" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">{badge.label}</h3>
                  <p className="text-sm text-gray-600">{badge.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-sm gradient-hero text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>
        
        <div className="container-custom relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Ready to Start Your Journey?</h2>
            <p className="text-lg md:text-xl mb-10 opacity-95">
              Join thousands of vendors and sellers earning through our platform
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth?role=vendor" className="btn-lg bg-white text-primary-600 hover:bg-gray-50 shadow-large hover:shadow-xl">
                Become a Vendor
              </Link>
              <Link href="/auth?role=seller" className="btn-lg border-2 border-white text-white hover:bg-white hover:text-primary-600 shadow-large hover:shadow-xl">
                Become a Seller
              </Link>
            </div>
            <p className="mt-6 text-sm opacity-75">No credit card required • Free to join • Start earning today</p>
          </div>
        </div>
      </section>
    </div>
  );
}
