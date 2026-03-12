'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { X, Plus, Info } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { calculateCommissions, formatCurrency } from '@/utils/calculations';

interface FormData {
  name: string;
  category: string;
  description: string;
  basePrice: string;
  coverImage: string;
  accessUrl: string;
}

type Highlight = string;

const CATEGORIES = [
  'Online Course',
  'E-Book',
  'Software / SaaS',
  'Template / Asset',
  'Coaching / Consulting',
  'Services',
  'Education',
  'Healthcare',
  'Other',
];

export default function AddProductPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  const [formData, setFormData] = useState<FormData>({
    name: '',
    category: 'Online Course',
    description: '',
    basePrice: '',
    coverImage: '',
    accessUrl: '',
  });

  const [highlights, setHighlights] = useState<Highlight[]>(['', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!isLoading && user?.role !== 'vendor') {
      router.push('/');
    }
  }, [user, isLoading, router]);

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleHighlightChange = (index: number, value: string) => {
    setHighlights((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const addHighlight = () => {
    if (highlights.length < 6) setHighlights((prev) => [...prev, '']);
  };

  const removeHighlight = (index: number) => {
    setHighlights((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePublish = async () => {
    try {
      setError(null);
      setLoading(true);

      if (!formData.name.trim() || !formData.description.trim() || !formData.basePrice) {
        throw new Error('Please fill in all required fields');
      }

      const basePrice = parseFloat(formData.basePrice);
      if (isNaN(basePrice) || basePrice <= 0) {
        throw new Error('Enter a valid base price');
      }

      if (!user?.id) throw new Error('Not authenticated');

      const commissions = calculateCommissions(basePrice);
      const filledHighlights = highlights.filter((h) => h.trim());

      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendorId: user.id,
          name: formData.name.trim(),
          category: formData.category,
          description: formData.description.trim(),
          basePrice,
          finalPrice: commissions.finalPrice,
          markup: 0,
          markupPercentage: 0,
          images: formData.coverImage ? [formData.coverImage] : [],
          specifications: {
            accessUrl: formData.accessUrl.trim(),
            highlights: filledHighlights.join('|||'),
          },
          stock: 999999,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to create product');
      }

      setSuccess(true);
      setTimeout(() => router.push('/vendor/products'), 1500);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) return null;
  if (!user || user.role !== 'vendor') return null;

  const commission = formData.basePrice ? calculateCommissions(parseFloat(formData.basePrice) || 0) : null;

  return (
    <div className="px-6 py-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">List a New Product</h1>
        <p className="text-sm text-gray-500 mt-1">
          Fill in the details below to publish your digital product on the marketplace.
        </p>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg mb-6">
          Product listed successfully! Redirecting...
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-2 space-y-5">
          {/* Basic Info */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
            <h2 className="text-sm font-semibold text-gray-700">Basic Information</h2>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Product Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="e.g. Complete Python Bootcamp 2024"
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleChange('category', e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Base Price (?) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.basePrice}
                  onChange={(e) => handleChange('basePrice', e.target.value)}
                  placeholder="e.g. 999"
                  min="1"
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Describe what the buyer will get, what they'll learn, and why it's valuable�"
                rows={4}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              />
            </div>
          </div>

          {/* Media & Access */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
            <h2 className="text-sm font-semibold text-gray-700">Media &amp; Access</h2>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Cover Image URL
              </label>
              <input
                type="url"
                value={formData.coverImage}
                onChange={(e) => handleChange('coverImage', e.target.value)}
                placeholder="https://example.com/cover.jpg"
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <p className="text-xs text-gray-400 mt-1">Recommended: 1200�630px, JPEG or PNG</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Access / Download Link
              </label>
              <input
                type="url"
                value={formData.accessUrl}
                onChange={(e) => handleChange('accessUrl', e.target.value)}
                placeholder="https://example.com/course or Google Drive link"
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <p className="text-xs text-gray-400 mt-1">
                This link will be shared with the buyer after purchase
              </p>
            </div>
          </div>

          {/* Highlights */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-700">Key Highlights</h2>
              <span className="text-xs text-gray-400">{highlights.length} / 6</span>
            </div>
            <p className="text-xs text-gray-500">
              List what makes this product valuable (shown as bullet points on the listing page)
            </p>

            <div className="space-y-2">
              {highlights.map((h, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-gray-300 text-sm">�</span>
                  <input
                    type="text"
                    value={h}
                    onChange={(e) => handleHighlightChange(i, e.target.value)}
                    placeholder={`Highlight ${i + 1}`}
                    className="flex-1 px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  {highlights.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeHighlight(i)}
                      className="text-gray-300 hover:text-red-400 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {highlights.length < 6 && (
              <button
                type="button"
                onClick={addHighlight}
                className="flex items-center gap-1.5 text-xs text-primary-500 hover:text-primary-600 font-medium"
              >
                <Plus className="w-3.5 h-3.5" />
                Add highlight
              </button>
            )}
          </div>
        </div>

        {/* Sidebar: Pricing preview + publish */}
        <div className="space-y-5">
          {/* Pricing breakdown */}
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Info className="w-4 h-4 text-gray-400" />
              Pricing Preview
            </h3>

            {commission ? (
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Your Listed Price</span>
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(parseFloat(formData.basePrice) || 0)}
                  </span>
                </div>
                <div className="flex justify-between pb-3 border-b border-gray-100">
                  <span className="text-gray-500">Customer Pays</span>
                  <span className="font-bold text-gray-900">
                    {formatCurrency(commission.finalPrice)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Seller Commission (10%)</span>
                  <span className="text-red-500">-{formatCurrency(commission.sellerCommission)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Platform Commission (10%)</span>
                  <span className="text-red-500">
                    -{formatCurrency(commission.platformCommission)}
                  </span>
                </div>
                <div className="flex justify-between pt-3 border-t border-gray-200">
                  <span className="font-bold text-gray-900">You Receive (80%)</span>
                  <span className="font-bold text-green-600 text-base">
                    {formatCurrency(commission.vendorPayout)}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">
                Enter a base price to see the breakdown
              </p>
            )}
          </div>

          {/* Publish button */}
          <div className="bg-white rounded-lg border border-gray-200 p-5 space-y-3">
            <button
              onClick={handlePublish}
              disabled={loading || success}
              className="w-full py-3 bg-gray-900 hover:bg-gray-800 disabled:opacity-50 text-white font-medium text-sm rounded-md transition-colors"
            >
              {loading ? 'Publishing�' : 'Publish Product'}
            </button>
            <Link
              href="/vendor/products"
              className="block w-full py-2.5 text-center text-sm text-gray-500 hover:text-gray-700 font-medium border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </Link>
            <p className="text-xs text-gray-400 text-center">
              Your product will be live immediately after publishing
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
