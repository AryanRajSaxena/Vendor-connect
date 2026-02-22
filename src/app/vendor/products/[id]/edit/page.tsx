'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { X, Plus, Upload } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { calculateCommissions, formatCurrency } from '@/utils/calculations';

interface FormData {
  name: string;
  category: string;
  description: string;
  basePrice: string;
  stock: string;
}

interface Spec {
  key: string;
  value: string;
}

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const productId = params.id as string;

  const [formData, setFormData] = useState<FormData>({
    name: '',
    category: 'Electronics',
    description: '',
    basePrice: '',
    stock: '',
  });

  const [images, setImages] = useState<string[]>([]);
  const [specs, setSpecs] = useState<Spec[]>([]);
  const [newSpec, setNewSpec] = useState({ key: '', value: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!isLoading && user?.role !== 'vendor') {
      router.push('/');
      return;
    }

    if (productId && user?.id) {
      fetchProduct();
    }
  }, [productId, user, isLoading, router]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/products/${productId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to fetch product (${response.status})`);
      }

      const product = await response.json();

      // Check authorization - handle both camelCase and snake_case
      const vendorId = product.vendorId || product.vendor_id;
      if (vendorId !== user?.id) {
        setError('You do not have permission to edit this product');
        setTimeout(() => router.push('/vendor/products'), 2000);
        return;
      }

      setFormData({
        name: product.name || '',
        category: product.category || 'Electronics',
        description: product.description || '',
        basePrice: (product.basePrice || product.base_price)?.toString() || '',
        stock: product.stock?.toString() || '',
      });

      setImages(product.images || []);
      setSpecs(
        product.specifications
          ? Object.entries(product.specifications).map(([key, value]) => ({ key, value: value as string }))
          : []
      );
    } catch (err) {
      const errorMsg = (err as Error).message;
      setError(errorMsg);
      console.error('Failed to fetch product:', err);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    'Electronics',
    'Fashion',
    'Home Appliances',
    'Services',
    'Education',
    'Healthcare',
    'Books',
    'Other',
  ];

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImages = Array.from(files)
      .slice(0, 5 - images.length)
      .map((file) => {
        // For MVP, use emoji icons. In production, upload to cloud storage (S3, Supabase Storage, etc.)
        return ['📦', '📷', '🎁', '🛍️', '✨'][images.length + Array.from(files).indexOf(file)];
      });

    setImages([...images, ...newImages]);
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleAddSpec = () => {
    if (newSpec.key && newSpec.value) {
      setSpecs([...specs, newSpec]);
      setNewSpec({ key: '', value: '' });
    }
  };

  const handleRemoveSpec = (index: number) => {
    setSpecs(specs.filter((_, i) => i !== index));
  };

  const handleUpdate = async () => {
    try {
      setError(null);
      setSaving(true);

      if (!formData.name || !formData.description || !formData.basePrice || !formData.stock) {
        throw new Error('Please fill all required fields');
      }

      const basePrice = parseFloat(formData.basePrice);
      if (isNaN(basePrice) || basePrice <= 0) {
        throw new Error('Base price must be a valid positive number');
      }

      const response = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          category: formData.category,
          description: formData.description,
          basePrice: basePrice,
          finalPrice: calculateCommissions(basePrice).finalPrice,
          markup: calculateCommissions(basePrice).markup,
          images: images,
          specifications: Object.fromEntries(specs.map((s) => [s.key, s.value])),
          stock: parseInt(formData.stock),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update product');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push(`/vendor/products`);
      }, 1500);
    } catch (err) {
      setError((err as Error).message);
      console.error('Failed to update product:', err);
    } finally {
      setSaving(false);
    }
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!user || user.role !== 'vendor') {
    return null;
  }

  const commission = formData.basePrice ? calculateCommissions(parseFloat(formData.basePrice)) : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Link href="/vendor/products" className="text-primary hover:underline mb-6 inline-block">
          ← Back to Products
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-8">Edit Product</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Section */}
          <div className="lg:col-span-2">
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-lg mb-6">
                ✓ Product updated successfully! Redirecting...
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg mb-6">
                {error}
              </div>
            )}

            <div className="bg-white rounded-lg p-6 space-y-6">
              {/* Product Information */}
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Product Information</h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="e.g., Wireless Earbuds Pro"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Category *
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) => handleInputChange('category', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        {categories.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Base Price (₹) *
                      </label>
                      <input
                        type="number"
                        value={formData.basePrice}
                        onChange={(e) => handleInputChange('basePrice', e.target.value)}
                        placeholder="2000"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Description *
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Describe your product features, benefits, and specifications..."
                      rows={5}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Stock Quantity *
                    </label>
                    <input
                      type="number"
                      value={formData.stock}
                      onChange={(e) => handleInputChange('stock', e.target.value)}
                      placeholder="50"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>

              {/* Images */}
              <div className="border-t pt-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Product Images (Max 5)</h2>

                <div className="grid grid-cols-5 gap-3 mb-4">
                  {images.map((img, idx) => (
                    <div key={idx} className="relative w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                      {img.startsWith('data:image') ? (
                        <img src={img} alt={`Product ${idx + 1}`} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-3xl">{img}</span>
                      )}
                      <button
                        onClick={() => handleRemoveImage(idx)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}

                  {images.length < 5 && (
                    <label className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-primary transition-colors">
                      <Upload className="w-6 h-6 text-gray-400" />
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
                <p className="text-sm text-gray-500">Upload high-quality images (JPG, PNG, WebP)</p>
              </div>

              {/* Specifications */}
              <div className="border-t pt-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Specifications</h2>

                {specs.length > 0 && (
                  <table className="w-full mb-4">
                    <tbody>
                      {specs.map((spec, idx) => (
                        <tr key={idx} className="border-b border-gray-200">
                          <td className="py-2 px-3 text-gray-900 font-semibold">{spec.key}</td>
                          <td className="py-2 px-3 text-gray-600">{spec.value}</td>
                          <td className="py-2 px-3 text-right">
                            <button
                              onClick={() => handleRemoveSpec(idx)}
                              className="text-red-600 hover:text-red-700 text-sm"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSpec.key}
                    onChange={(e) => setNewSpec({ ...newSpec, key: e.target.value })}
                    placeholder="Specification (e.g., Color)"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <input
                    type="text"
                    value={newSpec.value}
                    onChange={(e) => setNewSpec({ ...newSpec, value: e.target.value })}
                    placeholder="Value (e.g., Black)"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button
                    onClick={handleAddSpec}
                    className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="border-t pt-6 flex gap-4">
                <Link
                  href="/vendor/products"
                  className="btn btn-outline flex-1 py-3 text-center"
                >
                  Cancel
                </Link>
                <button
                  onClick={handleUpdate}
                  disabled={saving}
                  className="btn btn-primary flex-1 py-3 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>

          {/* Pricing Preview Sidebar */}
          {commission && (
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg p-6 sticky top-20">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Pricing Preview</h2>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Your Base Price:</span>
                    <span className="font-semibold">{formatCurrency(commission.basePrice)}</span>
                  </div>

                  <div className="flex justify-between text-green-600">
                    <span>Platform Markup (25%):</span>
                    <span className="font-semibold">+{formatCurrency(commission.markup)}</span>
                  </div>

                  <div className="border-t pt-3 flex justify-between text-lg font-bold text-gray-900">
                    <span>Customer Pays:</span>
                    <span className="text-primary">{formatCurrency(commission.finalPrice)}</span>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 my-4">
                    <p className="text-xs text-gray-700 font-semibold mb-2">When Product is Sold:</p>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Seller Earns (10%):</span>
                        <span className="font-semibold text-green-600">
                          {formatCurrency(commission.sellerCommission)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Platform Gets:</span>
                        <span className="font-semibold">
                          {formatCurrency(commission.platformCommission)}
                        </span>
                      </div>
                      <div className="border-t pt-2 flex justify-between font-semibold">
                        <span className="text-gray-600">You Receive:</span>
                        <span className="text-green-600">{formatCurrency(commission.vendorPayout)}</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-gray-500 mt-4">
                    💡 Prices are calculated automatically based on the platform's commission model.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
