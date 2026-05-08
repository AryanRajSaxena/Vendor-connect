'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Edit2, PauseCircle, Plus, Search, AlertCircle, BookOpen, Users, Clock, Zap } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency, getImageUrl } from '@/utils/calculations';

interface CourseData {
  id: string;
  name: string;
  category: string;
  description: string;
  basePrice: number;
  soldCount: number;
  isActive: boolean;
  coverImage?: string;
  createdAt: string;
  courseDuration?: string;
  prerequisites?: string[];
  learningOutcomes?: string[];
  curriculum?: Array<{ module: number; title: string; lessons: number; duration: string }>;
}

export default function VendorCoursesPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [courses, setCourses] = useState<CourseData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [pauseTarget, setPauseTarget] = useState<string | null>(null);
  const [pausing, setPausing] = useState(false);
  const [imageLoadErrors, setImageLoadErrors] = useState<Record<string, boolean>>({});
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    if (!isLoading && user?.role !== 'vendor') {
      router.push('/');
    }
    if (user?.id) fetchCourses();
  }, [user, isLoading, router]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/products?vendorId=${user?.id}`);
      if (!res.ok) throw new Error('Failed to fetch courses');
      const data = await res.json();
      const raw: any[] = Array.isArray(data) ? data : data.courses ?? [];
      setCourses(
        raw.map((p) => ({
          id: p.id,
          name: p.name,
          category: p.category,
          description: p.description || '',
          basePrice: p.base_price ?? 0,
          soldCount: p.sold_count ?? 0,
          isActive: p.is_active !== false,
          coverImage: p.images?.[0] ?? undefined,
          createdAt: p.created_at ?? '',
          courseDuration: p.course_duration || 'Self-paced',
          prerequisites: p.prerequisites || [],
          learningOutcomes: p.learning_outcomes || [],
          curriculum: p.curriculum || [],
        }))
      );
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handlePause = async (id: string) => {
    try {
      setPausing(true);
      const res = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: false }),
      });
      if (!res.ok) throw new Error('Failed to pause course');
      setCourses((prev) =>
        prev.map((course) =>
          course.id === id ? { ...course, isActive: false } : course
        )
      );
      setPauseTarget(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setPausing(false);
    }
  };

  const filtered = courses.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.category.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) return null;
  if (!user || user.role !== 'vendor') return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Courses</h1>
              <p className="text-sm text-gray-500 mt-2">
                {courses.length} course{courses.length !== 1 ? 's' : ''} listed
              </p>
            </div>
            <Link
              href="/vendor/add-product"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add New Course
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {error && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg mb-6">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Search & View Controls */}
        {courses.length > 0 && (
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search courses..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>
            <div className="flex items-center gap-1 bg-white border border-gray-300 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-blue-100 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                  viewMode === 'list'
                    ? 'bg-blue-100 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                List
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center min-h-64">
            <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 py-20 text-center">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium text-lg">
              {search ? 'No courses match your search' : 'No courses published yet'}
            </p>
            <p className="text-gray-400 text-sm mt-2">
              {!search && 'Create your first course to earn from the platform'}
            </p>
            {!search && (
              <Link
                href="/vendor/add-product"
                className="inline-flex items-center gap-2 mt-6 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create First Course
              </Link>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((course) => (
              <div
                key={course.id}
                className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow flex flex-col"
              >
                {/* Course Image */}
                <div className="relative w-full h-40 bg-gray-100 overflow-hidden">
                  {getImageUrl(course.coverImage) && !imageLoadErrors[course.id] ? (
                    <img
                      src={getImageUrl(course.coverImage)!}
                      alt={course.name}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      loading="eager"
                      fetchPriority="high"
                      onError={() => {
                        setImageLoadErrors((prev) => ({ ...prev, [course.id]: true }));
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-50">
                      <BookOpen className="w-8 h-8 text-blue-400" />
                    </div>
                  )}
                  <div className="absolute top-3 right-3">
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        course.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      {course.isActive ? '✓ Live' : 'Paused'}
                    </span>
                  </div>
                </div>

                {/* Course Info */}
                <div className="flex-1 p-4 flex flex-col gap-3">
                  <div>
                    <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">
                      {course.category}
                    </p>
                    <h3 className="text-sm font-bold text-gray-900 line-clamp-2 hover:text-blue-600">
                      {course.name}
                    </h3>
                  </div>

                  <p className="text-sm text-gray-600 line-clamp-2 flex-1">
                    {course.description}
                  </p>

                  {/* Course Stats */}
                  <div className="space-y-2 py-3 border-t border-b border-gray-100">
                    {course.courseDuration && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span>{course.courseDuration}</span>
                      </div>
                    )}
                    {course.curriculum && course.curriculum.length > 0 && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Zap className="w-4 h-4 text-gray-400" />
                        <span>{course.curriculum.length} modules</span>
                      </div>
                    )}
                    {course.learningOutcomes && course.learningOutcomes.length > 0 && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <BookOpen className="w-4 h-4 text-gray-400" />
                        <span>{course.learningOutcomes.length} outcomes</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span>{course.soldCount} enrolled</span>
                    </div>
                  </div>

                  {/* Pricing */}
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-bold text-gray-900">
                      {formatCurrency(course.basePrice)}
                    </span>
                    <span className="text-xs text-gray-500">Course Price</span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Link
                      href={`/vendor/products/${course.id}`}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 font-medium text-sm rounded-lg transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      Edit
                    </Link>
                    <button
                      onClick={() => setPauseTarget(course.id)}
                      disabled={!course.isActive}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 disabled:opacity-60 disabled:cursor-not-allowed font-medium text-sm rounded-lg transition-colors"
                    >
                      <PauseCircle className="w-3.5 h-3.5" />
                      {course.isActive ? 'Pause' : 'Paused'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* List View */
          <div className="space-y-3">
            {filtered.map((course) => (
              <div
                key={course.id}
                className="bg-white rounded-lg border border-gray-200 p-4 flex items-start gap-4 hover:border-gray-300 transition-colors"
              >
                {/* Thumbnail */}
                <div className="w-20 h-20 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {getImageUrl(course.coverImage) && !imageLoadErrors[course.id] ? (
                    <img
                      src={getImageUrl(course.coverImage)!}
                      alt={course.name}
                      className="w-full h-full object-cover"
                      loading="eager"
                      fetchPriority="high"
                      onError={() => {
                        setImageLoadErrors((prev) => ({ ...prev, [course.id]: true }));
                      }}
                    />
                  ) : (
                    <BookOpen className="w-8 h-8 text-gray-400" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-sm font-bold text-gray-900">{course.name}</h3>
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${
                        course.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      {course.isActive ? '✓ Live' : 'Paused'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mb-1">{course.category}</p>
                  <p className="text-sm text-gray-600 line-clamp-1 mb-2">
                    {course.description}
                  </p>

                  {/* Course Details */}
                  <div className="flex gap-4 text-xs text-gray-500">
                    {course.courseDuration && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {course.courseDuration}
                      </span>
                    )}
                    {course.curriculum && course.curriculum.length > 0 && (
                      <span className="flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        {course.curriculum.length} modules
                      </span>
                    )}
                    {course.learningOutcomes && course.learningOutcomes.length > 0 && (
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-3 h-3" />
                        {course.learningOutcomes.length} outcomes
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {course.soldCount} enrolled
                    </span>
                  </div>
                </div>

                {/* Stats & Actions */}
                <div className="flex items-center gap-6 flex-shrink-0">
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">
                      {formatCurrency(course.basePrice)}
                    </p>
                    <p className="text-xs text-gray-400">Course Price</p>
                  </div>
                  <div className="flex gap-1.5">
                    <Link
                      href={`/vendor/products/${course.id}`}
                      className="p-2 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => setPauseTarget(course.id)}
                      disabled={!course.isActive}
                      className="p-2 hover:bg-amber-50 rounded-lg text-amber-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                      title={course.isActive ? 'Pause' : 'Paused'}
                    >
                      <PauseCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pause Confirmation Modal */}
      {pauseTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Pause Course?</h3>
            <p className="text-gray-600 text-sm mb-6">
              This will pause the course and sellers will no longer be able to sell it.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setPauseTarget(null)}
                className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 font-medium text-sm rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handlePause(pauseTarget)}
                disabled={pausing}
                className="flex-1 px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-medium text-sm rounded-lg transition-colors"
              >
                {pausing ? 'Pausing...' : 'Pause'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
