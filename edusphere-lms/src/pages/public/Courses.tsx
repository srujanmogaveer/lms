import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  FiSearch, 
  FiFilter, 
  FiX, 
  FiChevronLeft, 
  FiChevronRight, 
  FiStar,
} from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { CourseCard } from '../../components/cards/CourseCard';
import { TiltCard } from '../../components/public/TiltCard';
import { courseService } from '../../services/courseService';
import { categoryService } from '../../services/categoryService';
import type { Course } from '../../types';
import type { CategoryItem } from '../../data/categoryData';

export const Courses: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedLevel, setSelectedLevel] = useState<string>('All');
  const [selectedRating, setSelectedRating] = useState<number>(0);
  const [sortBy, setSortBy] = useState<string>('popular');
  const [activeChip, setActiveChip] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // 1. Dynamic Categories with 5-min cache
  const { data: categoryList = [] } = useQuery<CategoryItem[]>({
    queryKey: ['public-categories'],
    queryFn: async () => {
      const res = await categoryService.getCategories(true);
      return res.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const categories = useMemo(() => {
    return ['All', ...categoryList.map((c) => c.name)];
  }, [categoryList]);

  // 2. Dynamic Featured Instructors with 5-min cache
  const { data: featuredInstructors = [], isLoading: isInstructorsLoading } = useQuery<{
    id: string;
    name: string;
    role: string;
    photo: string;
    bio: string;
    qualification?: string;
  }[]>({
    queryKey: ['featured-instructors-leadership'],
    queryFn: async () => {
      const res = await courseService.getPublicLeadership();
      return (res.data || []).slice(0, 4);
    },
    staleTime: 5 * 60 * 1000,
  });

  const levels = ['All', 'Beginner', 'Intermediate', 'Advanced', 'All Levels'];

  const quickFilterChips = [
    { id: 'all', label: 'All Courses' },
    { id: 'featured', label: 'Featured' },
    { id: 'bestseller', label: 'Most Popular' },
    { id: 'under50', label: 'Paid Tracks' },
  ];

  // 3. Dynamic Course Catalog with React Query
  const queryParams = useMemo(() => {
    const params: Record<string, any> = {
      page: currentPage,
      limit: 9,
    };

    if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
    if (selectedCategory !== 'All') params.category = selectedCategory;
    if (selectedLevel !== 'All') params.difficulty = selectedLevel;
    if (selectedRating > 0) params.minRating = selectedRating;
    if (sortBy) params.sortBy = sortBy;

    if (activeChip === 'featured') {
      params.priceType = 'featured';
    } else if (activeChip === 'under50') {
      params.priceType = 'paid';
    } else if (activeChip === 'bestseller') {
      params.sortBy = 'popular';
    }

    return params;
  }, [currentPage, debouncedSearch, selectedCategory, selectedLevel, selectedRating, sortBy, activeChip]);

  const { data: coursesData, isLoading } = useQuery({
    queryKey: ['public-courses-catalog', queryParams],
    queryFn: async () => {
      const res = await courseService.getPublicCourses(queryParams);
      return {
        courses: res.data || [],
        totalPages: res.pagination?.totalPages || 1,
        totalCourses: res.pagination?.total || 0,
      };
    },
    staleTime: 5 * 60 * 1000,
  });

  const courses = coursesData?.courses || [];
  const totalPages = coursesData?.totalPages || 1;
  const totalCourses = coursesData?.totalCourses || 0;

  const handleCategorySelect = (cat: string) => {
    setSelectedCategory(cat);
    setCurrentPage(1);
  };

  const handleLevelSelect = (lvl: string) => {
    setSelectedLevel(lvl);
    setCurrentPage(1);
  };

  const handleRatingSelect = (stars: number) => {
    setSelectedRating(selectedRating === stars ? 0 : stars);
    setCurrentPage(1);
  };

  const handleChipSelect = (chipId: string) => {
    setActiveChip(chipId);
    setCurrentPage(1);
  };

  const handleSortChange = (newSort: string) => {
    setSortBy(newSort);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('All');
    setSelectedLevel('All');
    setSelectedRating(0);
    setActiveChip('all');
    setSortBy('popular');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-16 py-12 text-slate-900 dark:text-slate-100 overflow-hidden transition-colors duration-300">
      
      {/* 1. Header Banner */}
      <section className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50/80 dark:bg-white/[0.06] border border-indigo-200/60 dark:border-white/[0.12] backdrop-blur-md text-xs font-semibold text-indigo-600 dark:text-indigo-300">
          <HiSparkles className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
          <span>Curated Tech Masterclasses</span>
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 dark:text-white">
          Explore Our Masterclass Catalog
        </h1>
        <p className="text-slate-600 dark:text-slate-300 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
          Industry-aligned curricula in Full-Stack Engineering, Generative AI, Cloud Systems, and Modern UI/UX Architecture.
        </p>
      </section>

      {/* 2. Interactive Search & Quick Filters Capsule */}
      <section className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 space-y-6">
        <div className="relative max-w-2xl mx-auto">
          <FiSearch className="absolute left-4 top-3.5 w-5 h-5 text-indigo-500 dark:text-indigo-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search courses by title, keywords or technology..."
            className="w-full pl-12 pr-10 py-3.5 text-sm rounded-2xl border border-slate-200/90 dark:border-white/[0.12] bg-white/90 dark:bg-white/[0.05] text-slate-900 dark:text-white placeholder-slate-400 shadow-lg dark:shadow-2xl backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500/60 transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => {
                setSearchTerm('');
                setCurrentPage(1);
              }}
              className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-700 dark:hover:text-white"
            >
              <FiX className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Quick Filter Chips & Sort Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-b border-slate-200/80 dark:border-white/[0.08] pb-4">
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            {quickFilterChips.map((chip) => (
              <button
                key={chip.id}
                onClick={() => handleChipSelect(chip.id)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                  activeChip === chip.id
                    ? 'bg-gradient-to-r from-brand-600 to-purple-600 text-white shadow-md shadow-brand-500/25 border border-brand-400/30'
                    : 'bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-white/[0.08] hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-white/[0.08]'
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <button
              onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
              className="lg:hidden flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-white/[0.06] border border-slate-200 dark:border-white/[0.1] text-slate-700 dark:text-white"
            >
              <FiFilter className="w-4 h-4 text-indigo-500 dark:text-indigo-400" /> Filters
            </button>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                className="text-xs bg-white dark:bg-[#0b0e1f] border border-slate-200 dark:border-white/[0.12] rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer"
              >
                <option value="popular">Most Popular</option>
                <option value="rating">Highest Rated</option>
                <option value="newest">Newest Releases</option>
                <option value="oldest">Oldest First</option>
                <option value="alphabetical">Alphabetical (A-Z)</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Main Content Grid & Sidebar Filters */}
      <section className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Filter Sidebar (Frosted Glass Panel) */}
          <aside className={`${isMobileFilterOpen ? 'block' : 'hidden'} lg:block space-y-6 rounded-3xl p-6 bg-white/85 dark:bg-[#0c1022]/80 border border-slate-200/80 dark:border-white/[0.1] backdrop-blur-2xl shadow-xl self-start sticky top-28`}>
            <div className="flex justify-between items-center pb-3 border-b border-slate-200/80 dark:border-white/[0.08]">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <FiFilter className="w-4 h-4 text-indigo-500 dark:text-indigo-400" /> Filter Catalog
              </h3>
              <button onClick={clearFilters} className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 font-semibold">Reset</button>
            </div>

            {/* Category Filter */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Track Category</label>
              <div className="space-y-1 max-h-52 overflow-y-auto pr-1">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => handleCategorySelect(cat)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-colors capitalize ${
                      selectedCategory === cat
                        ? 'bg-brand-50 dark:bg-brand-500/20 text-brand-600 dark:text-brand-300 font-semibold border border-brand-200 dark:border-brand-400/40'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.04] hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Level Filter */}
            <div className="space-y-2 pt-3 border-t border-slate-200/80 dark:border-white/[0.08]">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Difficulty Level</label>
              <div className="space-y-1">
                {levels.map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => handleLevelSelect(lvl)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                      selectedLevel === lvl
                        ? 'bg-brand-50 dark:bg-brand-500/20 text-brand-600 dark:text-brand-300 font-semibold border border-brand-200 dark:border-brand-400/40'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.04] hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            {/* Rating Filter */}
            <div className="space-y-2 pt-3 border-t border-slate-200/80 dark:border-white/[0.08]">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Minimum Rating</label>
              <div className="space-y-1">
                {[4.5, 4.0, 3.5].map((stars) => (
                  <button
                    key={stars}
                    onClick={() => handleRatingSelect(stars)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between transition-colors ${
                      selectedRating === stars
                        ? 'bg-brand-50 dark:bg-brand-500/20 text-brand-600 dark:text-brand-300 font-semibold border border-brand-200 dark:border-brand-400/40'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.04] hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <span className="flex items-center gap-1 text-amber-500 dark:text-amber-400">
                      <FiStar className="w-3.5 h-3.5 fill-amber-400" /> {stars} &amp; above
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Course Grid Area */}
          <div className="lg:col-span-3 space-y-8">
            {isLoading ? (
              /* Loading Skeletons */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div key={n} className="rounded-3xl p-5 border border-slate-200/80 dark:border-white/[0.08] bg-white/60 dark:bg-white/[0.04] backdrop-blur-xl animate-pulse space-y-4">
                    <div className="h-44 w-full bg-slate-200 dark:bg-white/[0.08] rounded-2xl" />
                    <div className="space-y-2">
                      <div className="h-4 w-3/4 bg-slate-200 dark:bg-white/[0.08] rounded" />
                      <div className="h-3 w-full bg-slate-100 dark:bg-white/[0.05] rounded" />
                      <div className="h-3 w-2/3 bg-slate-100 dark:bg-white/[0.05] rounded" />
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t border-slate-200 dark:border-white/[0.08]">
                      <div className="h-4 w-16 bg-slate-200 dark:bg-white/[0.08] rounded" />
                      <div className="h-8 w-24 bg-slate-200 dark:bg-white/[0.08] rounded-xl" />
                    </div>
                  </div>
                ))}
              </div>
            ) : courses.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {courses.map((course: Course) => (
                    <TiltCard key={course.id} tiltIntensity={6}>
                      <CourseCard course={course} mode="public" />
                    </TiltCard>
                  ))}
                </div>

                {/* Pagination Controls */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-8 border-t border-slate-200/80 dark:border-white/[0.08]">
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Showing <strong className="text-slate-900 dark:text-white">{courses.length}</strong> of{' '}
                    <strong className="text-slate-900 dark:text-white">{totalCourses}</strong> published masterclasses
                  </span>

                  <div className="flex items-center gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      disabled={currentPage <= 1 || isLoading}
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      className="border-slate-300 dark:border-white/[0.12] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.06]"
                    >
                      <FiChevronLeft className="w-4 h-4 mr-1" /> Previous
                    </Button>
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 px-3">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      disabled={currentPage >= totalPages || isLoading}
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      className="border-slate-300 dark:border-white/[0.12] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.06]"
                    >
                      Next <FiChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <EmptyState
                type="courses"
                title="No Courses Found"
                description="We couldn't find any published courses matching your search or filters in our live catalog."
                actionLabel="Reset All Filters"
                onAction={clearFilters}
              />
            )}
          </div>

        </div>
      </section>

      {/* 4. Featured Instructors Section */}
      <section className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 space-y-8 pt-8">
        <div className="text-center space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">World-Class Mentors</span>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">Learn From Industry Leaders</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {isInstructorsLoading ? (
            [1, 2].map((n) => (
              <div key={n} className="flex gap-4 items-center animate-pulse p-6 rounded-3xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08]">
                <div className="w-16 h-16 rounded-2xl bg-slate-200 dark:bg-white/[0.08] flex-shrink-0" />
                <div className="space-y-2 w-full">
                  <div className="h-4 w-32 bg-slate-200 dark:bg-white/[0.08] rounded" />
                  <div className="h-3 w-24 bg-slate-100 dark:bg-white/[0.05] rounded" />
                  <div className="h-3 w-48 bg-slate-100 dark:bg-white/[0.05] rounded" />
                </div>
              </div>
            ))
          ) : (
            featuredInstructors.map((ins) => (
              <TiltCard key={ins.id} tiltIntensity={6}>
                <div className="flex gap-4 items-center p-6 rounded-3xl bg-white/85 dark:bg-[#0c1022]/80 border border-slate-200/80 dark:border-white/[0.1] backdrop-blur-xl shadow-lg dark:shadow-xl">
                  <img 
                    src={ins.photo} 
                    alt={ins.name} 
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-indigo-500 shadow-md bg-slate-900 flex-shrink-0" 
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(ins.name)}&background=4f46e5&color=fff&size=200`;
                    }}
                  />
                  <div className="space-y-1 overflow-hidden">
                    <h3 className="font-bold text-base text-slate-900 dark:text-white truncate">{ins.name}</h3>
                    <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium truncate">{ins.role}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-1">{ins.bio}</p>
                    <div className="flex items-center gap-3 text-xs text-slate-400 pt-1">
                      <span>Verified Faculty</span>
                      {ins.qualification && <span>• {ins.qualification.toUpperCase()}</span>}
                    </div>
                  </div>
                </div>
              </TiltCard>
            ))
          )}
        </div>
      </section>

    </div>
  );
};
