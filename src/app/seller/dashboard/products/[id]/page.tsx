'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Trash2,
  Copy,
  CheckCircle2,
  Share2,
  Clock3,
  GraduationCap,
  ListChecks,
  BookOpen,
  AlertCircle,
  ExternalLink,
  Users,
  Target,
  MessageSquare,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Compass,
  Download,
  FileText,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency, getImageUrl } from '@/utils/calculations';

function WhatsAppIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.456 5.711 1.457h.005c6.554 0 11.89-5.335 11.893-11.893a11.82 11.82 0 00-3.48-8.413Z" />
    </svg>
  );
}

interface SellerProduct {
  id: string;
  productId: string;
  product_name: string;
  description: string;
  base_price: number;
  category: string;
  referral_code: string;
  sold_count: number;
  clicks: number;
  earnings: number;
  is_active?: boolean;
  images?: string[];
  specifications?: Record<string, any>;
  course_duration?: string;
  prerequisites?: string[];
  learning_outcomes?: string[];
  curriculum?: Array<{
    module?: number;
    title?: string;
    lessons?: number;
    duration?: string;
  }>;
  pdf_path?: string | null;
  sales_kit?: {
    target_audience?: string;
    where_to_find?: string;
    whatsapp_scripts?: Array<{ title: string; body: string }>;
    objections?: Array<{ question: string; answer: string }>;
  } | null;
  created_at: string;
}

