'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
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

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const productId = params.id as string;

  const [formData, setFormData] = useState<FormData>({
    name: '',
    category: 'Online Course',
    description: '',
    basePrice: '',
    coverImage: '',
    accessUrl: '',
  });

  const [highlights, setHighlights] = useState<Highlight[]>(['', '', '']);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!isLoading && user?.role !== 'vendor') {
      router.push('/');
      return;
    }
    if (productId && user?.id) fetchProduct();
  }, [productId, user, isLoading, router]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/products/${productId}`);
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.error || `Failed to fetch product (${res.status})`);
      }
      const product = await res.json();

      const vendorId = product.vendorId || product.vendor_id;
      if (vendorId !== user?.id) {
        setError('You do not have permission to edit this product');
        setTimeout(() => router.push('/vendor/products'), 2000);
        return;
      }

      const specs = product.specifications ?? {};
      setFormData({
        name: product.name ?? '',
        category: product.category ?? 'Online Course',
        description: product.description ?? '',
        basePrice: (product.basePrice ?? product.base_price)?.toString() ?? '',
        coverImage: (product.images ?? [])[0] ?? '',
        accessUrl: specs.accessUrl ?? '',
      });

      const raw: string = specs.highlights ?? '';
      const loaded = raw ? raw.split('|||').filter(Boolean) : [];
      setHighlights(loaded.length ? loaded : ['', '', '']);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

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

  const handleUpdate = async () => {
    try {
      setError(null);
      setSaving(true);

      if (!formData.name.trim() || !formData.description.trim() || !formData.basePrice) {
        throw new Error('Please fill in all required fields');
      }
      const basePrice = parseFloat(formData.basePrice);
      if (isNaN(basePrice) || basePrice <= 0) throw new Error('Enter a valid base price');

      const filledHighlights = highlights.filter((h) => h.trim());

      const res = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          category: formData.category,
          description: formData.description.trim(),
          basePrice,
          finalPrice: basePrice,
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

      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.error || 'Failed to update product');
      }

      setSuccess(true);
      setTimeout(() => router.push('/vendor/products'), 1500);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (isLoading || loading) return null;
  if (!user || user.role !== 'vendor') return null;

  const commission = formData.basePrice ? calculateCommissions(parseFloat(formData.basePrice) || 0) : null;

  return (
    <div className="px-6 py-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <Link href="/vendor/products" className="text-sm text-primary-500 hover:underline">
          ← Back to Products
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-3">Edit Product</h1>
        <p className="text-sm text-gray-500 mt-1">Update your digital product details below.</p>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg mb-6">
          ✓ Product updated successfully! Redirecting…
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
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Price (₹) <span className="text-red-500">*</span>
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
                placeholder="Describe what the buyer will get, what they'll learn, and why it's valuable…"
                rows={4}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              />
            </div>
          </div>

          {/* Media & Access */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
            <h2 className="text-sm font-semibold text-gray-700">Media &amp; Access</h2>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Cover Image URL</label>
              <input
                type="url"
                value={formData.coverImage}
                onChange={(e) => handleChange('coverImage', e.target.value)}
                placeholder="https://example.com/cover.jpg"
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <p className="text-xs text-gray-400 mt-1">Recommended: 1200×630px, JPEG or PNG</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Access / Download Link</label>
              <input
                type="url"
                value={formData.accessUrl}
                onChange={(e) => handleChange('accessUrl', e.target.value)}
                placeholder="https://example.com/course or Google Drive link"
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <p className="text-xs text-gray-400 mt-1">This link will be shared with the buyer after purchase</p>
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
                  <span className="text-gray-300 text-sm">•</span>
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

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleUpdate}
              disabled={saving}
              className="px-6 py-2.5 bg-gray-900 hover:bg-gray-800 disabled:opacity-50 text-white text-sm font-medium rounded-md transition-colors"
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
            <Link
              href="/vendor/products"
              className="px-5 py-2.5 text-sm font-semibold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </Link>
          </div>
        </div>

        {/* Pricing Preview Sidebar */}
        <div className="space-y-5">
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
                  <span className="font-bold text-gray-900">{formatCurrency(commission.finalPrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Seller Commission (10%)</span>
                  <span className="text-red-500">-{formatCurrency(commission.sellerCommission)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Platform Commission (10%)</span>
                  <span className="text-red-500">-{formatCurrency(commission.platformCommission)}</span>
                </div>
                <div className="flex justify-between pt-3 border-t border-gray-200">
                  <span className="font-bold text-gray-900">You Receive (80%)</span>
                  <span className="font-bold text-green-600 text-base">
                    {formatCurrency(commission.vendorPayout)}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">Enter a price to see the breakdown</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}