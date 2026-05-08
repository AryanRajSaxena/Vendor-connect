'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Home, ShoppingCart, Store, BarChart3, UserCircle } from 'lucide-react';

interface MobileNavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return null;
  }

  const customerItems: MobileNavItem[] = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/products', label: 'Products', icon: Store },
    { href: '/cart', label: 'Cart', icon: ShoppingCart },
    { href: '/customer/dashboard', label: 'Orders', icon: BarChart3 },
    { href: '/customer/settings', label: 'Profile', icon: UserCircle },
  ];

  const sellerItems: MobileNavItem[] = [
    { href: '/seller/dashboard', label: 'Home', icon: Home },
    { href: '/seller/marketplace', label: 'Market', icon: Store },
    { href: '/seller/earnings', label: 'Earnings', icon: ShoppingCart },
    { href: '/seller/settings', label: 'Profile', icon: UserCircle },
  ];

  const vendorItems: MobileNavItem[] = [
    { href: '/vendor/dashboard', label: 'Home', icon: Home },
    { href: '/vendor/products', label: 'Products', icon: Store },
    { href: '/vendor/earnings', label: 'Earnings', icon: ShoppingCart },
    { href: '/vendor/settings', label: 'Profile', icon: UserCircle },
  ];

  const adminItems: MobileNavItem[] = [
    { href: '/admin/dashboard', label: 'Home', icon: Home },
    { href: '/admin/withdrawals', label: 'Payouts', icon: ShoppingCart },
    { href: '/admin/settings', label: 'Settings', icon: UserCircle },
  ];

  const items = (() => {
    if (user.role === 'seller') return sellerItems;
    if (user.role === 'vendor') return vendorItems;
    if (user.role === 'admin') return adminItems;
    return customerItems;
  })();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[60] md:hidden border-t border-gray-200 bg-gray-900/95 backdrop-blur supports-[backdrop-filter]:bg-gray-900/80 pb-[env(safe-area-inset-bottom)]">
      <div
        className="grid gap-1 px-2 py-2"
        style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
      >
        {items.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center rounded-xl py-2.5 text-[11px] font-medium transition-colors ${
                active
                  ? 'bg-primary-500/20 text-primary-300'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/70'
              }`}
            >
              <Icon className="mb-1 h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
