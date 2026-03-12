'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Settings,
  LogOut,
  Menu,
  X,
  Plus,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const navItems = [
  { href: '/vendor/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/vendor/products', label: 'My Products', icon: Package },
  { href: '/vendor/sales', label: 'Sales & Earnings', icon: ShoppingBag },
  { href: '/vendor/settings', label: 'Settings', icon: Settings },
];

// Paths that should highlight the "My Products" nav item
const productsPaths = ['/vendor/products', '/vendor/add-product'];

export default function VendorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <div className="flex min-h-[calc(100vh-64px)]">
      {/* --- Sidebar --- */}
      <aside
        className={`
          fixed top-16 bottom-0 left-0 z-40 w-60 bg-white border-r border-gray-200
          flex flex-col transform transition-transform duration-200 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:sticky lg:top-0 lg:h-[calc(100vh-64px)] lg:translate-x-0
        `}
      >
        {/* Brand strip */}
        <div className="h-14 flex items-center justify-between px-5 border-b border-gray-100">
          <span className="text-[15px] font-semibold text-gray-800 tracking-tight">
            Vendor Portal
          </span>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive =
              pathname === href ||
              (href === '/vendor/products'
                ? productsPaths.some((p) => pathname === p || pathname.startsWith(p + '/'))
                : href !== '/vendor/dashboard' && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all ${
                  isActive
                    ? 'bg-gray-50 text-gray-900 font-semibold'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800 font-medium'
                }`}
              >
                <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-primary-500' : 'text-gray-400'}`} />
                <span className="flex-1">{label}</span>
                {isActive && <span className="w-1.5 h-1.5 rounded-full bg-primary-500" />}
              </Link>
            );
          })}
        </nav>

        {/* List product CTA */}
        <div className="px-3 pb-4">
          <Link
            href="/vendor/add-product"
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-medium text-sm rounded-md transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            New Product
          </Link>
        </div>

        {/* User + logout */}
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-7 h-7 bg-gray-900 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white font-semibold text-xs">
                {user?.name?.charAt(0)?.toUpperCase() ?? 'V'}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-900 truncate leading-tight">{user?.name}</p>
              <p className="text-xs text-gray-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-2 py-1.5 text-xs text-gray-400 hover:text-red-500 rounded-md transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center gap-3 h-12 px-4 bg-white border-b border-gray-200 sticky top-16 z-20">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-500 hover:text-gray-800 p-1"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-sm font-semibold text-gray-700">Vendor Portal</span>
        </div>

        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
