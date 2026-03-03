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
    <header className="bg-white shadow-soft sticky top-0 z-50 border-b border-gray-100">
      <nav className="container-custom py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="bg-gradient-primary p-2 rounded-xl shadow-sm group-hover:shadow-md transition-all duration-300">
            <Package className="w-6 h-6 text-white" />
          </div>
          <span className="hidden sm:inline font-bold text-xl bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
            VendorConnect
          </span>
          <span className="sm:hidden font-bold text-xl text-primary-600">VC</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <Link
                href={getRoleBasedDashboardLink()}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-200 font-medium"
              >
                <Home className="w-4 h-4" />
                <span className="text-sm">{getDashboardLabel()}</span>
              </Link>

              {user?.role === 'customer' && (
                <Link
                  href="/cart"
                  className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-200 font-medium relative"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span className="absolute -top-1 -right-1 bg-primary-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-sm">0</span>
                </Link>
              )}

              <div className="relative" ref={dropdownRef}>
                <button 
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-200 font-medium"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm">{user?.name?.split(' ')[0]}</span>
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
            </>
          ) : (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="btn-primary"
            >
              Login / Sign Up
            </button>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="md:hidden p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
        >
          {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
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
          ) : (
            <button
              onClick={() => {
                setIsAuthModalOpen(true);
                setIsMenuOpen(false);
              }}
              className="w-full btn-primary"
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
