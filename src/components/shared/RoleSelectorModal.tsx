'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, Store, TrendingUp } from 'lucide-react';

export type UserRole = 'customer' | 'vendor' | 'seller';

interface RoleSelectorModalProps {
  onRoleSelect: (role: UserRole) => void;
}

export function RoleSelectorModal({ onRoleSelect }: RoleSelectorModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check if user has already selected a role
    const savedRole = localStorage.getItem('landingPage_selectedRole');
    if (!savedRole) {
      setIsOpen(true);
    }
  }, []);

  const handleRoleSelect = (role: UserRole) => {
    localStorage.setItem('landingPage_selectedRole', role);
    setIsOpen(false);
    onRoleSelect(role);
    
    // Redirect customer to products page
    if (role === 'customer') {
      router.push('/products');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl max-w-2xl w-full animate-scale-in">
        {/* Header */}
        <div className="border-b border-slate-800 p-4 md:p-8 flex items-center justify-between">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">Welcome to Agent Croww</h2>
            <p className="text-slate-400 text-sm md:text-base">Choose your role to see the platform tailored just for you</p>
          </div>
          <button
            onClick={() => {
              setIsOpen(false);
              localStorage.setItem('landingPage_selectedRole', 'customer');
              onRoleSelect('customer');
              router.push('/products');
            }}
            className="text-slate-400 hover:text-white p-2 hover:bg-slate-800 rounded-lg transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Role Options */}
        <div className="p-4 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {/* Vendor Option */}
            <button
              onClick={() => handleRoleSelect('vendor')}
              className="group relative overflow-hidden rounded-2xl p-4 md:p-8 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-2 border-emerald-500/20 hover:border-emerald-500/60 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/20 text-left"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 to-emerald-600/0 group-hover:from-emerald-500/5 group-hover:to-emerald-600/5 transition-all duration-300"></div>
              <div className="relative z-10">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-emerald-500/20 group-hover:bg-emerald-500/30 transition-all mb-4">
                  <Store className="w-7 h-7 text-emerald-400" />
                </div>
                <h3 className="text-lg md:text-xl font-bold text-white mb-2">I'm a Vendor</h3>
                <p className="text-slate-400 text-xs md:text-sm leading-relaxed">
                  Upload and manage your products. Reach thousands of buyers instantly.
                </p>
              </div>
            </button>

            {/* Seller Option */}
            <button
              onClick={() => handleRoleSelect('seller')}
              className="group relative overflow-hidden rounded-2xl p-4 md:p-8 bg-gradient-to-br from-violet-500/10 to-violet-600/5 border-2 border-violet-500/20 hover:border-violet-500/60 transition-all duration-300 hover:shadow-lg hover:shadow-violet-500/20 text-left"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500/0 to-violet-600/0 group-hover:from-violet-500/5 group-hover:to-violet-600/5 transition-all duration-300"></div>
              <div className="relative z-10">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-violet-500/20 group-hover:bg-violet-500/30 transition-all mb-4">
                  <TrendingUp className="w-7 h-7 text-violet-400" />
                </div>
                <h3 className="text-lg md:text-xl font-bold text-white mb-2">I'm a Seller</h3>
                <p className="text-slate-400 text-xs md:text-sm leading-relaxed">
                  Resell products and earn commissions without inventory.
                </p>
              </div>
            </button>
          </div>


        </div>
      </div>
    </div>
  );
}
