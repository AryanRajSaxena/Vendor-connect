'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CheckCircle, Store, BarChart3, Percent, Lightbulb, CreditCard, Users, TrendingUp, Package, Star } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { RoleSelectorModal, UserRole } from '@/components/shared/RoleSelectorModal';

export default function HomePage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [selectedRole, setSelectedRole] = useState<UserRole>('vendor');
  const vendorGoogleFormUrl = 'https://docs.google.com/forms/d/e/1FAIpQLSe3O2kev5R9Dc_3wpaCl-hztNa3Map144tJ1LzsMMExV1HD-g/viewform?usp=sharing&ouid=103901138410908298709';
  const sellerGoogleFormUrl = 'https://docs.google.com/forms/d/e/1FAIpQLSc6lk7Ub8YHbWuii508_ENinZNroZyqyuQbbslstRdCaCCScg/viewform?usp=sharing&ouid=103901138410908298709';

  // Load saved role from localStorage on mount
  useEffect(() => {
    const savedRole = localStorage.getItem('landingPage_selectedRole') as UserRole;
    if (savedRole && (savedRole === 'vendor' || savedRole === 'seller')) {
      setSelectedRole(savedRole);
    }

    const handleRoleUpdate = () => {
      const updated = localStorage.getItem('landingPage_selectedRole') as UserRole;
      if (updated === 'vendor' || updated === 'seller') setSelectedRole(updated);
    };
    window.addEventListener('landingRole-updated', handleRoleUpdate);
    return () => window.removeEventListener('landingRole-updated', handleRoleUpdate);
  }, []);

  // Redirect non-customer users to their dashboards
  useEffect(() => {
    if (!isLoading && user) {
      switch (user.role) {
        case 'vendor':
          router.push('/vendor/dashboard');
          return;
        case 'seller':
          router.push('/seller/dashboard');
          return;
        case 'admin':
          router.push('/admin/dashboard');
          return;
      }
    }
  }, [user, isLoading, router]);

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    window.dispatchEvent(new Event('landingRole-updated'));
  };

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="text-center">
          <div className="spinner w-12 h-12 mx-auto mb-4"></div>
          <p className="text-slate-400 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // ===== DUMMY DATA FOR DIFFERENT ROLES =====

  // CUSTOMER VIEW
  // VENDOR VIEW
  const vendorData = {
    hero: {
      title: 'Grow Your Business on Agent Croww',
      subtitle: 'List your products to reach thousands of buyers instantly',
      cta: 'Join as Vendor'
    },
    benefits: [
      { icon: Users, title: '50k+ Active Buyers', desc: 'Reach verified customers across India' },
      { icon: BarChart3, title: 'Real-Time Analytics', desc: 'Track sales, views, and customer behavior' },
      { icon: TrendingUp, title: 'Boost Your Sales', desc: 'Integrated marketplace with built-in buyers' },
      { icon: CreditCard, title: 'Easy Payouts', desc: 'Fast and secure payment processing' },
    ],
    features: [
      { step: '01', title: 'Create Account', desc: 'Sign up in 2 minutes with basic information' },
      { step: '02', title: 'Upload Products', desc: 'Add unlimited products with photos and details' },
      { step: '03', title: 'Start Selling', desc: 'Receive orders and manage shipments easily' },
      { step: '04', title: 'Earn & Grow', desc: 'Get paid on time and track your growth' },
    ],
    stats: [
      { value: '10k+', label: 'Active Vendors', icon: Store },
      { value: '15k+', label: 'Products Listed', icon: Package },
      { value: '₹50Cr+', label: 'Total Sales', icon: TrendingUp },
      { value: '98%', label: 'Satisfaction Rate', icon: CheckCircle },
    ]
  };

  // SELLER VIEW
  const sellerData = {
    hero: {
      title: 'Earn Commissions Without Inventory',
      subtitle: 'Become a seller and earn commissions on sales',
      cta: 'Join as Seller'
    },
    benefits: [
      { icon: Percent, title: '10% Commission', desc: 'Earn commission on every product you sell' },
      { icon: Lightbulb, title: 'Zero Risk Model', desc: 'No inventory hassles, no stock management' },
    ],
    features: [
      { step: '01', title: 'Sign up on Platform', desc: 'Register as a seller in just 2 minutes' },
      { step: '02', title: 'Choose Products', desc: 'Select products to sell from our catalog' },
      { step: '03', title: 'Track Earnings', desc: 'Monitor commissions and payouts in real-time' },
    ],
    stats: [
      { value: '15k+', label: 'Active Sellers', icon: Users },
      { value: '₹20Cr+', label: 'Commissions Paid', icon: TrendingUp },
      { value: '2000+', label: 'Products Available', icon: Package },
      { value: '4.8/5', label: 'Avg Rating', icon: Star },
    ]
  };

  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen">
      {/* Role Selector Modal */}
      <RoleSelectorModal onRoleSelect={handleRoleSelect} />

      {/* ===== ROLE-SPECIFIC HERO SECTION ===== */}
      {selectedRole === 'vendor' && (
        <section className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 py-20 md:py-28 relative overflow-hidden border-b border-slate-800">
          {/* Background Effects */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-600 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-600 rounded-full blur-3xl"></div>
          </div>

          <div className="container-custom relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight text-white">
                {vendorData.hero.title}
              </h1>
              <p className="text-lg md:text-xl mb-10 text-slate-300 leading-relaxed">
                {vendorData.hero.subtitle}
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row justify-center gap-3">
                <a
                  href={vendorGoogleFormUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-xl font-semibold transition-colors shadow-lg shadow-emerald-600/20"
                >
                  <Store className="w-5 h-5" />
                  {vendorData.hero.cta}
                </a>
                <Link href="/seller/marketplace?guestRole=vendor" className="inline-flex items-center justify-center gap-2 border border-emerald-500/50 text-emerald-200 hover:bg-emerald-500/10 px-8 py-3 rounded-xl font-semibold transition-colors">
                  Browse Products
                </Link>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mt-12 pt-12 border-t border-slate-800">
                <div>
                  <div className="text-2xl md:text-3xl font-bold text-emerald-400 mb-1">10k+</div>
                  <div className="text-sm text-slate-400">Active Vendors</div>
                </div>
                <div>
                  <div className="text-2xl md:text-3xl font-bold text-emerald-400 mb-1">₹50Cr+</div>
                  <div className="text-sm text-slate-400">Total Sales</div>
                </div>
                <div>
                  <div className="text-2xl md:text-3xl font-bold text-emerald-400 mb-1">15k+</div>
                  <div className="text-sm text-slate-400">Products</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {selectedRole === 'seller' && (
        <section className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 py-20 md:py-28 relative overflow-hidden border-b border-slate-800">
          {/* Background Effects */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-96 h-96 bg-violet-600 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-violet-600 rounded-full blur-3xl"></div>
          </div>

          <div className="container-custom relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight text-white">
                {sellerData.hero.title}
              </h1>
              <p className="text-lg md:text-xl mb-10 text-slate-300 leading-relaxed">
                {sellerData.hero.subtitle}
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row justify-center gap-3">
                <a
                  href={sellerGoogleFormUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-8 py-3 rounded-xl font-semibold transition-colors shadow-lg shadow-violet-600/20"
                >
                  {sellerData.hero.cta}
                </a>
                <Link href="/seller/marketplace?guestRole=seller" className="inline-flex items-center justify-center gap-2 border border-violet-500/50 text-violet-200 hover:bg-violet-500/10 px-8 py-3 rounded-xl font-semibold transition-colors">
                  Browse Products
                </Link>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mt-12 pt-12 border-t border-slate-800">
                <div>
                  <div className="text-2xl md:text-3xl font-bold text-violet-400 mb-1">15k+</div>
                  <div className="text-sm text-slate-400">Active Sellers</div>
                </div>
                <div>
                  <div className="text-2xl md:text-3xl font-bold text-violet-400 mb-1">₹20Cr+</div>
                  <div className="text-sm text-slate-400">Commissions Paid</div>
                </div>
                <div>
                  <div className="text-2xl md:text-3xl font-bold text-violet-400 mb-1">2000+</div>
                  <div className="text-sm text-slate-400">Products</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* VENDOR: Benefits Section */}
      {selectedRole === 'vendor' && (
        <section className="section-sm">
          <div className="container-custom">
            <div className="text-center mb-6">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">Why Vendors Trust Agent Croww</h2>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {vendorData.benefits.map((benefit, index) => {
                const Icon = benefit.icon;
                return (
                  <div
                    key={index}
                    className="bg-slate-900 border border-slate-800 rounded-xl md:rounded-2xl p-4 md:p-5 hover:border-emerald-600/50 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-600/10"
                  >
                    <div className="inline-flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-lg md:rounded-xl bg-emerald-600/20 text-emerald-400 mb-3">
                      <Icon className="w-6 h-6 md:w-7 md:h-7" />
                    </div>
                    <h3 className="font-bold text-white text-base md:text-lg">{benefit.title}</h3>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* SELLER: Benefits Section */}
      {selectedRole === 'seller' && (
        <section className="section-sm">
          <div className="container-custom">
            <div className="text-center mb-8 md:mb-10">
              <h2 className="text-2xl md:text-4xl font-bold text-white mb-3">Why Choose Agent Croww</h2>
              <p className="text-slate-400 text-base md:text-lg">Start earning with zero risk and investment</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {sellerData.benefits.map((benefit, index) => {
                const Icon = benefit.icon;
                return (
                  <div
                    key={index}
                    className="bg-slate-900 border border-slate-800 rounded-xl md:rounded-2xl p-4 md:p-6 hover:border-violet-600/50 transition-all duration-300 hover:shadow-lg hover:shadow-violet-600/10"
                  >
                    <div className="inline-flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-lg md:rounded-xl bg-violet-600/20 text-violet-400 mb-3 md:mb-4">
                      <Icon className="w-6 h-6 md:w-7 md:h-7" />
                    </div>
                    <h3 className="font-bold text-white mb-2 text-base md:text-lg">{benefit.title}</h3>
                    <p className="text-slate-400 text-sm">{benefit.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* VENDOR: Onboarding Steps */}
      {selectedRole === 'vendor' && (
        <section className="section-sm bg-slate-900/50 border-b border-slate-800">
          <div className="container-custom">
            <div className="text-center mb-6">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">Get Started in 4 Simple Steps</h2>
              <p className="text-slate-400 text-base md:text-base">Start selling in minutes</p>
            </div>

            <div className="grid grid-cols-2 gap-3 md:gap-4">
              {vendorData.features.map((item, index) => (
                <div key={index} className="relative">
                  <div className="bg-slate-900 border border-slate-800 rounded-lg md:rounded-xl p-4 md:p-5 hover:border-emerald-600/50 transition-all duration-300">
                    <div className="text-3xl md:text-4xl font-bold text-emerald-400 mb-2">{item.step}</div>
                    <h3 className="font-bold text-sm md:text-base text-emerald-100 mb-1">{item.title}</h3>
                    <p className="text-slate-400 text-xs md:text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* SELLER: Onboarding Steps */}
      {selectedRole === 'seller' && (
        <section className="section-sm bg-slate-900/50 border-b border-slate-800">
          <div className="container-custom">
            <div className="text-center mb-8 md:mb-10">
              <h2 className="text-2xl md:text-4xl font-bold text-white mb-3">Get Started in 3 Simple Steps</h2>
              <p className="text-slate-400">Start earning within 24 hours</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              {sellerData.features.map((item, index) => (
                <div key={index} className="relative">
                  <div className="bg-slate-900 border border-slate-800 rounded-xl md:rounded-2xl p-5 md:p-6 hover:border-violet-600/50 transition-all duration-300">
                    <div className="text-4xl md:text-5xl font-bold text-violet-400 mb-3">{item.step}</div>
                    <h3 className="font-bold text-lg md:text-xl text-violet-100 mb-2">{item.title}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* VENDOR: Commission & Pricing */}
      {selectedRole === 'vendor' && (
        <section className="section-sm border-b border-slate-800">
          <div className="container-custom">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Transparent Commission Structure</h2>
              <p className="text-slate-400">No hidden charges, just simple pricing</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-900 border-2 border-slate-800 rounded-2xl p-8 hover:border-emerald-600/50 transition-all duration-300">
                <h3 className="font-bold text-2xl text-white mb-2">Vendor Commission</h3>
                <p className="text-slate-400 text-sm mb-4">Earn on every sale</p>
                <div className="inline-flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-emerald-400">80%</span>
                  <span className="text-slate-400">you keep</span>
                </div>
              </div>

              <div className="bg-slate-900 border-2 border-emerald-600/50 rounded-2xl p-8 relative">
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-emerald-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                  BREAKDOWN
                </div>
                <h3 className="font-bold text-2xl text-white mb-2">Commission Split</h3>
                <p className="text-slate-400 text-sm mb-4">Transparent for all products</p>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300">Vendor (You)</span>
                    <span className="font-bold text-emerald-400">80%</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-slate-700 pt-2">
                    <span className="text-slate-400 text-sm">Platform</span>
                    <span className="font-bold text-slate-300 text-sm">10%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm">Seller</span>
                    <span className="font-bold text-slate-300 text-sm">10%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="section-sm relative overflow-hidden border-t border-slate-800">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-sky-600 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-sky-600 rounded-full blur-3xl"></div>
        </div>

        <div className="container-custom relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            {selectedRole === 'vendor' && (
              <>
                <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Start Growing Your Business Today</h2>
                <p className="text-lg md:text-xl text-slate-300 mb-10">
                  Join thousand of successful vendors and scale your sales
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <a
                    href={vendorGoogleFormUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-xl font-semibold transition-colors shadow-lg shadow-emerald-600/20"
                  >
                    <Store className="w-5 h-5" />
                    Join as Vendor
                  </a>
                </div>
              </>
            )}

            {selectedRole === 'seller' && (
              <>
                <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Start Earning This Week</h2>
                <p className="text-lg md:text-xl text-slate-300 mb-10">
                  Join tens of thousands of sellers and build your passive income
                </p>
                <div className="flex justify-center">
                  <a
                    href={sellerGoogleFormUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-8 py-3 rounded-xl font-semibold transition-colors shadow-lg shadow-violet-600/20"
                  >
                    <TrendingUp className="w-5 h-5" />
                    Join As Seller
                  </a>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

    </div>
  );
}
