'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { X, Plus, Info, ChevronDown, ChevronUp, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { calculateCommissions, formatCurrency } from '@/utils/calculations';

interface FormData {
  name: string;
  category: string;
  description: string;
  basePrice: string;
  coverImage: string;
  accessUrl: string;
  courseDuration: string;
}

interface CurriculumModule {
  id: string;
  title: string;
  lessons: string;
  duration: string;
}

type Highlight = string;
type Prerequisite = string;
type LearningOutcome = string;

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

export default function EditCoursePage() {
  const router = useRouter();
  const params = useParams();
  const { user, isLoading } = useAuth();
  const courseId = params.id as string;

  const [formData, setFormData] = useState<FormData>({
    name: '',
    category: 'Online Course',
    description: '',
    basePrice: '',
    coverImage: '',
    accessUrl: '',
    courseDuration: '',
  });

  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [prerequisites, setPrerequisites] = useState<Prerequisite[]>([]);
  const [learningOutcomes, setLearningOutcomes] = useState<LearningOutcome[]>([]);
  const [curriculum, setCurriculum] = useState<CurriculumModule[]>([]);

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    basic: true,
    media: false,
    highlights: false,
    course: true,
    prerequisites: false,
    curriculum: false,
    learning: false,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!isLoading && user?.role !== 'vendor') {
      router.push('/');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (courseId && user?.id) {
      fetchCourse();
    }
  }, [courseId, user?.id]);

  const fetchCourse = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/products/${courseId}`);
      if (!res.ok) throw new Error('Failed to fetch course');
      const course = await res.json();

      setFormData({
        name: course.name || '',
        category: course.category || 'Online Course',
        description: course.description || '',
        basePrice: course.base_price?.toString() || '',
        coverImage: course.images?.[0] || '',
        accessUrl: course.specifications?.accessUrl || '',
        courseDuration: course.course_duration || '',
      });

      setHighlights(
        course.specifications?.highlights
          ? course.specifications.highlights.split('|||').filter((h: string) => h.trim())
          : ['', '', '']
      );

      setPrerequisites(course.prerequisites || ['', '']);
      setLearningOutcomes(course.learning_outcomes || ['', '', '']);
      setCurriculum(
        course.curriculum?.map((mod: any) => ({
          id: `${mod.module}_${Date.now()}`,
          title: mod.title || '',
          lessons: mod.lessons?.toString() || '',
          duration: mod.duration || '',
        })) || []
      );
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Highlights
  const handleHighlightChange = (index: number, value: string) => {
    setHighlights((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const addHighlight = () => {
    setHighlights((prev) => [...prev, '']);
  };

  const removeHighlight = (index: number) => {
    setHighlights((prev) => prev.filter((_, i) => i !== index));
  };

  // Prerequisites
  const handlePrerequisiteChange = (index: number, value: string) => {
    setPrerequisites((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const addPrerequisite = () => {
    setPrerequisites((prev) => [...prev, '']);
  };

  const removePrerequisite = (index: number) => {
    setPrerequisites((prev) => prev.filter((_, i) => i !== index));
  };

  // Learning Outcomes
  const handleLearningOutcomeChange = (index: number, value: string) => {
    setLearningOutcomes((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const addLearningOutcome = () => {
    setLearningOutcomes((prev) => [...prev, '']);
  };

  const removeLearningOutcome = (index: number) => {
    setLearningOutcomes((prev) => prev.filter((_, i) => i !== index));
  };

  // Curriculum
  const handleCurriculumChange = (index: number, field: keyof CurriculumModule, value: string) => {
    setCurriculum((prev) => {
      const next = [...prev];
      next[index][field] = value;
      return next;
    });
  };

  const addCurriculumModule = () => {
    setCurriculum((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        title: '',
        lessons: '',
        duration: '',
      },
    ]);
  };

  const removeCurriculumModule = (id: string) => {
    setCurriculum((prev) => prev.filter((m) => m.id !== id));
  };

  const handleSave = async () => {
    try {
      setError(null);
      setSaving(true);

      if (!formData.name.trim() || !formData.description.trim() || !formData.basePrice) {
        throw new Error('Please fill in all required fields');
      }

      const basePrice = parseFloat(formData.basePrice);
      if (isNaN(basePrice) || basePrice <= 0) {
        throw new Error('Enter a valid base price');
      }

      if (!user?.id) throw new Error('Not authenticated');

      const filledHighlights = highlights.filter((h) => h.trim());
      const filledPrerequisites = prerequisites.filter((p) => p.trim());
      const filledLearningOutcomes = learningOutcomes.filter((l) => l.trim());
      const filledCurriculum = curriculum.filter((c) => c.title.trim());

      const response = await fetch(`/api/products/${courseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendorId: user.id,
          name: formData.name.trim(),
          category: formData.category,
          description: formData.description.trim(),
          basePrice,
          images: formData.coverImage ? [formData.coverImage] : [],
          courseDuration: formData.courseDuration.trim() || 'Self-paced',
          prerequisites: filledPrerequisites,
          learningOutcomes: filledLearningOutcomes,
          curriculum: filledCurriculum.map((c, idx) => ({
            module: idx + 1,
            title: c.title,
            lessons: parseInt(c.lessons) || 0,
            duration: c.duration,
          })),
          specifications: {
            accessUrl: formData.accessUrl.trim(),
            highlights: filledHighlights.join('|||'),
          },
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to update course');
      }

      setSuccess(true);
      setTimeout(() => router.push('/vendor/products'), 1500);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return null;
  if (!user || user.role !== 'vendor') return null;

  const commission = formData.basePrice ? calculateCommissions(parseFloat(formData.basePrice) || 0) : null;

  return (
    <div className="px-6 py-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <Link
          href="/vendor/products"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Course</h1>
          <p className="text-sm text-gray-500 mt-1">Update your course details below.</p>
        </div>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg mb-6">
          ✓ Course updated successfully! Redirecting...
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg mb-6">
          ✗ {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center min-h-96">
          <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-4">
            
            {/* BASIC INFORMATION */}
            <SectionCard
              title="Basic Information"
              expanded={expandedSections.basic}
              onToggle={() => toggleSection('basic')}
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Course Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="e.g. Complete Python Bootcamp 2024"
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                      className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                      Final Price (including taxes) (₹) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={formData.basePrice}
                      onChange={(e) => handleChange('basePrice', e.target.value)}
                      placeholder="e.g. 999"
                      min="1"
                      className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Course Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    placeholder="Describe what the learner will get..."
                    rows={4}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
              </div>
            </SectionCard>

            {/* MEDIA & ACCESS */}
            <SectionCard
              title="Media & Access"
              expanded={expandedSections.media}
              onToggle={() => toggleSection('media')}
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Course Cover Image URL
                  </label>
                  <input
                    type="url"
                    value={formData.coverImage}
                    onChange={(e) => handleChange('coverImage', e.target.value)}
                    placeholder="https://example.com/cover.jpg"
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Course Access / Download Link
                  </label>
                  <input
                    type="url"
                    value={formData.accessUrl}
                    onChange={(e) => handleChange('accessUrl', e.target.value)}
                    placeholder="https://example.com/course"
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </SectionCard>

            {/* KEY HIGHLIGHTS */}
            <SectionCard
              title="Key Highlights"
              expanded={expandedSections.highlights}
              onToggle={() => toggleSection('highlights')}
              badge={highlights.filter((h) => h.trim()).length}
            >
              <div className="space-y-3">
                {highlights.map((h, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-gray-300 text-sm">•</span>
                    <input
                      type="text"
                      value={h}
                      onChange={(e) => handleHighlightChange(i, e.target.value)}
                      placeholder={`Highlight ${i + 1}`}
                      className="flex-1 px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                <button
                  type="button"
                  onClick={addHighlight}
                  className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add highlight
                </button>
              </div>
            </SectionCard>

            {/* COURSE DETAILS */}
            <SectionCard
              title="Course Details"
              expanded={expandedSections.course}
              onToggle={() => toggleSection('course')}
            >
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Course Duration
                </label>
                <input
                  type="text"
                  value={formData.courseDuration}
                  onChange={(e) => handleChange('courseDuration', e.target.value)}
                  placeholder="e.g. 4 weeks, 20 hours, Self-paced"
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </SectionCard>

            {/* PREREQUISITES */}
            <SectionCard
              title="Prerequisites"
              expanded={expandedSections.prerequisites}
              onToggle={() => toggleSection('prerequisites')}
              badge={prerequisites.filter((p) => p.trim()).length}
            >
              <div className="space-y-3">
                {prerequisites.map((p, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-gray-300 text-sm">•</span>
                    <input
                      type="text"
                      value={p}
                      onChange={(e) => handlePrerequisiteChange(i, e.target.value)}
                      placeholder={`Prerequisite ${i + 1}`}
                      className="flex-1 px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {prerequisites.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePrerequisite(i)}
                        className="text-gray-300 hover:text-red-400 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addPrerequisite}
                  className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add prerequisite
                </button>
              </div>
            </SectionCard>

            {/* WHAT YOU'LL LEARN */}
            <SectionCard
              title="What You'll Learn"
              expanded={expandedSections.learning}
              onToggle={() => toggleSection('learning')}
              badge={learningOutcomes.filter((l) => l.trim()).length}
            >
              <div className="space-y-3">
                {learningOutcomes.map((l, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-green-500 text-sm">✓</span>
                    <input
                      type="text"
                      value={l}
                      onChange={(e) => handleLearningOutcomeChange(i, e.target.value)}
                      placeholder={`Learning outcome ${i + 1}`}
                      className="flex-1 px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {learningOutcomes.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeLearningOutcome(i)}
                        className="text-gray-300 hover:text-red-400 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addLearningOutcome}
                  className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add outcome
                </button>
              </div>
            </SectionCard>

            {/* COURSE CURRICULUM */}
            <SectionCard
              title="Course Curriculum"
              expanded={expandedSections.curriculum}
              onToggle={() => toggleSection('curriculum')}
              badge={curriculum.filter((c) => c.title.trim()).length}
            >
              <div className="space-y-4">
                {curriculum.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-6">
                    No modules added yet. Click the button below to start.
                  </p>
                ) : (
                  curriculum.map((module, i) => (
                    <div key={module.id} className="border border-gray-200 rounded-lg p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-blue-600">Module {i + 1}</span>
                        <button
                          type="button"
                          onClick={() => removeCurriculumModule(module.id)}
                          className="ml-auto text-gray-300 hover:text-red-400 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <input
                        type="text"
                        value={module.title}
                        onChange={(e) =>
                          handleCurriculumChange(i, 'title', e.target.value)
                        }
                        placeholder="Module title"
                        className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />

                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="number"
                          value={module.lessons}
                          onChange={(e) =>
                            handleCurriculumChange(i, 'lessons', e.target.value)
                          }
                          placeholder="Number of lessons"
                          min="0"
                          className="px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="text"
                          value={module.duration}
                          onChange={(e) =>
                            handleCurriculumChange(i, 'duration', e.target.value)
                          }
                          placeholder="Duration (e.g., 2 hours)"
                          className="px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  ))
                )}

                <button
                  type="button"
                  onClick={addCurriculumModule}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 border-2 border-dashed border-gray-300 rounded-lg text-sm text-blue-600 hover:text-blue-700 hover:border-blue-300 font-medium transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add module
                </button>
              </div>
            </SectionCard>
          </div>

          {/* Sidebar: Pricing & Save */}
          <div className="space-y-5">
            {/* Pricing */}
            <div className="bg-white rounded-lg border border-gray-200 p-5 sticky top-20">
              <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Info className="w-4 h-4 text-gray-400" />
                Pricing Preview
              </h3>

              {commission ? (
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Your Price</span>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(parseFloat(formData.basePrice) || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between pb-3 border-b border-gray-100">
                    <span className="text-gray-500">Platform Cut</span>
                    <span className="font-semibold text-red-500">
                      -{formatCurrency(commission.platformCommission)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-3 border-t border-gray-200">
                    <span className="font-bold text-gray-900">You Receive (before tax)</span>
                    <span className="font-bold text-green-600 text-base">
                      {formatCurrency(commission.vendorPayout)}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-4">
                  Enter a price to see the breakdown
                </p>
              )}
            </div>

            {/* Save Button */}
            <div className="bg-white rounded-lg border border-gray-200 p-5 space-y-3">
              <button
                onClick={handleSave}
                disabled={saving || loading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium text-sm rounded-lg transition-colors"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <Link
                href="/vendor/products"
                className="block w-full py-2.5 text-center text-sm text-gray-600 hover:text-gray-900 font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Collapsible Section Component
function SectionCard({
  title,
  expanded,
  onToggle,
  children,
  badge,
}: {
  title: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  badge?: number;
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold text-gray-700">{title}</h2>
          {badge !== undefined && badge > 0 && (
            <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-semibold text-white bg-blue-600 rounded-full">
              {badge}
            </span>
          )}
        </div>
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>

      {expanded && (
        <div className="border-t border-gray-200 px-6 py-4">{children}</div>
      )}
    </div>
  );
}
