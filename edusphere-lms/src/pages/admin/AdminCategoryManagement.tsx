import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiGrid,
  FiCheckCircle,
  FiXCircle,
  FiBookOpen,
  FiSearch,
  FiFilter,
  FiPlus,
  FiEdit,
  FiTrash2,
  FiEye,
  FiX,
  FiUploadCloud,
  FiAlertTriangle,
  FiFolder,
  FiToggleLeft,
  FiToggleRight,
  FiLayers,
  FiMaximize2,
  FiImage,
  FiExternalLink
} from 'react-icons/fi';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { type CategoryItem } from '../../data/categoryData';
import { categoryService } from '../../services/categoryService';

const DEFAULT_CATEGORY_IMAGE = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80';

export const AdminCategoryManagement: React.FC = () => {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');

  // Active Modals state
  const [selectedCategory, setSelectedCategory] = useState<CategoryItem | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState<boolean>(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const [lightboxImage, setLightboxImage] = useState<{ url: string; title: string } | null>(null);
  const [previewFitMode, setPreviewFitMode] = useState<'cover' | 'contain'>('contain');
  const [isUploadingImage, setIsUploadingImage] = useState<boolean>(false);

  // Form Fields State
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    imageUrl: string;
    status: 'Active' | 'Inactive';
    subcategories: string[];
    newSubcategoryInput: string;
  }>({
    name: '',
    description: '',
    imageUrl: DEFAULT_CATEGORY_IMAGE,
    status: 'Active',
    subcategories: [],
    newSubcategoryInput: '',
  });

  const [imageTab, setImageTab] = useState<'url' | 'upload'>('url');
  const [formError, setFormError] = useState<string | null>(null);

  // Notification Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Load Categories from Backend API on mount
  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const res = await categoryService.getCategories();
      if (res.success && res.data && Array.isArray(res.data)) {
        setCategories(res.data);
      } else {
        setCategories([]);
      }
    } catch {
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchCategories();
  }, []);

  // Metric calculation
  const totalCategories = categories.length;
  const activeCategories = useMemo(() => categories.filter((c) => c.status === 'Active').length, [categories]);
  const inactiveCategories = useMemo(() => categories.filter((c) => c.status === 'Inactive').length, [categories]);
  const totalCoursesCount = useMemo(() => categories.reduce((sum, c) => sum + (c.totalCourses || 0), 0), [categories]);

  // Filtered categories
  const filteredCategories = useMemo(() => {
    return categories.filter((cat) => {
      const matchesSearch =
        cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cat.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'All' || cat.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [categories, searchQuery, statusFilter]);

  // Handlers for Create / Edit Modal
  const openCreateModal = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      description: '',
      imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80',
      status: 'Active',
      subcategories: [],
      newSubcategoryInput: '',
    });
    setFormError(null);
    setIsFormModalOpen(true);
  };

  const openEditModal = (cat: CategoryItem) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name,
      description: cat.description,
      imageUrl: cat.imageUrl,
      status: cat.status,
      subcategories: Array.isArray(cat.subcategories) ? cat.subcategories.map((s: any) => typeof s === 'string' ? s : s.name) : [],
      newSubcategoryInput: '',
    });
    setFormError(null);
    setIsFormModalOpen(true);
  };

  const handleAddSubcategoryChip = () => {
    if (!formData.newSubcategoryInput.trim()) return;
    if (formData.subcategories.includes(formData.newSubcategoryInput.trim())) return;
    setFormData((prev) => ({
      ...prev,
      subcategories: [...prev.subcategories, prev.newSubcategoryInput.trim()],
      newSubcategoryInput: '',
    }));
  };

  const handleRemoveSubcategoryChip = (subName: string) => {
    setFormData((prev) => ({
      ...prev,
      subcategories: prev.subcategories.filter((s) => s !== subName),
    }));
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError('Category Name is required.');
      return;
    }
    if (!formData.description.trim()) {
      setFormError('Category Description is required.');
      return;
    }

    try {
      if (editingCategory) {
        // Update existing via backend API
        const res = await categoryService.updateCategory(editingCategory.id, {
          name: formData.name.trim(),
          description: formData.description.trim(),
          imageUrl: formData.imageUrl,
          status: formData.status,
          subcategories: formData.subcategories,
        });

        if (res.success && res.data) {
          const updatedCat = res.data;
          setCategories((prev) => prev.map((item) => (item.id === editingCategory.id ? updatedCat : item)));
        } else {
          setCategories((prev) =>
            prev.map((item): CategoryItem => {
              if (item.id === editingCategory.id) {
                return {
                  ...item,
                  name: formData.name.trim(),
                  description: formData.description.trim(),
                  imageUrl: formData.imageUrl || item.imageUrl,
                  status: formData.status,
                  subcategories: formData.subcategories.map((sName, idx) => ({
                    id: `sub-edit-${idx}-${Date.now()}`,
                    name: sName,
                    slug: sName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                    description: `Subcategory under ${formData.name}`,
                    coursesCount: 0,
                    status: 'Active',
                  })),
                };
              }
              return item;
            })
          );
        }
        showToast(`Category "${formData.name}" updated successfully.`);
      } else {
        // Create new via backend API
        const res = await categoryService.createCategory({
          name: formData.name.trim(),
          description: formData.description.trim(),
          imageUrl: formData.imageUrl,
          status: formData.status,
          subcategories: formData.subcategories,
        });

        if (res.success && res.data) {
          const createdItem: CategoryItem = res.data;
          setCategories((prev: CategoryItem[]): CategoryItem[] => [createdItem, ...prev]);
        } else {
          const newCat: CategoryItem = {
            id: `cat-${Date.now()}`,
            name: formData.name.trim(),
            slug: formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            description: formData.description.trim(),
            imageUrl: formData.imageUrl || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80',
            status: formData.status,
            totalCourses: 0,
            createdAt: new Date().toLocaleDateString('en-GB'),
            updatedAt: new Date().toLocaleDateString('en-GB'),
            subcategories: formData.subcategories.map((sName, idx) => ({
              id: `sub-${Date.now()}-${idx}`,
              name: sName,
              slug: sName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
              description: `Subcategory under ${formData.name}`,
              coursesCount: 0,
              status: 'Active',
            })),
          };
          setCategories((prev: CategoryItem[]): CategoryItem[] => [newCat, ...prev]);
        }
        showToast(`Category "${formData.name}" created successfully.`);
      }
      setIsFormModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Failed to save category');
    }
  };

  // Toggle Activate / Deactivate
  const handleToggleStatus = async (cat: CategoryItem) => {
    const newStatus = cat.status === 'Active' ? 'Inactive' : 'Active';
    try {
      await categoryService.updateCategory(cat.id, { status: newStatus });
    } catch {
      // Keep optimistic update
    }
    setCategories((prev) =>
      prev.map((c) => (c.id === cat.id ? { ...c, status: newStatus } : c))
    );
    showToast(`Category "${cat.name}" status set to ${newStatus}.`);
    if (selectedCategory && selectedCategory.id === cat.id) {
      setSelectedCategory((prev) => (prev ? { ...prev, status: newStatus } : null));
    }
  };

  // Delete Category Handlers
  const openDeleteModal = (cat: CategoryItem) => {
    setSelectedCategory(cat);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedCategory) return;
    if (selectedCategory.totalCourses > 0) {
      showToast('Cannot delete category with assigned courses.');
      return;
    }

    try {
      await categoryService.deleteCategory(selectedCategory.id);
    } catch {
      // Local removal
    }

    setCategories((prev) => prev.filter((item) => item.id !== selectedCategory.id));
    showToast(`Category "${selectedCategory.name}" removed successfully.`);
    setIsDeleteModalOpen(false);
    setSelectedCategory(null);
  };

  // Category image upload state with instant preview & resilient fallback
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate mime type (support all standard formats)
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setFormError('Invalid file format. Please upload JPG, PNG, WebP, or GIF.');
      return;
    }

    // Validate size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      setFormError('File size exceeds 10MB limit. Please choose a smaller image.');
      return;
    }

    // 1. Instant local preview so the user sees the full image immediately
    const localPreviewUrl = URL.createObjectURL(file);
    setFormData((prev) => ({ ...prev, imageUrl: localPreviewUrl }));
    setIsUploadingImage(true);
    setFormError(null);

    try {
      const res = await categoryService.uploadImage(file, editingCategory?.id);
      if (res.success && res.data?.imageUrl) {
        setFormData((prev) => ({ ...prev, imageUrl: res.data!.imageUrl }));
        showToast('Category image uploaded successfully to storage.');
      } else {
        // Fallback: Convert to Base64 data URL so the uploaded image is never lost
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            setFormData((prev) => ({ ...prev, imageUrl: event.target!.result as string }));
          }
        };
        reader.readAsDataURL(file);
        showToast('Category image loaded locally as Data URL.');
      }
    } catch {
      // Fallback: Convert to Base64 data URL so the uploaded image is never lost
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setFormData((prev) => ({ ...prev, imageUrl: event.target!.result as string }));
        }
      };
      reader.readAsDataURL(file);
      showToast('Category image saved locally.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-8 pb-16 font-sans"
    >
      {/* Toast Notification Banner */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-5 right-5 z-50 px-4 py-3 bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold rounded-2xl shadow-2xl flex items-center gap-2 border border-slate-700"
          >
            <FiCheckCircle className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-[24px] border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <FiGrid className="w-7 h-7 text-rose-500" /> Category Governance Studio
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage course taxonomy, primary categories, subcategories, and active catalog filters for EduSphere LMS.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            onClick={openCreateModal}
            className="text-xs py-2.5 px-4 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-rose-500/20"
          >
            <FiPlus className="w-4 h-4" /> Add Category
          </Button>
        </div>
      </div>

      {/* Dashboard Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 rounded-[20px] bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 flex items-center gap-3">
          <div className="p-3 bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 rounded-xl">
            <FiFolder className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Total Categories</p>
            <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">{totalCategories}</h3>
          </div>
        </Card>

        <Card className="p-4 rounded-[20px] bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-3">
          <div className="p-3 bg-emerald-600 text-white rounded-xl shadow-sm">
            <FiCheckCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Active Categories</p>
            <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">{activeCategories}</h3>
          </div>
        </Card>

        <Card className="p-4 rounded-[20px] bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center gap-3">
          <div className="p-3 bg-slate-400 text-white rounded-xl shadow-sm">
            <FiXCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Inactive Categories</p>
            <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">{inactiveCategories}</h3>
          </div>
        </Card>

        <Card className="p-4 rounded-[20px] bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 flex items-center gap-3">
          <div className="p-3 bg-indigo-600 text-white rounded-xl shadow-sm">
            <FiBookOpen className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Total Courses Assigned</p>
            <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">{totalCoursesCount}</h3>
          </div>
        </Card>
      </div>

      {/* Toolbar: Search, Filters & Quick Actions */}
      <Card className="p-4 sm:p-5 rounded-[20px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-96">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by Category Name or Description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 text-slate-900 dark:text-slate-100"
          />
        </div>

        {/* Filters & Actions */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold">
            <FiFilter className="w-4 h-4 text-slate-400" /> Filter Status:
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 font-bold"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>

          <Button
            size="sm"
            variant="outline"
            onClick={openCreateModal}
            className="text-xs rounded-xl flex items-center gap-1"
          >
            <FiPlus className="w-3.5 h-3.5" /> Quick Add
          </Button>
        </div>
      </Card>

      {/* Category List Grid */}
      {isLoading ? (
        <Card className="p-12 text-center rounded-[24px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
          <div className="w-12 h-12 border-4 border-rose-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-500">Loading categories from database...</p>
        </Card>
      ) : filteredCategories.length === 0 ? (
        /* Empty State */
        <Card className="p-12 text-center rounded-[24px] border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 space-y-4">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-400">
            <FiFolder className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">No categories available.</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No categories matched your search criteria. Create a new category or reset your filter.
            </p>
          </div>
          <Button
            size="sm"
            variant="primary"
            onClick={openCreateModal}
            className="text-xs bg-rose-600 hover:bg-rose-500 text-white rounded-xl py-2 px-4 inline-flex items-center gap-1.5"
          >
            <FiPlus className="w-4 h-4" /> Create Category
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCategories.map((cat) => (
            <motion.div
              key={cat.id}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="p-5 rounded-[24px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between h-full space-y-4 shadow-sm">
                <div className="space-y-3">
                  {/* Category Image Banner & Status Badge */}
                  <div
                    onClick={() => setLightboxImage({ url: cat.imageUrl || DEFAULT_CATEGORY_IMAGE, title: cat.name })}
                    className="relative h-44 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 group bg-slate-900 cursor-pointer shadow-inner"
                    title="Click to view full uncropped image"
                  >
                    {/* Blurred Ambient Backdrop for full image aspect support */}
                    <img
                      src={cat.imageUrl || DEFAULT_CATEGORY_IMAGE}
                      alt=""
                      aria-hidden="true"
                      className="absolute inset-0 w-full h-full object-cover blur-md opacity-40 scale-110"
                    />
                    {/* Main Image */}
                    <img
                      src={cat.imageUrl || DEFAULT_CATEGORY_IMAGE}
                      alt={cat.name}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = DEFAULT_CATEGORY_IMAGE;
                      }}
                      className="relative z-10 w-full h-full object-contain p-1.5 group-hover:scale-105 transition-transform duration-300"
                    />
                    {/* Zoom icon on hover */}
                    <div className="absolute inset-0 z-20 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                      <span className="px-3 py-1.5 bg-black/70 backdrop-blur-md rounded-xl text-[10px] font-bold text-white flex items-center gap-1.5 shadow-lg">
                        <FiMaximize2 className="w-3.5 h-3.5 text-rose-400" /> View Full Image
                      </span>
                    </div>
                    <div className="absolute top-3 right-3 z-20">
                      <Badge
                        variant={cat.status === 'Active' ? 'success' : 'neutral'}
                        className="shadow-md"
                      >
                        {cat.status === 'Active' ? '✓ Active' : '✕ Inactive'}
                      </Badge>
                    </div>
                    <div className="absolute bottom-3 left-3 z-20 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-lg text-white font-bold text-[10px] flex items-center gap-1 border border-slate-700/50 shadow">
                      <FiBookOpen className="w-3 h-3 text-rose-400" /> {cat.totalCourses} Courses
                    </div>
                  </div>

                  {/* Info */}
                  <div className="space-y-1">
                    <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                      {cat.name}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {cat.description}
                    </p>
                  </div>

                  {/* Subcategories Chips */}
                  {cat.subcategories.length > 0 && (
                    <div className="space-y-1 pt-1">
                      <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                        Subcategories ({cat.subcategories.length}):
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {cat.subcategories.slice(0, 3).map((sub) => (
                          <span
                            key={sub.id}
                            className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-semibold rounded-md"
                          >
                            {sub.name}
                          </span>
                        ))}
                        {cat.subcategories.length > 3 && (
                          <span className="px-1.5 py-0.5 bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 text-[10px] font-bold rounded-md">
                            +{cat.subcategories.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Actions */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setSelectedCategory(cat);
                        setIsDetailsModalOpen(true);
                      }}
                      className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="View Details"
                      aria-label="View Category Details"
                    >
                      <FiEye className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => openEditModal(cat)}
                      className="p-2 rounded-xl text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 transition-colors"
                      title="Edit Category"
                      aria-label="Edit Category"
                    >
                      <FiEdit className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleToggleStatus(cat)}
                      className={`p-2 rounded-xl transition-colors ${
                        cat.status === 'Active'
                          ? 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/60'
                          : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/60'
                      }`}
                      title={cat.status === 'Active' ? 'Deactivate Category' : 'Activate Category'}
                      aria-label={cat.status === 'Active' ? 'Deactivate Category' : 'Activate Category'}
                    >
                      {cat.status === 'Active' ? (
                        <FiToggleRight className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <FiToggleLeft className="w-4 h-4 text-slate-400" />
                      )}
                    </button>
                  </div>

                  <button
                    onClick={() => openDeleteModal(cat)}
                    className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors"
                    title="Delete Category"
                    aria-label="Delete Category"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* ======================================================== */}
      {/* 1. CREATE / EDIT CATEGORY MODAL */}
      {/* ======================================================== */}
      <AnimatePresence>
        {isFormModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto font-sans" role="dialog" aria-label="Category Form">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[28px] p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
                <h2 className="text-lg font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <FiFolder className="w-5 h-5 text-rose-500" />
                  {editingCategory ? 'Edit Category' : 'Create New Category'}
                </h2>
                <button
                  onClick={() => setIsFormModalOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              {formError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-600 dark:text-rose-300 font-bold flex items-center gap-2">
                  <FiAlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleSaveCategory} className="space-y-4 text-xs">
                {/* Name */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Web Development, Artificial Intelligence"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    Description *
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Briefly describe what courses fall under this category..."
                    value={formData.description}
                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                {/* Category Image Options */}
                <div className="space-y-2">
                  <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span>Category Image</span>
                    <div className="flex gap-2 font-semibold text-[11px]">
                      <button
                        type="button"
                        onClick={() => setImageTab('url')}
                        className={`px-2 py-0.5 rounded-md ${imageTab === 'url' ? 'bg-rose-500 text-white' : 'text-slate-500'}`}
                      >
                        Image URL
                      </button>
                      <button
                        type="button"
                        onClick={() => setImageTab('upload')}
                        className={`px-2 py-0.5 rounded-md ${imageTab === 'upload' ? 'bg-rose-500 text-white' : 'text-slate-500'}`}
                      >
                        Upload Image
                      </button>
                    </div>
                  </label>

                  {imageTab === 'url' ? (
                    <input
                      type="text"
                      placeholder="https://images.unsplash.com/photo-..."
                      value={formData.imageUrl}
                      onChange={(e) => setFormData((prev) => ({ ...prev, imageUrl: e.target.value }))}
                      className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  ) : (
                    <div className="p-4 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-center space-y-2 bg-slate-50/50 dark:bg-slate-800/40">
                      <FiUploadCloud className="w-6 h-6 text-rose-500 mx-auto" />
                      <p className="text-slate-500 text-[11px]">
                        {isUploadingImage
                          ? 'Uploading image to Supabase Storage...'
                          : 'Choose a JPG, PNG, or WebP image (max 5MB)'}
                      </p>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        disabled={isUploadingImage}
                        onChange={handleFileUpload}
                        className="text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-rose-50 file:text-rose-600 hover:file:bg-rose-100 cursor-pointer disabled:opacity-50"
                      />
                    </div>
                  )}

                  {/* Image Live Preview */}
                  {formData.imageUrl && (
                    <div className="space-y-1.5 pt-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                          <FiImage className="w-3.5 h-3.5 text-rose-500" /> Image Live Preview
                        </span>
                        <div className="flex items-center gap-2">
                          <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 text-[10px] font-semibold border border-slate-200 dark:border-slate-700">
                            <button
                              type="button"
                              onClick={() => setPreviewFitMode('contain')}
                              className={`px-2 py-0.5 rounded-md transition-all ${
                                previewFitMode === 'contain'
                                  ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-sm font-bold'
                                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                              }`}
                            >
                              Full Image (Fit)
                            </button>
                            <button
                              type="button"
                              onClick={() => setPreviewFitMode('cover')}
                              className={`px-2 py-0.5 rounded-md transition-all ${
                                previewFitMode === 'cover'
                                  ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-sm font-bold'
                                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                              }`}
                            >
                              Fill Box (Cover)
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => setLightboxImage({ url: formData.imageUrl, title: formData.name || 'Category Image Preview' })}
                            className="p-1 rounded-md text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="Expand Full Screen"
                          >
                            <FiMaximize2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div
                        onClick={() => setLightboxImage({ url: formData.imageUrl, title: formData.name || 'Category Image Preview' })}
                        className="relative h-44 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-950 group cursor-pointer shadow-inner"
                      >
                        {previewFitMode === 'contain' && (
                          <img
                            src={formData.imageUrl}
                            alt=""
                            aria-hidden="true"
                            className="absolute inset-0 w-full h-full object-cover blur-md opacity-30 scale-110"
                          />
                        )}
                        <img
                          src={formData.imageUrl}
                          alt="Preview"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = DEFAULT_CATEGORY_IMAGE;
                          }}
                          className={`relative z-10 w-full h-full ${
                            previewFitMode === 'contain' ? 'object-contain p-2' : 'object-cover'
                          }`}
                        />
                        {isUploadingImage && (
                          <div className="absolute inset-0 z-20 bg-slate-950/70 backdrop-blur-sm flex flex-col items-center justify-center text-white gap-2">
                            <div className="w-6 h-6 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
                            <span className="text-[11px] font-bold">Uploading to Cloud Storage...</span>
                          </div>
                        )}
                        <div className="absolute bottom-2 right-2 z-20 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded text-white text-[9px] font-semibold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <FiMaximize2 className="w-2.5 h-2.5" /> Click to enlarge
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Subcategories Chips Input */}
                <div className="space-y-2">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    Subcategories
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Add subcategory (e.g. React & Next.js) and press Add"
                      value={formData.newSubcategoryInput}
                      onChange={(e) => setFormData((prev) => ({ ...prev, newSubcategoryInput: e.target.value }))}
                      className="flex-1 p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={handleAddSubcategoryChip}
                      className="text-xs rounded-xl py-2.5 px-3"
                    >
                      + Add
                    </Button>
                  </div>

                  {formData.subcategories.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {formData.subcategories.map((sub) => (
                        <span
                          key={sub}
                          className="px-2.5 py-1 bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 rounded-lg text-xs font-semibold flex items-center gap-1 border border-rose-200 dark:border-rose-800"
                        >
                          {sub}
                          <button
                            type="button"
                            onClick={() => handleRemoveSubcategoryChip(sub)}
                            className="hover:text-rose-900"
                          >
                            <FiX className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Status Options */}
                <div className="space-y-1.5 pt-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    Status
                  </label>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800 dark:text-slate-200">
                      <input
                        type="radio"
                        name="catStatus"
                        value="Active"
                        checked={formData.status === 'Active'}
                        onChange={() => setFormData((prev) => ({ ...prev, status: 'Active' }))}
                        className="text-rose-600 focus:ring-rose-500"
                      />
                      Active (Visible for course creation)
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800 dark:text-slate-200">
                      <input
                        type="radio"
                        name="catStatus"
                        value="Inactive"
                        checked={formData.status === 'Inactive'}
                        onChange={() => setFormData((prev) => ({ ...prev, status: 'Inactive' }))}
                        className="text-rose-600 focus:ring-rose-500"
                      />
                      Inactive (Hidden from instructors)
                    </label>
                  </div>
                </div>

                {/* Modal Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsFormModalOpen(false)}
                    className="text-xs rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    className="text-xs bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl py-2.5 px-5 shadow-md"
                  >
                    {editingCategory ? 'Update Category' : 'Save Category'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================================================== */}
      {/* 2. CATEGORY DETAILS MODAL */}
      {/* ======================================================== */}
      <AnimatePresence>
        {isDetailsModalOpen && selectedCategory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto font-sans" role="dialog" aria-label="Category Details">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[28px] p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Badge variant={selectedCategory.status === 'Active' ? 'success' : 'neutral'}>
                    {selectedCategory.status}
                  </Badge>
                  <span className="text-xs text-slate-400">ID: {selectedCategory.id}</span>
                </div>
                <button
                  onClick={() => setIsDetailsModalOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              {/* Banner & Title */}
              <div className="space-y-4">
                <div
                  onClick={() => setLightboxImage({ url: selectedCategory.imageUrl || DEFAULT_CATEGORY_IMAGE, title: selectedCategory.name })}
                  className="relative h-56 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-950 group cursor-pointer shadow-lg"
                  title="Click to view full uncropped image"
                >
                  <img
                    src={selectedCategory.imageUrl || DEFAULT_CATEGORY_IMAGE}
                    alt=""
                    aria-hidden="true"
                    className="absolute inset-0 w-full h-full object-cover blur-md opacity-40 scale-110"
                  />
                  <img
                    src={selectedCategory.imageUrl || DEFAULT_CATEGORY_IMAGE}
                    alt={selectedCategory.name}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = DEFAULT_CATEGORY_IMAGE;
                    }}
                    className="relative z-10 w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute bottom-3 right-3 z-20 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-lg text-white font-bold text-[10px] flex items-center gap-1 border border-slate-700/60 shadow">
                    <FiMaximize2 className="w-3 h-3 text-rose-400" /> Full Size View
                  </div>
                </div>

                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">
                    {selectedCategory.name}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    {selectedCategory.description}
                  </p>
                </div>
              </div>

              {/* Specs Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
                <div>
                  <span className="text-slate-400 block text-[10px] font-semibold">Total Courses</span>
                  <span className="font-black text-rose-600 dark:text-rose-400 text-sm">{selectedCategory.totalCourses} Courses</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-semibold">Created Date</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{selectedCategory.createdAt}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-semibold">Last Updated</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{selectedCategory.updatedAt}</span>
                </div>
              </div>

              {/* Subcategories Breakdown Table */}
              <div className="space-y-2">
                <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                  <FiLayers className="w-4 h-4 text-indigo-500" /> Subcategories ({selectedCategory.subcategories.length})
                </h4>

                {selectedCategory.subcategories.length > 0 ? (
                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                    {selectedCategory.subcategories.map((sub) => (
                      <div key={sub.id} className="p-3 flex items-center justify-between bg-white dark:bg-slate-900">
                        <div>
                          <span className="font-bold text-slate-900 dark:text-slate-100 block">{sub.name}</span>
                          <span className="text-[11px] text-slate-400">{sub.description}</span>
                        </div>
                        <Badge variant="neutral">{sub.coursesCount} Courses</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No subcategories defined.</p>
                )}
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setIsDetailsModalOpen(false);
                    openEditModal(selectedCategory);
                  }}
                  className="text-xs rounded-xl flex items-center gap-1.5"
                >
                  <FiEdit className="w-3.5 h-3.5 text-indigo-500" /> Edit Category
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsDetailsModalOpen(false)}
                  className="text-xs rounded-xl"
                >
                  Close
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================================================== */}
      {/* 3. DELETE CONFIRMATION DIALOG */}
      {/* ======================================================== */}
      <AnimatePresence>
        {isDeleteModalOpen && selectedCategory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm font-sans" role="dialog" aria-label="Delete Confirmation">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[24px] p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
                <div className="p-2.5 bg-rose-100 dark:bg-rose-950 text-rose-600 rounded-xl">
                  <FiAlertTriangle className="w-5 h-5" />
                </div>
                <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                  Delete Category
                </h3>
              </div>

              {/* Business Rule check: totalCourses > 0 */}
              {selectedCategory.totalCourses > 0 ? (
                <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/80 rounded-2xl text-xs space-y-2">
                  <span className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                    <FiAlertTriangle className="w-4 h-4 text-amber-600" /> Cannot Delete Category!
                  </span>
                  <p className="text-amber-800 dark:text-amber-300">
                    This category contains <strong>{selectedCategory.totalCourses} assigned courses</strong> and cannot be deleted. Please reassign or delete the courses before removing this category.
                  </p>
                </div>
              ) : (
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Are you sure you want to delete category <strong>"{selectedCategory.name}"</strong>? This action cannot be undone.
                </p>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="text-xs rounded-xl"
                >
                  Cancel
                </Button>

                {selectedCategory.totalCourses === 0 && (
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={handleConfirmDelete}
                    className="text-xs bg-rose-600 hover:bg-rose-500 text-white rounded-xl"
                  >
                    Confirm Delete
                  </Button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================================================== */}
      {/* 4. FULL IMAGE LIGHTBOX MODAL */}
      {/* ======================================================== */}
      <AnimatePresence>
        {lightboxImage && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md font-sans"
            onClick={() => setLightboxImage(null)}
            role="dialog"
            aria-label="Full Image View"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-4xl w-full max-h-[90vh] bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col space-y-3"
            >
              <div className="flex items-center justify-between text-white border-b border-slate-800 pb-3 px-1">
                <div className="flex items-center gap-2">
                  <FiImage className="w-4 h-4 text-rose-500" />
                  <h3 className="text-sm font-bold text-slate-100 truncate max-w-md">{lightboxImage.title}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={lightboxImage.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    title="Open in new tab"
                  >
                    <FiExternalLink className="w-4 h-4" />
                  </a>
                  <button
                    onClick={() => setLightboxImage(null)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    <FiX className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="relative flex items-center justify-center overflow-auto max-h-[72vh] rounded-2xl bg-black/60 p-2 border border-slate-800">
                <img
                  src={lightboxImage.url}
                  alt={lightboxImage.title}
                  className="max-w-full max-h-[68vh] object-contain rounded-xl shadow-2xl"
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 pt-1 font-medium">
                <span>Showing 100% full uncropped image.</span>
                <Button size="sm" variant="outline" onClick={() => setLightboxImage(null)} className="text-xs py-1 px-3 rounded-lg">
                  Close Preview
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
