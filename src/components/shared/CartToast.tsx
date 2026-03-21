'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShoppingCart, X } from 'lucide-react';

interface CartToastEvent {
  message: string;
  type?: 'success' | 'error';
}

export function showCartToast(message: string, type: 'success' | 'error' = 'success') {
  window.dispatchEvent(new CustomEvent('cart-toast', { detail: { message, type } }));
}

function getCartCount(): number {
  try {
    const parsed = JSON.parse(localStorage.getItem('cart') || '[]');
    if (!Array.isArray(parsed)) return 0;
    return parsed.reduce((sum: number, item: any) => {
      const qty = Number(item?.quantity || 0);
      return sum + (Number.isFinite(qty) && qty > 0 ? qty : 0);
    }, 0);
  } catch {
    return 0;
  }
}

export default function CartToast() {
  const [toast, setToast] = useState<CartToastEvent | null>(null);
  const [cartCount, setCartCount] = useState(0);

  // Keep cart count in sync
  useEffect(() => {
    const update = () => setCartCount(getCartCount());
    update();
    window.addEventListener('cart-updated', update);
    window.addEventListener('storage', update);
    return () => {
      window.removeEventListener('cart-updated', update);
      window.removeEventListener('storage', update);
    };
  }, []);

  // Show toast on cart-toast events
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<CartToastEvent>).detail;
      setToast(detail);
    };
    window.addEventListener('cart-toast', handler);
    return () => window.removeEventListener('cart-toast', handler);
  }, []);

  // Hide when cart becomes empty
  useEffect(() => {
    if (cartCount === 0) setToast(null);
  }, [cartCount]);

  const isVisible = toast !== null && cartCount > 0;

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-[9999] transition-transform duration-300 ease-in-out ${
        isVisible ? 'translate-y-0' : 'translate-y-full'
      }`}
      onTransitionEnd={() => { if (!isVisible) setToast(null); }}
    >
      <div
        className={`w-full flex items-center justify-between px-5 py-4 shadow-lg ${
          toast?.type === 'error' ? 'bg-red-600' : 'bg-gray-900'
        }`}
      >
        <div className="flex items-center gap-3">
          <ShoppingCart className="w-5 h-5 text-white flex-shrink-0" />
          <span className="text-white font-medium text-sm">{toast?.message}</span>
        </div>
        <div className="flex items-center gap-3 ml-4">
          <Link
            href="/cart"
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold px-4 py-1.5 rounded-lg transition-colors whitespace-nowrap"
          >
            <ShoppingCart className="w-4 h-4" />
            View Cart ({cartCount})
          </Link>
          <button
            onClick={() => setToast(null)}
            className="text-white/70 hover:text-white transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
