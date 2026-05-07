'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Store,
  ShoppingBag,
  Settings,
  LogOut,
  Menu,
  X,
  Search,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const navItems = [
  { href: '/seller/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/seller/marketplace', label: 'Marketplace', icon: Store },
  { href: '/seller/sales', label: 'Sales & Earnings', icon: ShoppingBag },
  { href: '/seller/settings', label: 'Settings', icon: Settings },
];

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isGuestMarketplace, setIsGuestMarketplace] = useState(false);

  useEffect(() => {
    if (user || !pathname.startsWith('/seller/marketplace')) {
      setIsGuestMarketplace(false);
      return;
    }

    const guestRole = new URLSearchParams(window.location.search)
      .get('guestRole')
      ?.toLowerCase();

    setIsGuestMarketplace(guestRole === 'seller' || guestRole === 'vendor');
  }, [pathname, user]);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (isGuestMarketplace) {
    return (
      <main className="min-h-[calc(100vh-64px)] bg-gray-50 overflow-auto">
        {children}
      </main>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-64px)] bg-[#0b1320]">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/45 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-16 bottom-0 left-0 z-40 w-60 bg-gradient-to-b from-slate-900 to-slate-950 border-r border-slate-800/90
          flex flex-col transform transition-transform duration-200 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:sticky lg:top-0 lg:h-[calc(100vh-64px)] lg:translate-x-0
        `}
      >
        {/* Brand strip */}
        <div className="h-14 flex items-center justify-between px-5 border-b border-slate-800/90">
          <span className="text-[15px] font-semibold text-white tracking-tight brand-money-font">
            Seller Portal
          </span>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <p className="px-3 mb-2 text-[10px] uppercase tracking-[0.14em] text-slate-500 font-semibold">
            Navigation
          </p>
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive =
              href === '/seller/dashboard'
                ? pathname === href || pathname.startsWith('/seller/dashboard/')
                : pathname === href || pathname.startsWith(href + '/');
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all ${
                  isActive
                    ? 'bg-white/[0.09] text-white font-semibold border border-slate-700/80'
                    : 'text-slate-400 hover:bg-white/[0.05] hover:text-slate-200 font-medium border border-transparent'
                }`}
              >
                <Icon
                  className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-primary-400' : 'text-slate-500'}`}
                />
                <span className="flex-1">{label}</span>
                {isActive && <span className="w-1.5 h-1.5 rounded-full bg-primary-400" />}
              </Link>
            );
          })}
        </nav>

        {/* Browse CTA */}
        <div className="px-3 pb-4">
          <Link
            href="/seller/dashboard"
            onClick={() => setSidebarOpen(false)}
            className="mb-2 flex items-center justify-center gap-2 w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-medium text-sm rounded-lg transition-colors"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            My Store
          </Link>
          <Link
            href="/seller/marketplace"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-primary-600 hover:bg-primary-500 text-white font-medium text-sm rounded-lg transition-colors shadow-md shadow-primary-900/30"
          >
            <Search className="w-3.5 h-3.5" />
            Browse Products
          </Link>
        </div>

        {/* User + logout */}
        <div className="p-4 border-t border-slate-800/90 bg-slate-950/40">
          <div className="flex items-center gap-2.5 mb-2.5">
            <div className="w-7 h-7 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white font-semibold text-xs">
                {user?.name?.charAt(0)?.toUpperCase() ?? 'S'}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white truncate leading-tight">
                {user?.name || 'Seller'}
              </p>
              <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-2 py-1.5 text-xs text-slate-500 hover:text-red-400 rounded-md transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile hamburger */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="fixed bottom-4 left-4 z-50 lg:hidden bg-gray-900 text-white p-3 rounded-full shadow-lg"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Page content */}
      <main className="flex-1 bg-gradient-to-b from-slate-950 to-slate-900 overflow-auto">
        {children}
      </main>
    </div>
  );
}
