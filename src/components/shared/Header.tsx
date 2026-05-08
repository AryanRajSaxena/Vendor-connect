'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { User, LogOut, Home, Settings } from 'lucide-react';
import AuthModal from './AuthModal';

export default function Header() {
  const { user, logout, isAuthenticated } = useAuth();
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
            <p className="brand-text text-[18px] text-white">Agent Croww</p>
            {isAuthenticated && (
              <p className="text-[11px] uppercase tracking-[0.08em] text-gray-500">{getDashboardLabel()}</p>
            )}
          </div>
          <span className="brand-text sm:hidden text-xl text-white">Agent Croww</span>
        </Link>

        {/* Desktop Navigation */}
        {isAuthenticated ? (
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
        ) : (
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="px-4 py-2 text-gray-700 hover:text-primary-600 font-semibold transition-colors duration-200"
            >
              Login
            </button>
          </div>
        )}

        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center gap-1.5">
          {isAuthenticated && (
            <Link
              href={getRoleBasedDashboardLink()}
              className="p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              aria-label="Open dashboard"
            >
              <User className="w-5 h-5" />
            </Link>
          )}

          {!isAuthenticated && (
            <>
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="px-3 py-2 text-sm text-gray-700 hover:text-primary-600 font-semibold transition-colors duration-200"
              >
                Login
              </button>
            </>
          )}
        </div>
      </nav>

      {/* Auth Modal */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </header>
  );
}
