'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CheckCircle, Store, BarChart3, CreditCard, TrendingUp, Sparkles, Wallet, FileText } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { RoleSelectorModal, UserRole } from '@/components/shared/RoleSelectorModal';

export default function HomePage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [selectedRole, setSelectedRole] = useState<UserRole>('vendor');

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
      { icon: CheckCircle, title: '₹0 Upfront Listing Cost', desc: 'List your courses and digital products with zero upfront fees' },
      { icon: BarChart3, title: 'Real-Time Analytics', desc: 'Track sales, views, and customer behavior' },
      { icon: TrendingUp, title: 'Boost Your Sales', desc: 'Integrated marketplace with built-in buyers' },
      { icon: CreditCard, title: 'Easy Payouts', desc: 'Fast and secure payment processing' },
    ],
    features: [
      { step: '01', title: 'Create Account', desc: 'Sign up in 2 minutes with basic information' },
      { step: '02', title: 'Upload Digital Products', desc: 'List your courses, e-books, workshops, or templates in minutes for ₹0 upfront.' },
      { step: '03', title: 'Automated Delivery', desc: 'Buyers get instant access to your files or course links the moment an order completes.' },
      { step: '04', title: 'Earn & Grow', desc: 'Get paid on time and track your growth' },
    ],
    stats: [
      { value: '₹0', label: 'Upfront Listing Cost', icon: CheckCircle },
      { value: '80%', label: 'Direct Revenue Retention', icon: TrendingUp },
      { value: 'Instant', label: 'Wallet Crediting', icon: CreditCard },
      { value: '100%', label: 'Automated Delivery', icon: CheckCircle },
    ]
  };

  // SELLER VIEW
  const sellerData = {
    hero: {
      badge: '₹0 Joining Fee • Instant Wallet Tracking',
      title: 'Monetize Your Network & Sales Skills. Earn Commissions on Every Digital Sale.',
      subtitle: 'Pick vetted digital courses, e-books, and templates from top Indian creators. Share your custom tracking link, close leads on WhatsApp or social media, and withdraw your commissions directly to your bank account.',
      cta: 'Start Earning as a Seller',
      secondaryCta: 'Explore High-Commission Products'
    },
    trustBar: [
      { title: '₹0 Capital Needed', desc: 'Instant access to the full product catalog' },
      { title: 'Ready-to-Pitch Kits', desc: 'Scripts, reels & assets included per product' },
      { title: '₹500+ Free Payouts', desc: 'Zero withdrawal fees above ₹500' },
    ],
    benefits: [
      { 
        icon: FileText, 
        title: 'No More Guessing What to Say', 
        desc: 'Every top listing includes buyer persona notes, WhatsApp pitch templates, and promotional graphics so you can start closing on Day 1.' 
      },
      { 
        icon: Wallet, 
        title: 'Real-Time In-App Wallet', 
        desc: 'No 60-day lock-in periods or opaque spreadsheets. Every verified sale credits your seller wallet immediately with full transaction transparency.' 
      },
      { 
        icon: TrendingUp, 
        title: 'Built for Outbound Closers & Creators', 
        desc: 'Whether you run an Instagram theme page, manage a college community, or close B2C sales over WhatsApp and calls, you earn uncapped commissions on every conversion.' 
      },
    ],
    features: [
      { step: '01', title: 'Create Seller Account', desc: 'Sign up in 60 seconds for free. Set up your profile and activate your in-app earnings wallet immediately.' },
      { step: '02', title: 'Pick Products & Grab Links', desc: 'Browse vetted digital products and generate your unique tracking link in one click.' },
      { step: '03', title: 'Share & Close Sales', desc: 'Pitch via WhatsApp, DMs, or content while our checkout handles payment and delivery.' },
      { step: '04', title: 'Withdraw to Your Bank', desc: 'Watch commissions hit your Agent Croww wallet in real time. Withdraw directly to your bank account with ₹0 platform payout fees on withdrawals over ₹500.' },
    ],
    commission: {
      heading: 'Clear Commission Math. Fast Bank Withdrawals.',
      subtext: 'Know exactly what you earn before you share a link—no hidden deductions.',
      columns: [
        {
          title: 'Your Commission',
          highlight: '10% – 40% per sale',
          desc: 'Earn transparent commissions on every verified order (e.g., earn ₹200 to ₹800 on a single ₹2,000 course enrollment).'
        },
        {
          title: 'In-App Wallet',
          highlight: 'Instant Crediting',
          desc: 'Track clicks, conversions, and pending balances live inside your Seller Dashboard the moment a customer checks out.'
        },
        {
          title: 'Bank Withdrawals',
          highlight: 'Free Above ₹500',
          desc: 'Cash out your wallet balance anytime. Agent Croww covers 100% of the payout processing fee on all withdrawals over ₹500.'
        }
      ]
    }
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
                <Link
                  href="/auth/signup?role=vendor"
                  className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-xl font-semibold transition-colors shadow-lg shadow-emerald-600/20"
                >
                  <Store className="w-5 h-5" />
                  {vendorData.hero.cta}
                </Link>
                <Link href="/seller/marketplace?guestRole=vendor" className="inline-flex items-center justify-center gap-2 border border-emerald-500/50 text-emerald-200 hover:bg-emerald-500/10 px-8 py-3 rounded-xl font-semibold transition-colors">
                  Browse Products
                </Link>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mt-12 pt-12 border-t border-slate-800">
                <div>
                  <div className="text-2xl md:text-3xl font-bold text-emerald-400 mb-1">₹0</div>
                  <div className="text-sm text-slate-400">Upfront Listing Cost</div>
                </div>
                <div>
                  <div className="text-2xl md:text-3xl font-bold text-emerald-400 mb-1">80%</div>
                  <div className="text-sm text-slate-400">Direct Revenue Retention</div>
                </div>
                <div>
                  <div className="text-2xl md:text-3xl font-bold text-emerald-400 mb-1">Instant</div>
                  <div className="text-sm text-slate-400">Wallet Crediting</div>
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
              {/* Top Pill Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs md:text-sm font-medium mb-6">
                <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                <span>{sellerData.hero.badge}</span>
              </div>

              <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight text-white">
                {sellerData.hero.title}
              </h1>
              <p className="text-lg md:text-xl mb-10 text-slate-300 leading-relaxed">
                {sellerData.hero.subtitle}
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row justify-center gap-3">
                <Link
                  href="/auth/signup?role=seller"
                  className="inline-flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-8 py-3 rounded-xl font-semibold transition-colors shadow-lg shadow-violet-600/20"
                >
                  <TrendingUp className="w-5 h-5" />
                  {sellerData.hero.cta}
                </Link>
                <Link href="/seller/marketplace?guestRole=seller" className="inline-flex items-center justify-center gap-2 border border-violet-500/50 text-violet-200 hover:bg-violet-500/10 px-8 py-3 rounded-xl font-semibold transition-colors">
                  {sellerData.hero.secondaryCta}
                </Link>
              </div>

              {/* Trust Bar (Replaces the 3 stat counters below the Hero) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12 pt-12 border-t border-slate-800 text-center">
                {sellerData.trustBar.map((item, idx) => (
                  <div key={idx} className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4">
                    <div className="text-base md:text-lg font-bold text-violet-400 mb-1">{item.title}</div>
                    <div className="text-xs md:text-sm text-slate-400 leading-snug">{item.desc}</div>
                  </div>
                ))}
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
              <h2 className="text-2xl md:text-4xl font-bold text-white mb-3">Why Sell on Agent Croww?</h2>
              <p className="text-slate-400 text-base md:text-lg">Built to help you convert leads and scale your affiliate income</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {sellerData.benefits.map((benefit, index) => {
                const Icon = benefit.icon;
                return (
                  <div
                    key={index}
                    className="bg-slate-900 border border-slate-800 rounded-xl md:rounded-2xl p-5 md:p-6 hover:border-violet-600/50 transition-all duration-300 hover:shadow-lg hover:shadow-violet-600/10 flex flex-col"
                  >
                    <div className="inline-flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-lg md:rounded-xl bg-violet-600/20 text-violet-400 mb-4">
                      <Icon className="w-6 h-6 md:w-7 md:h-7" />
                    </div>
                    <h3 className="font-bold text-white mb-2 text-base md:text-lg">{benefit.title}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">{benefit.desc}</p>
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

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              {vendorData.features.map((item, index) => (
                <div key={index} className="relative">
                  <div className="bg-slate-900 border border-slate-800 rounded-lg md:rounded-xl p-4 md:p-5 hover:border-emerald-600/50 transition-all duration-300 h-full flex flex-col">
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
            <div className="text-center mb-6 md:mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">Get Started in 4 Simple Steps</h2>
              <p className="text-slate-400">Start earning within 24 hours</p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              {sellerData.features.map((item, index) => (
                <div key={index} className="relative">
                  <div className="bg-slate-900 border border-slate-800 rounded-lg md:rounded-xl p-4 md:p-5 hover:border-violet-600/50 transition-all duration-300 h-full flex flex-col">
                    <div className="text-3xl md:text-4xl font-bold text-violet-400 mb-2">{item.step}</div>
                    <h3 className="font-bold text-sm md:text-base text-violet-100 mb-1">{item.title}</h3>
                    <p className="text-slate-400 text-xs md:text-sm leading-relaxed">{item.desc}</p>
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

      {/* SELLER: Commission & Pricing */}
      {selectedRole === 'seller' && (
        <section className="section-sm border-b border-slate-800">
          <div className="container-custom">
            <div className="text-center mb-10 md:mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
                {sellerData.commission.heading}
              </h2>
              <p className="text-slate-400 max-w-2xl mx-auto">
                {sellerData.commission.subtext}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {sellerData.commission.columns.map((col, idx) => (
                <div
                  key={idx}
                  className={`bg-slate-900 border-2 rounded-2xl p-6 md:p-8 transition-all duration-300 flex flex-col justify-between ${
                    idx === 1
                      ? 'border-violet-600/50 relative'
                      : 'border-slate-800 hover:border-violet-600/50'
                  }`}
                >
                  {idx === 1 && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-violet-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                      LIVE TRACKING
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold text-xl text-white mb-1">{col.title}</h3>
                    <div className="text-2xl font-bold text-violet-400 mb-4">{col.highlight}</div>
                    <p className="text-slate-400 text-sm leading-relaxed">{col.desc}</p>
                  </div>
                </div>
              ))}
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
                  Join successful digital creators scaling their sales without upfront ad spend.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    href="/auth/signup?role=vendor"
                    className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-xl font-semibold transition-colors shadow-lg shadow-emerald-600/20"
                  >
                    <Store className="w-5 h-5" />
                    Join as Vendor
                  </Link>
                  <Link
                    href="/auth/login"
                    className="inline-flex items-center justify-center gap-2 border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white px-8 py-3 rounded-xl font-semibold transition-colors"
                  >
                    Sign In
                  </Link>
                </div>
              </>
            )}

            {selectedRole === 'seller' && (
              <>
                <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Ready to Turn Your Reach into Real Income?</h2>
                <p className="text-lg md:text-xl text-slate-300 mb-10">
                  Join digital marketers and closers earning uncapped commissions across India.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    href="/auth/signup?role=seller"
                    className="inline-flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-8 py-3 rounded-xl font-semibold transition-colors shadow-lg shadow-violet-600/20"
                  >
                    <TrendingUp className="w-5 h-5" />
                    Create Free Seller Account
                  </Link>
                  <Link
                    href="/seller/marketplace?guestRole=seller"
                    className="inline-flex items-center justify-center gap-2 border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white px-8 py-3 rounded-xl font-semibold transition-colors"
                  >
                    View Live Products
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

    </div>
  );
}