export default function SellerProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const productId = params.id as string;

  const [product, setProduct] = useState<SellerProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  // Tabs & Interactive State
  const [activeTab, setActiveTab] = useState<'sales-kit' | 'curriculum'>('sales-kit');
  const [copiedScript, setCopiedScript] = useState<number | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    if (!user && !isLoading) {
      router.push('/login');
      return;
    }

    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/seller-products/${productId}`);
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to fetch product details');
        }
        const data = await res.json();
        const item = data.product || data;
        setProduct({
          id: item.id || productId,
          productId: item.product_id || item.productId || productId,
          product_name: item.product_name || item.products?.name || 'Untitled Course',
          description: item.description || item.products?.description || '',
          base_price: item.base_price ?? item.products?.base_price ?? 0,
          category: item.category || item.products?.category || 'Online Course',
          referral_code: item.referral_code || '',
          sold_count: item.sales ?? item.sold_count ?? 0,
          clicks: item.clicks ?? 0,
          earnings: item.earnings ?? 0,
          is_active: item.is_active ?? item.products?.is_active ?? true,
          images: item.images || item.products?.images || [],
          specifications: item.specifications || item.products?.specifications || {},
          course_duration: item.course_duration || item.products?.course_duration || '',
          prerequisites: item.prerequisites || item.products?.prerequisites || [],
          learning_outcomes: item.learning_outcomes || item.products?.learning_outcomes || [],
          curriculum: item.curriculum || item.products?.curriculum || [],
          pdf_path: item.pdf_path || item.products?.pdf_path || null,
          sales_kit: item.sales_kit || item.products?.sales_kit || null,
          created_at: item.created_at || item.added_at || '',
        });
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    if (user && productId) {
      fetchProduct();
    }
  }, [user, isLoading, productId, router]);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to remove this product from your store?')) return;
    try {
      setDeleting(true);
      const res = await fetch(`/api/seller-products/${productId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to remove product');
      router.push('/seller/dashboard');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setDeleting(false);
    }
  };

  const copyCode = () => {
    if (!product?.referral_code) return;
    navigator.clipboard.writeText(product.referral_code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const copyLink = () => {
    if (!product?.referral_code) return;
    const link = `${window.location.origin}/products?ref=${product.referral_code}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const copyScript = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedScript(index);
    setTimeout(() => setCopiedScript(null), 2000);
  };

  const handleWhatsAppShare = () => {
    if (!product?.referral_code) return;
    const link = `${window.location.origin}/products?ref=${product.referral_code}`;
    const text = `Hey! Check out this course: ${product.product_name} - ${link}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleDownloadPdf = async () => {
    if (!product) return;
    try {
      setDownloadingPdf(true);
      const targetId = product.productId || product.id || productId;
      const downloadEndpoint = `/api/products/${targetId}/syllabus`;
      const res = await fetch(downloadEndpoint);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || errData.details || `Download failed (HTTP ${res.status})`);
      }
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      const cleanName = product.product_name.replace(/[^a-zA-Z0-9_\-]/g, '_');
      a.download = `${cleanName}_Syllabus.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setDownloadingPdf(false);
    }
  };

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-slate-950">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="p-6 max-w-4xl mx-auto min-h-screen bg-slate-950">
        <div className="bg-red-950/40 border border-red-800 rounded-xl p-5 text-red-200">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <h2 className="font-semibold text-red-300">Error loading product</h2>
          </div>
          <p className="text-sm text-red-300 mb-4">{error || 'Product not found'}</p>
          <Link
            href="/seller/dashboard"
            className="text-sm text-red-400 font-medium flex items-center gap-1 hover:underline"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const imgUrl = getImageUrl(product.images?.[0]);
  const referralLink = typeof window !== 'undefined'
    ? `${window.location.origin}/products?ref=${product.referral_code}`
    : `/products?ref=${product.referral_code}`;
  const highlightText = String(product.specifications?.highlights || '');
  const features = highlightText
    .split('|||')
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 8);
  const prerequisites = (Array.isArray(product.prerequisites) ? product.prerequisites : [])
    .map((item) => String(item).trim())
    .filter(Boolean)
    .slice(0, 10);
  const learningOutcomes = (Array.isArray(product.learning_outcomes) ? product.learning_outcomes : [])
    .map((item) => String(item).trim())
    .filter(Boolean)
    .slice(0, 10);
  const curriculum = (Array.isArray(product.curriculum) ? product.curriculum : [])
    .map((module: any) => ({
      title: String(module?.title || '').trim(),
      lessons: Number(module?.lessons || 0),
      duration: String(module?.duration || '').trim(),
    }))
    .filter((module) => module.title);
  const effectivePrice = product.base_price;
  const isPausedCourse = product.is_active === false;
  const sellerCommission = effectivePrice * 0.1;
  const totalLessons = curriculum.reduce((sum, module) => sum + (module.lessons > 0 ? module.lessons : 0), 0);

  // Dynamic Sales Kit content (using AI-generated sales_kit if available, or fallbacks)
  const pitchScripts = (product.sales_kit?.whatsapp_scripts && product.sales_kit.whatsapp_scripts.length > 0)
    ? product.sales_kit.whatsapp_scripts.map((s) => ({
        title: s.title,
        text: s.body.replace(/\[SELLER_REFERRAL_LINK\]/g, referralLink),
      }))
    : [
        {
          title: 'Script 1: The Cold Intro',
          text: `Hey [Name]! Saw you were looking to master ${product.product_name}. This course offers a structured, step-by-step roadmap with hands-on projects. You can check the syllabus and enroll here: ${referralLink}`,
        },
        {
          title: 'Script 2: The Value-First Recommendation',
          text: `Hey [Name], if you are preparing for tech interviews or upgrading your skillset, ${product.product_name} is curated directly by industry practitioners. Inspect the module breakdown and outcomes here: ${referralLink}`,
        },
        {
          title: 'Script 3: Limited Seats / High Demand',
          text: `Quick heads up! Seats for ${product.product_name} are filling up fast for this cohort. If you want lifetime access to all learning materials, check out the direct link here: ${referralLink}`,
        },
      ];

  const targetAudienceText = product.sales_kit?.target_audience ||
    'College students, CS/IT graduates, junior software engineers, and working professionals looking to upskill or transition into tech careers.';

  const whereToFindText = product.sales_kit?.where_to_find ||
    'WhatsApp & Telegram college batch channels, LinkedIn job-seeker threads, developer Discord servers, and campus career groups.';

  const objectionFaqs = (product.sales_kit?.objections && product.sales_kit.objections.length > 0)
    ? product.sales_kit.objections.map((o) => ({
        q: o.question.startsWith('Q:') ? o.question : `Q: ${o.question}`,
        a: o.answer.startsWith('A:') ? o.answer : `A: ${o.answer}`,
      }))
    : [
        {
          q: 'Q: Is there a job guarantee or placement support?',
          a: 'A: While direct placement is not guaranteed unless explicitly indicated by the vendor, the program equips learners with production-grade portfolio projects and interview-ready skills that employers actively test for.',
        },
        {
          q: 'Q: Is this course beginner-friendly?',
          a: 'A: Yes! The course starts from foundational concepts and progresses into advanced topics. All course prerequisites are clearly outlined in the syllabus tab.',
        },
        {
          q: 'Q: How long do I get access to the course content?',
          a: 'A: Buyers receive lifetime access to all course modules, updates, and learning resources as soon as checkout is completed.',
        },
      ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Header Card */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-900 p-4 md:p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <Link
              href="/seller/dashboard"
              className="text-slate-400 hover:text-slate-200 transition-colors rounded-lg border border-slate-800 bg-slate-800/60 p-2"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-slate-400">My Store / Course Details</p>
              <h1 className="text-xl md:text-2xl font-bold text-white leading-tight">{product.product_name}</h1>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-xs text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700/60">
                  {product.category || 'Online Course'}
                </span>
                {isPausedCourse && (
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded">
                    Paused by vendor
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2.5 self-start sm:self-center">
            {/* Download Syllabus PDF Button */}
            <button
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
              className="flex items-center gap-1.5 px-3.5 py-2 text-sm text-emerald-400 border border-emerald-500/30 bg-emerald-500/10 rounded-lg hover:bg-emerald-500/20 disabled:opacity-50 transition-colors"
              title="Download Course Syllabus PDF"
            >
              <Download className="w-3.5 h-3.5" />
              {downloadingPdf ? 'Downloading...' : 'Download PDF'}
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-1.5 px-3.5 py-2 text-sm text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/10 disabled:opacity-50 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {deleting ? 'Removing...' : 'Remove'}
            </button>
          </div>
        </div>

        {/* KPI Stats Bar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 shadow-sm">
            <p className="text-[11px] uppercase tracking-wider text-slate-400">Course Price</p>
            <p className="text-lg font-bold text-white mt-1">{formatCurrency(effectivePrice)}</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 shadow-sm">
            <p className="text-[11px] uppercase tracking-wider text-slate-400">Your Commission</p>
            <p className="text-lg font-bold text-emerald-400 mt-1">{formatCurrency(sellerCommission)}</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 shadow-sm">
            <p className="text-[11px] uppercase tracking-wider text-slate-400">Curriculum</p>
            <p className="text-lg font-bold text-white mt-1">{curriculum.length} modules</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 shadow-sm">
            <p className="text-[11px] uppercase tracking-wider text-slate-400">Learning Outcomes</p>
            <p className="text-lg font-bold text-white mt-1">{learningOutcomes.length}</p>
          </div>
        </div>

        {/* Two-Tab Header Bar */}
        <div className="flex items-center gap-3 border-b border-slate-800">
          <button
            onClick={() => setActiveTab('sales-kit')}
            className={`flex items-center gap-2 pb-3 px-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === 'sales-kit'
                ? 'border-emerald-500 text-emerald-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            🔥 Sales Kit (Pitch & Earn)
          </button>
          <button
            onClick={() => setActiveTab('curriculum')}
            className={`flex items-center gap-2 pb-3 px-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === 'curriculum'
                ? 'border-emerald-500 text-emerald-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            📖 Course Syllabus & Details
          </button>
        </div>

        {/* Main Content Area + Right Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Left Content Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* TAB 1: Sales Kit Grid */}
            {activeTab === 'sales-kit' && (
              <div className="space-y-6">
                {/* Card 1: Target Audience */}
                <div className="bg-slate-900 rounded-xl border border-slate-800 p-5 md:p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <Target className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-white">Who to Target & Where to Find Them</h2>
                      <p className="text-xs text-slate-400">Pinpoint qualified buyers ready to enroll</p>
                    </div>
                  </div>

                  <div className="space-y-3.5">
                    <div className="rounded-lg border border-slate-800 bg-slate-800/40 p-4">
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-1.5">
                        <Users className="w-3.5 h-3.5" />
                        <span>Ideal Candidate</span>
                      </div>
                      <p className="text-sm text-slate-300 leading-relaxed">
                        {targetAudienceText}
                      </p>
                    </div>

                    <div className="rounded-lg border border-slate-800 bg-slate-800/40 p-4">
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-1.5">
                        <Compass className="w-3.5 h-3.5" />
                        <span>Where to Look</span>
                      </div>
                      <p className="text-sm text-slate-300 leading-relaxed">
                        {whereToFindText}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Card 2: Copy-Paste Pitch Scripts */}
                <div className="bg-slate-900 rounded-xl border border-slate-800 p-5 md:p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <MessageSquare className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-white">WhatsApp Pitch Scripts</h2>
                      <p className="text-xs text-slate-400">High-converting message templates ready to copy & paste</p>
                    </div>
                  </div>

                  <div className="space-y-3.5">
                    {pitchScripts.map((script, idx) => (
                      <div
                        key={script.title}
                        className="rounded-lg border border-slate-700/60 bg-slate-800/60 p-4 transition-colors hover:bg-slate-800/80 relative"
                      >
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wide">
                            {script.title}
                          </span>
                          <button
                            onClick={() => copyScript(script.text, idx)}
                            className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-slate-700/60 hover:bg-slate-700 px-2.5 py-1 rounded border border-slate-600/50 transition-colors"
                            title="Copy script"
                          >
                            {copiedScript === idx ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-emerald-400 font-medium">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5 text-slate-400" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        </div>
                        <p className="text-sm text-slate-300 leading-relaxed select-text">
                          {script.text}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Card 3: Objection Handling */}
                <div className="bg-slate-900 rounded-xl border border-slate-800 p-5 md:p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <HelpCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-white">How to Answer Buyer Doubts</h2>
                      <p className="text-xs text-slate-400">Handle objections confidently to secure the sale</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {objectionFaqs.map((faq, idx) => {
                      const isOpen = openFaq === idx;
                      return (
                        <div
                          key={idx}
                          className="rounded-lg border border-slate-800 bg-slate-800/40 overflow-hidden transition-colors"
                        >
                          <button
                            onClick={() => setOpenFaq(isOpen ? null : idx)}
                            className="w-full text-left p-4 flex items-center justify-between gap-3 text-sm font-medium text-slate-200 hover:text-white"
                          >
                            <span>{faq.q}</span>
                            {isOpen ? (
                              <ChevronUp className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
                            )}
                          </button>
                          {isOpen && (
                            <div className="px-4 pb-4 pt-1 text-sm text-slate-300 border-t border-slate-800/60 leading-relaxed">
                              {faq.a}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Course Syllabus & Details */}
            {activeTab === 'curriculum' && (
              <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-sm">
                {/* Cover image */}
                <div className="h-56 bg-gradient-to-br from-slate-900 to-slate-800 relative overflow-hidden">
                  {imgUrl ? (
                    <img
                      src={imgUrl}
                      alt={product.product_name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : null}
                  <div className="absolute top-3 right-3">
                    <span className="text-xs bg-slate-900/90 text-slate-300 px-2.5 py-1 rounded-full border border-slate-700">
                      Vendor managed
                    </span>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  {/* Dedicated Download PDF Banner */}
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex-shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-white">Course Syllabus Document</h3>
                        <p className="text-xs text-slate-400">
                          Download the vendor-provided PDF syllabus with detailed module breakdowns.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleDownloadPdf}
                      disabled={downloadingPdf}
                      className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-medium text-xs transition-colors shadow-sm self-start sm:self-auto flex-shrink-0"
                    >
                      <Download className="w-3.5 h-3.5" />
                      {downloadingPdf ? 'Downloading...' : 'Download Syllabus PDF'}
                    </button>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-slate-400 mb-1">Course Name</p>
                    <p className="text-base font-semibold text-white">{product.product_name}</p>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-slate-400 mb-1">Description</p>
                    <p className="text-sm text-slate-300 leading-relaxed">
                      {product.description || 'No description available.'}
                    </p>
                  </div>

                  {/* Features */}
                  <div className="rounded-lg border border-slate-800 bg-slate-800/40 p-4">
                    <p className="text-xs font-medium text-slate-400 mb-2">Features</p>
                    {features.length > 0 ? (
                      <ul className="space-y-1.5">
                        {features.map((feature, index) => (
                          <li key={`${feature}-${index}`} className="text-sm text-slate-300 flex items-start gap-2">
                            <span className="mt-1.5 inline-block w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-slate-400">No features added for this course yet.</p>
                    )}
                  </div>

                  {/* Duration & Modules Overview */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="rounded-lg border border-slate-800 bg-slate-800/40 p-3.5">
                      <p className="text-xs text-slate-400 mb-1 flex items-center gap-1.5">
                        <Clock3 className="w-3.5 h-3.5 text-emerald-400" />
                        Course Duration
                      </p>
                      <p className="text-sm font-medium text-white">
                        {product.course_duration?.trim() || 'Self-paced'}
                      </p>
                    </div>
                    <div className="rounded-lg border border-slate-800 bg-slate-800/40 p-3.5">
                      <p className="text-xs text-slate-400 mb-1 flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                        Curriculum Modules
                      </p>
                      <p className="text-sm font-medium text-white">
                        {curriculum.length > 0 ? `${curriculum.length} modules • ${totalLessons} lessons` : 'Not added'}
                      </p>
                    </div>
                  </div>

                  {/* Prerequisites */}
                  <div className="rounded-lg border border-slate-800 bg-slate-800/30 p-4">
                    <p className="text-xs font-medium text-slate-400 mb-2.5 flex items-center gap-1.5">
                      <ListChecks className="w-3.5 h-3.5 text-emerald-400" />
                      Prerequisites
                    </p>
                    {prerequisites.length > 0 ? (
                      <ul className="space-y-2">
                        {prerequisites.map((item, index) => (
                          <li key={`${item}-${index}`} className="text-sm text-slate-300 flex items-start gap-2">
                            <span className="mt-1.5 inline-block w-1.5 h-1.5 rounded-full bg-slate-500" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-slate-400">No prerequisites listed.</p>
                    )}
                  </div>

                  {/* What You'll Learn */}
                  <div className="rounded-lg border border-slate-800 bg-slate-800/30 p-4">
                    <p className="text-xs font-medium text-slate-400 mb-2.5 flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5 text-emerald-400" />
                      What You&apos;ll Learn
                    </p>
                    {learningOutcomes.length > 0 ? (
                      <ul className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        {learningOutcomes.map((item, index) => (
                          <li key={`${item}-${index}`} className="text-sm text-slate-300 flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-slate-400">No learning outcomes added yet.</p>
                    )}
                  </div>

                  {/* Curriculum Breakdown */}
                  <div className="rounded-lg border border-slate-800 bg-slate-800/30 p-4">
                    <p className="text-xs font-medium text-slate-400 mb-3">Curriculum</p>
                    {curriculum.length > 0 ? (
                      <div className="space-y-2">
                        {curriculum.map((module, index) => (
                          <div
                            key={`${module.title}-${index}`}
                            className="rounded-lg border border-slate-800 bg-slate-800/60 px-3.5 py-3"
                          >
                            <p className="text-sm font-medium text-slate-200">
                              Module {index + 1}: {module.title}
                            </p>
                            <p className="text-xs text-slate-400 mt-1">
                              {module.lessons > 0 ? `${module.lessons} lessons` : 'Lessons not specified'}
                              {module.duration ? ` • ${module.duration}` : ''}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-400">Curriculum modules are not available yet.</p>
                    )}
                  </div>

                  {/* Price & Date summary */}
                  <div className="flex items-center gap-6 pt-3 border-t border-slate-800 text-sm">
                    <div>
                      <p className="text-xs text-slate-400">Course Price</p>
                      <p className="font-semibold text-white">{formatCurrency(effectivePrice)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Added</p>
                      <p className="font-semibold text-white">
                        {product.created_at
                          ? new Date(product.created_at).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })
                          : '—'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar: Share & Earn + Pricing */}
          <div className="space-y-6 lg:sticky lg:top-6 self-start">
            {/* Share & Earn Card */}
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Share2 className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-semibold text-slate-200">Share & Earn</h2>
              </div>

              <div className="space-y-4">
                {isPausedCourse && (
                  <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2">
                    <p className="text-xs text-amber-300">
                      This course is paused by the vendor. New sales are currently disabled.
                    </p>
                  </div>
                )}

                {/* Primary WhatsApp Share Button */}
                <button
                  onClick={handleWhatsAppShare}
                  disabled={isPausedCourse}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm transition-colors shadow-sm"
                >
                  <WhatsAppIcon className="w-4 h-4 fill-white" />
                  Share directly on WhatsApp
                </button>

                {/* Referral Code */}
                <div>
                  <p className="text-xs text-slate-400 mb-1.5">Your referral code</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-slate-800/80 border border-slate-700 px-3 py-2 rounded-lg font-mono text-xs text-slate-200 truncate">
                      {product.referral_code}
                    </code>
                    <button
                      onClick={copyCode}
                      disabled={isPausedCourse}
                      className="flex-shrink-0 p-2 text-slate-400 hover:text-white bg-slate-800 border border-slate-700 rounded-lg hover:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      title="Copy code"
                    >
                      {copiedCode ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Referral Link */}
                <div>
                  <p className="text-xs text-slate-400 mb-1.5">Referral link</p>
                  <div className="flex items-center gap-2">
                    <input
                      readOnly
                      value={referralLink}
                      className="flex-1 bg-slate-800/80 border border-slate-700 px-3 py-2 rounded-lg text-xs text-slate-300 truncate focus:outline-none"
                    />
                    <button
                      onClick={copyLink}
                      disabled={isPausedCourse}
                      className="flex-shrink-0 p-2 text-slate-400 hover:text-white bg-slate-800 border border-slate-700 rounded-lg hover:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      title="Copy link"
                    >
                      {copiedLink ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <ExternalLink className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Download Syllabus PDF Link in Sidebar */}
                <div className="pt-1">
                  <button
                    onClick={handleDownloadPdf}
                    disabled={downloadingPdf}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white text-xs font-medium transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-400" />
                    {downloadingPdf ? 'Downloading Syllabus...' : 'Download Syllabus (PDF)'}
                  </button>
                </div>

                <p className="text-xs text-slate-400 pt-1">
                  Share this link on social media or direct messages to earn 10% on every sale.
                </p>
              </div>
            </div>

            {/* Pricing Card with Income Anchoring */}
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-200 mb-4">Pricing</h2>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Course price</span>
                  <span className="font-semibold text-white">{formatCurrency(effectivePrice)}</span>
                </div>
                <div className="flex items-center justify-between pt-2.5 border-t border-slate-800">
                  <span className="text-slate-300 font-medium">Your commission (10%)</span>
                  <span className="font-bold text-emerald-400">{formatCurrency(sellerCommission)}</span>
                </div>
                {/* Income Anchoring */}
                <p className="text-xs italic text-slate-400 pt-1 leading-relaxed">
                  Sell just 2 seats this week to make {formatCurrency(sellerCommission * 2)} straight to your bank account.
                </p>
                <p className="text-[11px] text-slate-500 pt-2 border-t border-slate-800">
                  Course price is set by the vendor.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}