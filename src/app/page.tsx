'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CheckCircle, Store, CreditCard, TrendingUp, Sparkles, Wallet, FileText, Percent, CheckCircle2, Share2, Users } from 'lucide-react';
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
      title: 'Get an Army of Commission-Only Sellers for Your Digital Course.',
      subtitle:
        'List your course for ₹0. Our network of outbound closers pitches your product on WhatsApp and calls. You keep a flat 80% of every sale—we only make money when you do.',
      cta: 'Join as Vendor',
    },
    benefits: [
      {
        icon: CheckCircle,
        title: '₹0 Upfront Fees or Retainers',
        desc: 'Stop paying marketing agencies huge monthly retainers. You only pay a 20% platform/seller split after a verified sale lands in your dashboard.',
      },
      {
        icon: CreditCard,
        title: 'We Handle the Checkout',
        desc: 'We process the UPI/Card payment and handle the affiliate tracking. You just grant the student access to your LMS when the sale clears.',
      },
      {
        icon: TrendingUp,
        title: 'High-Ticket Friendly',
        desc: 'Have a ₹10,000+ cohort? Our sellers are trained to close high-ticket deals over the phone using your syllabus and brochures.',
      },
      {
        icon: Users,
        title: 'Complete Audience Ownership',
        desc: "We pass the buyer's Name, Email, and WhatsApp directly to you upon purchase so you own your customer data forever.",
      },
    ],
    features: [
      {
        step: '01',
        title: 'Create Account',
        desc: 'Sign up in 60 seconds and connect your payout bank account.',
      },
      {
        step: '02',
        title: 'Upload Course Details',
        desc: 'Add your syllabus, pricing, and a 100% discount coupon code (or webhook) so we can auto-enroll buyers on your site.',
      },
      {
        step: '03',
        title: 'Sellers Start Pitching',
        desc: 'Our outbound network grabs your referral link and pitches your course to their audience.',
      },
      {
        step: '04',
        title: 'You Keep 80%',
        desc: 'The buyer pays via our secure checkout. You get 80% deposited directly into your bank, hassle-free.',
      },
    ],
    stats: [
      { value: '₹0', label: 'Upfront Listing Cost' },
      { value: '80%', label: 'Direct Revenue Retention' },
      { value: 'Zero', label: 'Ad Spend Required' },
    ],
  };

  // SELLER VIEW
  const sellerData = {
    hero: {
      badge: '₹0 Upfront Investment • Flat 10% Commission',
      title: 'Sell Digital Courses. Earn a Flat 10% on Every Sale.',
      subtitle:
        'Promote vetted digital products from top Indian creators and get paid directly to your bank account—with ₹0 upfront investment.',
      cta: 'Start Earning as a Seller',
      secondaryCta: 'Explore High-Commission Products',
    },
    commissionMath: {
      heading: 'Simple Math. Fast Bank Withdrawals.',
      cards: [
        {
          icon: Percent,
          title: '10% Flat Commission',
          copy: 'Earn a guaranteed 10% on every verified sale (e.g., earn ₹1,550 on a single ₹15,500 course enrollment).',
        },
        {
          icon: FileText,
          title: 'Ready-to-Pitch Kits',
          copy: 'No guessing what to say. Every listing includes buyer personas, WhatsApp pitch templates, and promotional graphics.',
        },
        {
          icon: Wallet,
          title: 'Free Withdrawals Above ₹500',
          copy: 'Track clicks and conversions in real time. Cash out your in-app wallet directly to your bank with ₹0 platform payout fees.',
        },
      ],
    },
    features: [
      {
        step: '01',
        title: 'Create Seller Account',
        desc: 'Sign up in 60 seconds and activate your in-app earnings wallet.',
      },
      {
        step: '02',
        title: 'Pick Products & Grab Links',
        desc: 'Browse the catalog and generate your unique tracking link in one click.',
      },
      {
        step: '03',
        title: 'Share & Close Sales',
        desc: 'Pitch leads via WhatsApp, DMs, or calls while our checkout handles delivery.',
      },
      {
        step: '04',
        title: 'Withdraw to Your Bank',
        desc: 'Watch commissions hit your wallet instantly and withdraw them to your bank.',
      },
    ],
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

              {/* 3 Trust Pills */}
              <div className="grid grid-cols-3 gap-4 mt-12 pt-12 border-t border-slate-800">
                <div>
                  <div className="text-2xl md:text-3xl font-bold text-emerald-400 mb-1">₹0</div>
                  <div className="text-xs md:text-sm text-slate-400">Upfront Listing Cost</div>
                </div>
                <div>
                  <div className="text-2xl md:text-3xl font-bold text-emerald-400 mb-1">80%</div>
                  <div className="text-xs md:text-sm text-slate-400">Direct Revenue Retention</div>
                </div>
                <div>
                  <div className="text-2xl md:text-3xl font-bold text-emerald-400 mb-1">Zero</div>
                  <div className="text-xs md:text-sm text-slate-400">Ad Spend Required</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {selectedRole === 'seller' && (
        <section className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pt-20 pb-12 md:pt-28 md:pb-16 relative overflow-hidden border-b border-slate-800">
          {/* Background Effects */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-96 h-96 bg-violet-600 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-violet-600 rounded-full blur-3xl"></div>
          </div>

          <div className="container-custom relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight text-white tracking-tight">
                {sellerData.hero.title}
              </h1>
              <p className="text-lg md:text-xl mb-10 text-slate-300 leading-relaxed max-w-2xl mx-auto">
                {sellerData.hero.subtitle}
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row justify-center gap-3">
                <Link
                  href="/auth/signup?role=seller"
                  className="inline-flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-8 py-3.5 rounded-xl font-semibold transition-colors shadow-lg shadow-violet-600/25"
                >
                  <TrendingUp className="w-5 h-5" />
                  {sellerData.hero.cta}
                </Link>
                <Link
                  href="/seller/marketplace?guestRole=seller"
                  className="inline-flex items-center justify-center gap-2 border border-violet-500/50 text-violet-200 hover:bg-violet-500/10 px-8 py-3.5 rounded-xl font-semibold transition-colors"
                >
                  {sellerData.hero.secondaryCta}
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* SELLER: "Show, Don't Tell" Visual Block */}
      {selectedRole === 'seller' && (
        <section className="py-12 md:py-16 bg-slate-950 relative border-b border-slate-800/80 overflow-hidden">
          {/* Ambient Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="container-custom relative z-10">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-8">
                <span className="text-xs uppercase tracking-wider text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
                  Live Marketplace Example
                </span>
                <h2 className="text-2xl md:text-3xl font-bold text-white mt-3">
                  See Exactly How Much You Earn Per Close
                </h2>
                <p className="text-sm md:text-base text-slate-400 mt-1 max-w-xl mx-auto">
                  No guesswork. Every verified digital sale pays a guaranteed 10% direct to your bank.
                </p>
              </div>

              {/* The Visual Mockup Card & Arrow Block */}
              <div className="relative flex flex-col lg:flex-row items-center justify-center gap-6 lg:gap-10">
                {/* Marketplace Card Mockup */}
                <div className="w-full max-w-md rounded-2xl border-2 border-emerald-500/40 bg-slate-900/95 shadow-[0_20px_50px_rgba(16,185,129,0.15)] overflow-hidden flex flex-col">
                  {/* Card Cover with Stock Market Visual */}
                  <div className="h-44 bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 p-4 relative overflow-hidden flex flex-col justify-between border-b border-slate-800">
                    <div className="flex items-center justify-between z-10">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-emerald-300 bg-emerald-950/80 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                        🔥 High Demand Course
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-300 bg-emerald-500/20 border border-emerald-400/40 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        In Store
                      </span>
                    </div>

                    {/* Stock Chart Header Info */}
                    <div className="my-auto z-10">
                      <div className="text-xs font-semibold text-slate-400">Stock Market &amp; Technical Analysis</div>
                      <div className="text-xl font-bold text-white mt-0.5 flex items-center gap-2">
                        ₹15,500 Stock Market Course
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-400 z-10">
                      <span>By Top Indian Analyst</span>
                      <span>⭐ 4.9 (1,240+ reviews)</span>
                    </div>

                    {/* Background Candlestick Graphic */}
                    <div className="absolute -right-4 -bottom-6 opacity-20 pointer-events-none">
                      <TrendingUp className="w-48 h-48 text-emerald-400" />
                    </div>
                  </div>

                  {/* Card Content & Commission Box */}
                  <div className="p-5 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400 font-medium">Customer Selling Price</span>
                      <span className="text-xl font-black text-white tabular-nums">₹15,500</span>
                    </div>

                    {/* TARGET BOX: YOUR COMMISSION */}
                    <div className="relative rounded-xl border-2 border-emerald-400 bg-emerald-500/10 p-4 shadow-[0_0_25px_rgba(16,185,129,0.2)] ring-2 ring-emerald-500/20">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                          Your Commission
                        </span>
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-950 bg-emerald-400 px-2 py-0.5 rounded font-mono">
                          ₹1,550 PER SALE
                        </span>
                      </div>
                      <div className="mt-2 flex items-baseline justify-between">
                        <p className="text-3xl font-black text-emerald-300 tabular-nums tracking-tight">
                          ₹1,550
                        </p>
                        <span className="text-xs font-medium text-emerald-400/90">
                          10% per enrollment
                        </span>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-emerald-400/20 flex items-center justify-between text-xs">
                        <span className="text-slate-300 font-medium">If you sell 5 units:</span>
                        <span className="font-black text-emerald-300 tabular-nums text-sm">
                          ₹7,750 direct payout
                        </span>
                      </div>
                    </div>

                    {/* Mock Action Buttons */}
                    <div className="grid grid-cols-2 gap-2.5 pt-1">
                      <div className="py-2.5 px-3 rounded-lg bg-violet-600 text-white text-xs font-bold text-center flex items-center justify-center gap-1.5 shadow-sm">
                        <Share2 className="w-3.5 h-3.5" />
                        Copy Referral Link
                      </div>
                      <div className="py-2.5 px-3 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold text-center flex items-center justify-center gap-1.5">
                        <FileText className="w-3.5 h-3.5" />
                        Download Brochure
                      </div>
                    </div>
                  </div>
                </div>

                {/* Visual Arrow & Callout Pointer */}
                <div className="w-full lg:max-w-xs flex flex-col items-center lg:items-start text-center lg:text-left">
                  {/* Arrow Pointing Directly to the Commission Box */}
                  <div className="hidden lg:flex items-center gap-2 text-emerald-400 mb-3 animate-pulse">
                    <span className="text-3xl font-bold">←</span>
                    <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 rounded-full">
                      ₹1,550 PER SALE
                    </span>
                  </div>

                  <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-5 shadow-xl">
                    <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full mb-3">
                      <Sparkles className="w-3.5 h-3.5" />
                      Instant Rupee Value
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2 leading-snug">
                      Earn ₹1,550 on Every Single Sale
                    </h3>
                    <p className="text-sm text-slate-300 leading-relaxed mb-4">
                      Close just <strong className="text-white">1 student enrollment a day</strong> and take home{' '}
                      <strong className="text-emerald-300 font-bold">₹46,500/month</strong> deposited straight into your bank account.
                    </p>
                    <div className="space-y-2 text-xs text-slate-400 border-t border-slate-800 pt-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                        <span>₹0 upfront inventory or course creation</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                        <span>Ready-made WhatsApp scripts included</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                        <span>Instant wallet crediting upon checkout</span>
                      </div>
                    </div>
                  </div>
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
            <div className="text-center mb-8 md:mb-10">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">Why Vendors Trust Agent Croww</h2>
              <p className="text-slate-400 text-sm md:text-base">Built specifically for digital creators and course founders</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {vendorData.benefits.map((benefit, index) => {
                const Icon = benefit.icon;
                return (
                  <div
                    key={index}
                    className="bg-slate-900 border border-slate-800 rounded-xl md:rounded-2xl p-5 md:p-6 hover:border-emerald-600/50 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-600/10 flex flex-col"
                  >
                    <div className="inline-flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-lg md:rounded-xl bg-emerald-600/20 text-emerald-400 mb-4">
                      <Icon className="w-6 h-6 md:w-7 md:h-7" />
                    </div>
                    <h3 className="font-bold text-white text-lg md:text-xl mb-2">{benefit.title}</h3>
                    <p className="text-slate-300 text-sm leading-relaxed">{benefit.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* SELLER: Clear Commission Math (Combined 3-Card Section) */}
      {selectedRole === 'seller' && (
        <section className="section-sm border-b border-slate-800">
          <div className="container-custom">
            <div className="text-center mb-8 md:mb-12">
              <h2 className="text-2xl md:text-4xl font-bold text-white mb-3">
                {sellerData.commissionMath.heading}
              </h2>
              <p className="text-slate-400 text-sm md:text-base max-w-xl mx-auto">
                Know exactly what you earn before you share a link—no hidden deductions.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
              {sellerData.commissionMath.cards.map((card, index) => {
                const Icon = card.icon;
                return (
                  <div
                    key={index}
                    className={`bg-slate-900 border rounded-xl md:rounded-2xl p-6 transition-all duration-300 flex flex-col justify-between ${
                      index === 0
                        ? 'border-emerald-500/50 shadow-lg shadow-emerald-500/5'
                        : 'border-slate-800 hover:border-violet-600/50'
                    }`}
                  >
                    <div>
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-violet-600/20 text-violet-400 mb-4">
                        <Icon className="w-6 h-6" />
                      </div>
                      <h3 className="font-bold text-white mb-2 text-lg md:text-xl">{card.title}</h3>
                      <p className="text-slate-300 text-sm leading-relaxed">{card.copy}</p>
                    </div>
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
            <div className="text-center mb-10 md:mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Transparent Commission Structure</h2>
              <p className="text-slate-400 text-sm md:text-base">No hidden charges, just simple pricing</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              <div className="bg-slate-900 border-2 border-slate-800 rounded-2xl p-8 hover:border-emerald-600/50 transition-all duration-300 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-2xl text-white mb-2">Vendor Commission</h3>
                  <p className="text-slate-400 text-sm mb-6">Earn on every sale</p>
                </div>
                <div className="inline-flex items-baseline gap-2">
                  <span className="text-5xl font-black text-emerald-400">80%</span>
                  <span className="text-slate-400 text-base font-medium">you keep</span>
                </div>
              </div>

              <div className="bg-slate-900 border-2 border-emerald-600/50 rounded-2xl p-8 relative">
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-emerald-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                  BREAKDOWN
                </div>
                <h3 className="font-bold text-2xl text-white mb-2">Commission Split</h3>
                <p className="text-slate-400 text-sm mb-4">Transparent for all products</p>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300 font-medium">Vendor (You)</span>
                    <span className="font-bold text-emerald-400 text-lg">80%</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-slate-800 pt-2.5">
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

            {/* Green Join as Vendor CTA button placed directly under the Commission Split box */}
            <div className="mt-8 text-center">
              <Link
                href="/auth/signup?role=vendor"
                className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-9 py-3.5 rounded-xl font-semibold transition-colors shadow-lg shadow-emerald-600/25 text-base"
              >
                <Store className="w-5 h-5" />
                Join as Vendor
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* CTA Section (Seller Only) */}
      {selectedRole === 'seller' && (
        <section className="section-sm relative overflow-hidden border-t border-slate-800">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-96 h-96 bg-sky-600 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-sky-600 rounded-full blur-3xl"></div>
          </div>

          <div className="container-custom relative z-10">
            <div className="max-w-3xl mx-auto text-center">
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
            </div>
          </div>
        </section>
      )}

    </div>
  );
}
