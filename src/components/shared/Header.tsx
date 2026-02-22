'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { ShoppingCart, User, LogOut, Menu, X, Home, Package, Settings } from 'lucide-react';
import AuthModal from './AuthModal';

export default function Header() {
  const { user, logout, isAuthenticated } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
    <header className="bg-white shadow-md sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-2xl text-primary">
          <Package className="w-8 h-8" />
          <span className="hidden sm:inline">VendorConnect</span>
          <span className="sm:hidden">VC</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          {isAuthenticated ? (
            <>
              <Link
                href={getRoleBasedDashboardLink()}
                className="flex items-center gap-1 text-gray-700 hover:text-primary transition"
              >
                <Home className="w-5 h-5" />
                <span className="text-sm">{getDashboardLabel()}</span>
              </Link>

              {user?.role === 'customer' && (
                <Link
                  href="/cart"
                  className="flex items-center gap-1 text-gray-700 hover:text-primary transition relative"
                >
                  <ShoppingCart className="w-5 h-5" />
                  <span className="text-xs bg-primary text-white rounded-full w-5 h-5 flex items-center justify-center">0</span>
                </Link>
              )}

              <div className="relative" ref={dropdownRef}>
                <button 
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="flex items-center gap-1 text-gray-700 hover:text-primary transition"
                >
                  <User className="w-5 h-5" />
                  <span className="text-sm">{user?.name?.split(' ')[0]}</span>
                </button>
                {isProfileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg z-50">
                    <Link 
                      href={getRoleBasedSettingsLink()} 
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-t-lg"
                      onClick={() => setIsProfileDropdownOpen(false)}
                    >
                      <Settings className="inline w-4 h-4 mr-2" />
                      Settings
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        setIsProfileDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center rounded-b-lg"
                    >
                      <LogOut className="inline w-4 h-4 mr-2" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition"
            >
              Login / Sign Up
            </button>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="md:hidden text-gray-700"
        >
          {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </nav>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-gray-50 border-t px-4 py-3 space-y-3">
          {isAuthenticated ? (
            <>
              <Link
                href={getRoleBasedDashboardLink()}
                className="block text-gray-700 hover:text-primary py-2"
              >
                {getDashboardLabel()}
              </Link>
              {user?.role === 'customer' && (
                <Link href="/cart" className="block text-gray-700 hover:text-primary py-2">
                  Shopping Cart
                </Link>
              )}
              <Link href={getRoleBasedSettingsLink()} className="block text-gray-700 hover:text-primary py-2">
                Settings
              </Link>
              <button
                onClick={() => {
                  logout();
                  setIsMenuOpen(false);
                }}
                className="block text-red-600 hover:text-red-700 py-2 w-full text-left"
              >
                Logout
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                setIsAuthModalOpen(true);
                setIsMenuOpen(false);
              }}
              className="w-full bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90"
            >
              Login / Sign Up
            </button>
          )}
        </div>
      )}

      {/* Auth Modal */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </header>
  );
}
