'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { ShoppingCart, User, LogOut, Menu, X, Home, Settings, Sun, Moon } from 'lucide-react';
import AuthModal from './AuthModal';
import { useTheme } from './ThemeProvider';

export default function Header() {
  const { user, logout, isAuthenticated } = useAuth();
  const { theme, toggle } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const getCartCount = () => {
    try {
      const parsed = JSON.parse(localStorage.getItem('cart') || '[]');
      if (!Array.isArray(parsed)) {
        return 0;
      }

      return parsed.reduce((total, item) => {
        const qty = Number(item?.quantity || 0);
        return total + (Number.isFinite(qty) && qty > 0 ? qty : 0);
      }, 0);
    } catch (error) {
      console.warn('Invalid cart in localStorage while reading badge count.', error);
      return 0;
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const updateCount = () => setCartCount(getCartCount());

    updateCount();
    window.addEventListener('storage', updateCount);
    window.addEventListener('cart-updated', updateCount);

    return () => {
      window.removeEventListener('storage', updateCount);
      window.removeEventListener('cart-updated', updateCount);
    };
  }, []);

  const getRoleBasedDashboardLink = () => {
    if (!user) return '/';
    switch (user.role) {
      case 'vendor':
        return '/vendor/dashboard';
      case 'seller':
        return '/seller/dashboard';
      case 'admin':
        return '/admin/dashboard';
      default:
        return '/customer/dashboard';
    }
  };

  const getDashboardLabel = () => {
    if (!user) return '';
    const labels: Record<string, string> = {
      vendor: 'Vendor Dashboard',
      seller: 'Seller Dashboard',
      admin: 'Admin Dashboard',
      customer: 'My Orders',
    };
    return labels[user.role] || 'Dashboard';
  };

  const getRoleLabel = () => {
    if (!user) return 'User';
    const labels: Record<string, string> = {
      vendor: 'Vendor',
      seller: 'Seller',
      admin: 'Admin',
      customer: 'Customer',
    };
    return labels[user.role] || 'User';
  };

  const getRoleBasedSettingsLink = () => {
    if (!user) return '/';
    switch (user.role) {
      case 'vendor':
        return '/vendor/settings';
      case 'seller':
        return '/seller/settings';
      case 'admin':
        return '/admin/settings';
      default:
        return '/customer/settings';
    }
  };

  return (
    <header className="bg-white shadow-soft sticky top-0 z-50 border-b border-gray-100">
      <nav className="container-custom py-3.5 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="rounded-xl shadow-sm ring-1 ring-primary-200/60 group-hover:shadow-md transition-all duration-300 overflow-hidden">
            <img src="/images/icon.jpeg" alt="Agent Croww" className="w-10 h-10 object-cover" />
          </div>
          <div className="hidden sm:block leading-tight">
            <p className="brand-money-font font-semibold text-[18px] tracking-tight text-white">Agent Croww</p>
            {isAuthenticated && (
              <p className="text-[11px] uppercase tracking-[0.08em] text-gray-500">{getDashboardLabel()}</p>
            )}
          </div>
          <span className="brand-money-font sm:hidden font-bold text-xl text-white">Agent Croww</span>
        </Link>

        {/* Desktop Navigation */}
        {isAuthenticated && (
        <div className="hidden md:flex items-center gap-4">
          <Link
                href={getRoleBasedDashboardLink()}
                className="flex items-center gap-2 px-3.5 py-2 border border-gray-200 text-gray-700 hover:text-primary-600 hover:border-primary-200 hover:bg-primary-50 rounded-lg transition-all duration-200"
              >
                <Home className="w-4 h-4" />
                <div className="leading-tight">
                  <p className="text-[10px] uppercase tracking-wide text-gray-400">Workspace</p>
                  <p className="text-sm font-semibold text-gray-800">{getDashboardLabel()}</p>
                </div>
              </Link>

              {user?.role === 'customer' && (
                <Link
                  href="/cart"
                  className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-200 font-medium relative"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span className="absolute -top-1 -right-1 bg-primary-500 text-white text-xs rounded-full min-w-[1.25rem] h-5 px-1 flex items-center justify-center font-bold shadow-sm">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                </Link>
              )}

              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={toggle}
                  className="p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                  aria-label="Toggle theme"
                >
                  {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>
              </div>

              <div className="relative" ref={dropdownRef}>
                <button 
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="flex items-center gap-2 px-2.5 py-1.5 border border-gray-200 text-gray-700 hover:text-primary-600 hover:border-primary-200 hover:bg-primary-50 rounded-lg transition-all duration-200"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left leading-tight">
                    <p className="text-xs text-gray-400">{getRoleLabel()}</p>
                    <p className="text-sm font-semibold text-gray-800 max-w-[110px] truncate">{user?.name}</p>
                  </div>
                </button>
                {isProfileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-large border border-gray-100 z-50 animate-slide-down overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                      <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{user?.email}</p>
                    </div>
                    <Link 
                      href={getRoleBasedSettingsLink()} 
                      className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                      onClick={() => setIsProfileDropdownOpen(false)}
                    >
                      <Settings className="w-4 h-4 text-gray-400" />
                      <span>Settings</span>
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        setIsProfileDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors duration-150"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
        )}

        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center gap-1.5">
          <button
            onClick={toggle}
            className="p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          {isAuthenticated && user?.role === 'customer' && (
            <Link
              href="/cart"
              className="relative p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              aria-label="Open cart"
            >
              <ShoppingCart className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 bg-primary-500 text-white text-[10px] rounded-full min-w-[1rem] h-4 px-1 flex items-center justify-center font-bold shadow-sm">
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            </Link>
          )}

          {isAuthenticated && (
            <Link
              href={getRoleBasedDashboardLink()}
              className="p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              aria-label="Open dashboard"
            >
              <User className="w-5 h-5" />
            </Link>
          )}

          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-4 space-y-2 animate-slide-down shadow-medium">
          {isAuthenticated ? (
            <>
              <Link
                href={getRoleBasedDashboardLink()}
                className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-150 font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                <Home className="w-5 h-5" />
                {getDashboardLabel()}
              </Link>
              {user?.role === 'customer' && (
                <Link 
                  href="/cart" 
                  className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-150 font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <ShoppingCart className="w-5 h-5" />
                  Shopping Cart
                </Link>
              )}
              <Link 
                href={getRoleBasedSettingsLink()} 
                className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-150 font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                <Settings className="w-5 h-5" />
                Settings
              </Link>
              <button
                onClick={() => {
                  logout();
                  setIsMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-150 font-medium"
              >
                <LogOut className="w-5 h-5" />
                Logout
              </button>
            </>
          ) : null}
        </div>
      )}

      {/* Auth Modal */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </header>
  );
}
