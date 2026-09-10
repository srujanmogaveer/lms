import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  FiSearch, 
  FiFilter, 
  FiX, 
  FiChevronLeft, 
  FiChevronRight, 
  FiCode,
  FiCpu,
  FiDatabase,
  FiShield,
  FiCloud,
  FiBriefcase,
  FiLayers
} from 'react-icons/fi';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { CourseCard } from '../../components/cards/CourseCard';
import { Heading1, Subtitle } from '../../components/ui/Typography';
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

  // Debounce search input to eliminate intermediate query egress
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
    { id: 'bestseller', label: 'Popular' },
    { id: 'under50', label: 'Paid' },
  ];

  // 3. Dynamic Course Catalog with React Query (scoped by filter params, 5-min staleTime)
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

  const categoryIcons = [FiCode, FiCpu, FiDatabase, FiShield, FiCloud, FiBriefcase, FiLayers];

  return (
    <div className="space-y-12 py-8 overflow-hidden">
      
      {/* 1. Hero Section */}
      <section className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 text-center space-y-4">
        <Badge variant="primary" size="md">Catalog Explorer</Badge>
        <Heading1>Explore Our Masterclass Catalog</Heading1>
        <Subtitle className="max-w-2xl mx-auto">
          Discover interactive, verified courses in full-stack engineering, systems architecture, cloud infrastructure, and modern data science.
        </Subtitle>
      </section>

      {/* 2. Interactive Search & Quick Filters */}
      <section className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 space-y-6">
        <div className="relative max-w-2xl mx-auto">
          <FiSearch className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search courses by title or key topic..."
            className="w-full pl-12 pr-4 py-3 text-sm rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          {searchTerm && (
            <button
              onClick={() => {
                setSearchTerm('');
                setCurrentPage(1);
              }}
              className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600"
            >
              <FiX className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Quick Filter Chips & Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            {quickFilterChips.map((chip) => (
              <button
                key={chip.id}
                onClick={() => handleChipSelect(chip.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  activeChip === chip.id
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <button
              onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
              className="lg:hidden flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
            >
              <FiFilter className="w-4 h-4" /> Filters
            </button>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                className="text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
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
          
          {/* Desktop & Mobile Filter Sidebar */}
          <aside className={`${isMobileFilterOpen ? 'block' : 'hidden'} lg:block space-y-6 bg-white dark:bg-slate-900 p-4 lg:p-0 rounded-xl border lg:border-none border-slate-200 dark:border-slate-800`}>
            <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <FiFilter className="w-4 h-4 text-brand-600" /> Filter Courses
              </h3>
              <button onClick={clearFilters} className="text-xs text-brand-600 hover:underline">Reset</button>
            </div>

            {/* Category Filter */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Category</label>
              <div className="space-y-1">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => handleCategorySelect(cat)}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
                      selectedCategory === cat
                        ? 'bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 font-semibold'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Level Filter */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Difficulty Level</label>
              <div className="space-y-1">
                {levels.map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => handleLevelSelect(lvl)}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      selectedLevel === lvl
                        ? 'bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 font-semibold'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            {/* Rating Filter */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Minimum Rating</label>
              <div className="space-y-1">
                {[4.5, 4.0, 3.5].map((stars) => (
                  <button
                    key={stars}
                    onClick={() => handleRatingSelect(stars)}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between transition-colors ${
                      selectedRating === stars
                        ? 'bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 font-semibold'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="flex items-center gap-1">⭐ {stars} & up</span>
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Course Grid Area */}
          <div className="lg:col-span-3 space-y-6">
            {isLoading ? (
              /* Loading Skeletons */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div key={n} className="rounded-2xl p-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 animate-pulse space-y-4">
                    <div className="h-44 w-full bg-slate-200 dark:bg-slate-800 rounded-xl" />
                    <div className="space-y-2">
                      <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-800 rounded" />
                      <div className="h-3 w-full bg-slate-100 dark:bg-slate-800/60 rounded" />
                      <div className="h-3 w-2/3 bg-slate-100 dark:bg-slate-800/60 rounded" />
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-slate-800">
                      <div className="h-4 w-16 bg-slate-200 dark:bg-slate-800 rounded" />
                      <div className="h-8 w-24 bg-slate-200 dark:bg-slate-800 rounded-lg" />
                    </div>
                  </div>
                ))}
              </div>
            ) : courses.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {courses.map((course: Course) => (
                    <CourseCard key={course.id} course={course} />
                  ))}
                </div>

                {/* Pagination Controls */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Showing <strong className="text-slate-700 dark:text-slate-200">{courses.length}</strong> of{' '}
                    <strong className="text-slate-700 dark:text-slate-200">{totalCourses}</strong> published masterclasses
                  </span>

                  <div className="flex items-center gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      disabled={currentPage <= 1 || isLoading}
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
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

      {/* 4. Popular Categories Section */}
      <section className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 space-y-8">
        <div className="text-center space-y-2">
          <Badge variant="neutral">Explore Domains</Badge>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Popular Learning Categories</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {(categoryList.length > 0 ? categoryList.slice(0, 6) : []).map((cat, idx) => {
            const Icon = categoryIcons[idx % categoryIcons.length];
            return (
              <Card 
                key={cat.id || cat.name} 
                hoverEffect 
                className="flex items-center gap-4 cursor-pointer"
                onClick={() => handleCategorySelect(cat.name)}
              >
                <div className="p-3.5 bg-brand-100 dark:bg-brand-950 text-brand-600 dark:text-brand-400 rounded-xl">
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 capitalize">{cat.name}</h3>
                  <p className="text-xs text-slate-400">
                    {cat.subcategories && cat.subcategories.length > 0 
                      ? `${cat.subcategories.length} Specialized Tracks` 
                      : 'Explore Catalog'}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* 5. Featured Instructors Section */}
      <section className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 space-y-8">
        <div className="text-center space-y-2">
          <Badge variant="primary">World-Class Mentors</Badge>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Featured Instructors</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {isInstructorsLoading ? (
            [1, 2].map((n) => (
              <Card key={n} className="flex gap-4 items-center animate-pulse p-5">
                <div className="w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-800 flex-shrink-0" />
                <div className="space-y-2 w-full">
                  <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
                  <div className="h-3 w-24 bg-slate-100 dark:bg-slate-800 rounded" />
                  <div className="h-3 w-48 bg-slate-100 dark:bg-slate-800 rounded" />
                </div>
              </Card>
            ))
          ) : (
            featuredInstructors.map((ins) => (
              <Card key={ins.id} className="flex gap-4 items-center p-5">
                <img 
                  src={ins.photo} 
                  alt={ins.name} 
                  className="w-16 h-16 rounded-full object-cover border-2 border-brand-500 shadow-md bg-slate-100 dark:bg-slate-800 flex-shrink-0" 
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(ins.name)}&background=4f46e5&color=fff&size=200`;
                  }}
                />
                <div className="space-y-1 overflow-hidden">
                  <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 truncate">{ins.name}</h3>
                  <p className="text-xs text-brand-600 dark:text-brand-400 font-medium truncate">{ins.role}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{ins.bio}</p>
                  <div className="flex items-center gap-3 text-xs text-slate-400 pt-1">
                    <span>Verified Faculty</span>
                    {ins.qualification && <span>• {ins.qualification.toUpperCase()}</span>}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </section>

    </div>
  );
};
