'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ShoppingCart,
  Check,
  ChevronLeft,
  Clock3,
  GraduationCap,
  ListChecks,
  BookOpen,
  ShieldCheck,
  BadgeCheck,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency, getImageUrl } from '@/utils/calculations';

interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  final_price: number;
  base_price?: number;
  sold_count: number;
  is_active: boolean;
  images: string[];
  specifications: Record<string, any>;
  course_duration?: string;
  prerequisites?: string[];
  learning_outcomes?: string[];
  curriculum?: Array<{
    module?: number;
    title?: string;
    lessons?: number;
    duration?: string;
  }>;
  vendor_id: string;
  created_at: string;
}

export default function ProductDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isBuying, setIsBuying] = useState(false);

  const getSafeCart = () => {
    try {
      const parsed = JSON.parse(localStorage.getItem('cart') || '[]');
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch (error) {
      console.warn('Invalid cart in localStorage, resetting cart.', error);
    }

    localStorage.setItem('cart', '[]');
    return [];
  };

  const syncLocalCart = (cart: any[]) => {
    localStorage.setItem('cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('cart-updated'));
  };

  useEffect(() => {
    const code =
      searchParams.get('ref') ||
      searchParams.get('referral') ||
      searchParams.get('code') ||
      '';

    const normalized = code.trim().toUpperCase();
    if (!normalized) return;

    localStorage.setItem('referralCode', normalized);
  }, [searchParams]);

  // Fetch product details
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/products/${params.id}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
          throw new Error('Product not found');
        }

        const data = await response.json();
        setProduct(data);
      } catch (error) {
        console.error('Failed to fetch product:', error);
        setError((error as Error).message);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchProduct();
    }
  }, [params.id]);

  const handleAddToCart = () => {
    if (!product) return;

    const addToLocalCart = () => {
      const cart = getSafeCart();
      const existingItem = cart.find((item: any) => item.id === product.id);

      if (existingItem) {
        existingItem.quantity = 1; // Always 1 for digital products
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

      syncLocalCart(cart);
    };

    if (!user?.id) {
      try {
        addToLocalCart();
        alert(`Added to cart!`);
      } catch (error) {
        console.error('Failed to add to cart:', error);
      }
      return;
    }

    (async () => {
      try {
        setIsBuying(true);
        const response = await fetch('/api/cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerId: user.id,
            productId: product.id,
            quantity: 1,
          }),
        });

        if (!response.ok) {
          const apiError = await response.json().catch(() => ({}));
          throw new Error(apiError.error || 'Failed to add to database cart');
        }

        const data = await response.json();
        syncLocalCart(data.items || []);
        alert(`Added to cart!`);
      } catch (error) {
        console.error('Failed to add to database cart, falling back to local cart:', error);
        try {
          addToLocalCart();
          alert(`Added to cart!`);
        } catch (fallbackError) {
          console.error('Failed to add to fallback local cart:', fallbackError);
        }
      } finally {
        setIsBuying(false);
      }
    })();
  };

  const handleBuyNow = () => {
    if (!user?.id) {
      alert('Please login to continue');
      return;
    }
    handleAddToCart();
    // Redirect to checkout after adding to cart
    setTimeout(() => {
      window.location.href = '/checkout';
    }, 500);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <p className="text-slate-400 text-lg">Loading product...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-lg mb-4">{error || 'Product not found'}</p>
          <Link href="/products" className="inline-flex items-center rounded-lg bg-sky-600 hover:bg-sky-500 text-white px-4 py-2 text-sm font-semibold transition-colors">
            Back to Products
          </Link>
        </div>
      </div>
    );
  }

  const specs = product.specifications || {};
  const highlightText = String(specs.highlights || '');
  const highlights = highlightText
    .split('|||')
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 8);

  const prerequisites = (Array.isArray(product.prerequisites) ? product.prerequisites : [])
    .map((item) => String(item).trim())
    .filter(Boolean)
    .slice(0, 10);

  const learningOutcomes = (Array.isArray(product.learning_outcomes) ? product.learning_outcomes : [])
    .map((item) => String(item).trim())
    .filter(Boolean)
    .slice(0, 12);

  const curriculum = (Array.isArray(product.curriculum) ? product.curriculum : [])
    .map((module) => ({
      module: Number(module?.module || 0),
      title: String(module?.title || '').trim(),
      lessons: Number(module?.lessons || 0),
      duration: String(module?.duration || '').trim(),
    }))
    .filter((module) => module.title);

  const courseDuration =
    (product.course_duration && String(product.course_duration).trim()) ||
    (specs.courseDuration && String(specs.courseDuration).trim()) ||
    (specs.course_duration && String(specs.course_duration).trim()) ||
    'Self-paced';

  const totalLessons = curriculum.reduce((sum, module) => sum + (module.lessons > 0 ? module.lessons : 0), 0);
  const publishedOn = product.created_at
    ? new Date(product.created_at).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : 'Recently added';

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="bg-slate-900/90 border-b border-slate-800 px-4 py-3">
        <div className="max-w-7xl mx-auto">
          <Link href="/products" className="inline-flex items-center gap-1 text-slate-400 hover:text-slate-100 text-sm font-medium transition-colors">
            <ChevronLeft className="w-4 h-4" />
            Back to Products
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 md:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 shadow-lg shadow-black/20">
              <p className="text-[11px] uppercase tracking-wide text-slate-400 mb-3">Course Preview</p>
              <div className="bg-slate-950 rounded-xl border border-slate-800 p-3 h-64 md:h-72 flex items-center justify-center">
                {getImageUrl(product.images?.[activeImageIndex]) ? (
                  <img
                    src={getImageUrl(product.images?.[activeImageIndex])!}
                    alt={product.name}
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <span className="text-7xl">📦</span>
                )}
              </div>

              {product.images && product.images.length > 1 && (
                <div className="flex gap-2.5 overflow-x-auto mt-4 pb-1">
                  {product.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`w-12 h-12 rounded-md flex-shrink-0 border-2 transition-all overflow-hidden flex items-center justify-center bg-slate-900 ${
                        activeImageIndex === idx
                          ? 'border-sky-500 shadow-sm shadow-sky-500/20'
                          : 'border-slate-700 hover:border-slate-500'
                      }`}
                    >
                      {getImageUrl(img) ? (
                        <img
                          src={getImageUrl(img)!}
                          alt={`${product.name} ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-sm">📦</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-8 space-y-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg shadow-black/20">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                {product.category}
              </p>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-100 leading-tight">
                {product.name}
              </h1>
              <div className="flex flex-wrap items-center gap-3 mt-4 text-sm">
                <span className="inline-flex items-center gap-1 text-amber-500 font-semibold">
                  {'★★★★★'}
                </span>
                <span className="text-slate-400">{product.sold_count}+ enrolled learners</span>
                <span className="text-slate-700">•</span>
                <span className="inline-flex items-center gap-1 text-slate-300">
                  <Clock3 className="w-4 h-4 text-slate-500" />
                  {courseDuration}
                </span>
                <span className="text-slate-700">•</span>
                <span className="inline-flex items-center gap-1 text-slate-300">
                  <BookOpen className="w-4 h-4 text-slate-500" />
                  {curriculum.length} modules
                </span>
              </div>

              <div className="mt-5 pt-5 border-t border-slate-800">
                <p className="text-sm text-slate-400">Final Price (including taxes)</p>
                <div className="flex items-end gap-2 mt-1">
                  <span className="text-4xl font-bold text-slate-100">{formatCurrency(product.final_price)}</span>
                  <span className="text-xs text-emerald-400 font-semibold mb-1">Instant digital access</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
                <button
                  onClick={handleBuyNow}
                  disabled={isBuying}
                  className="w-full bg-sky-600 hover:bg-sky-500 text-white font-semibold py-3 px-4 rounded-lg text-base transition-all disabled:opacity-50"
                >
                  Buy Now
                </button>
                <button
                  onClick={handleAddToCart}
                  disabled={isBuying}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold py-3 px-4 rounded-lg text-base transition-all disabled:opacity-50 border border-slate-700"
                >
                  <ShoppingCart className="w-5 h-5 inline mr-2" />
                  Add to Cart
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">
                <div className="rounded-lg bg-slate-950 border border-slate-800 p-3">
                  <p className="text-xs text-slate-400">Published</p>
                  <p className="text-sm font-semibold text-slate-100 mt-1">{publishedOn}</p>
                </div>
                <div className="rounded-lg bg-slate-950 border border-slate-800 p-3">
                  <p className="text-xs text-slate-400">Modules</p>
                  <p className="text-sm font-semibold text-slate-100 mt-1">{curriculum.length}</p>
                </div>
                <div className="rounded-lg bg-slate-950 border border-slate-800 p-3">
                  <p className="text-xs text-slate-400">Lessons</p>
                  <p className="text-sm font-semibold text-slate-100 mt-1">{totalLessons}</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg shadow-black/20">
              <h2 className="text-lg font-bold text-slate-100 mb-3">About This Course</h2>
              <p className="text-slate-300 leading-relaxed text-sm md:text-base">{product.description}</p>

              {highlights.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-bold text-slate-100 mb-3 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-sky-500" />
                    Key Highlights
                  </h3>
                  <ul className="space-y-2">
                    {highlights.map((item, idx) => (
                      <li key={`${item}-${idx}`} className="text-sm text-slate-300 flex items-start gap-2">
                        <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg shadow-black/20">
                <h3 className="text-base font-bold text-slate-100 mb-3 flex items-center gap-2">
                  <ListChecks className="w-4 h-4 text-sky-500" />
                  Prerequisites
                </h3>
                {prerequisites.length > 0 ? (
                  <ul className="space-y-2">
                    {prerequisites.map((item, idx) => (
                      <li key={`${item}-${idx}`} className="text-sm text-slate-300 flex items-start gap-2">
                        <span className="mt-2 inline-block w-1.5 h-1.5 rounded-full bg-slate-500" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-400">No prerequisites. This is beginner friendly.</p>
                )}
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg shadow-black/20">
                <h3 className="text-base font-bold text-slate-100 mb-3 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-sky-500" />
                  What You&apos;ll Learn
                </h3>
                {learningOutcomes.length > 0 ? (
                  <ul className="space-y-2">
                    {learningOutcomes.map((item, idx) => (
                      <li key={`${item}-${idx}`} className="text-sm text-slate-300 flex items-start gap-2">
                        <BadgeCheck className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-400">Learning outcomes will be updated soon.</p>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg shadow-black/20">
              <h3 className="text-base font-bold text-slate-100 mb-4">Course Curriculum</h3>
              {curriculum.length > 0 ? (
                <div className="space-y-3">
                  {curriculum.map((module, idx) => (
                    <div key={`${module.title}-${idx}`} className="rounded-lg border border-slate-800 bg-slate-950 px-4 py-3">
                      <p className="text-sm font-semibold text-slate-100">
                        Module {idx + 1}: {module.title}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {module.lessons > 0 ? `${module.lessons} lessons` : 'Lessons not specified'}
                        {module.duration ? ` • ${module.duration}` : ''}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400">Curriculum details are not available yet.</p>
              )}
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg shadow-black/20">
              <h3 className="text-base font-bold text-slate-100 mb-4">Why Buy With Confidence</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex gap-2.5">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-slate-100">Secure Payments</p>
                    <p className="text-xs text-slate-400">Protected checkout and verified transactions.</p>
                  </div>
                </div>
                <div className="flex gap-2.5">
                  <Check className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-slate-100">Instant Access</p>
                    <p className="text-xs text-slate-400">Start learning right after successful payment.</p>
                  </div>
                </div>
                <div className="flex gap-2.5">
                  <BadgeCheck className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-slate-100">7-Day Guarantee</p>
                    <p className="text-xs text-slate-400">Refund support if the course is not a fit.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
