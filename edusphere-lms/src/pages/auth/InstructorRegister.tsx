import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiUser,
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiArrowLeft,
  FiAlertCircle,
  FiAward,
  FiBriefcase,
  FiGrid,
  FiFolder,
  FiCamera,
  FiTrash2,
  FiUploadCloud,
  FiAlertTriangle,
} from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/authService';
import { categoryService } from '../../services/categoryService';
import { usePlatformSettings } from '../../hooks/usePlatformSettings';

export const InstructorRegister: React.FC = () => {
  const navigate = useNavigate();
  const { registerInstructor } = useAuth();
  const { settings } = usePlatformSettings();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isRegistrationOpen = settings?.enableInstructorRegistration !== false;

  const [categoriesList, setCategoriesList] = useState<string[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  useEffect(() => {
    let mounted = true;
    setIsLoadingCategories(true);
    categoryService
      .getCategories(true)
      .then((res) => {
        if (mounted && res.success && Array.isArray(res.data)) {
          const names = res.data.map((c) => c.name).filter(Boolean);
          setCategoriesList(names);
        }
      })
      .catch((err) => {
        console.error('Failed to load categories:', err);
      })
      .finally(() => {
        if (mounted) {
          setIsLoadingCategories(false);
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    category: '',
    qualification: '',
    experience: '',
    specialization: '',
    password: '',
    confirmPassword: '',
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStatusText, setLoadingStatusText] = useState('Submitting Application...');

  // Password strength logic
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: '', color: '' };
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    if (score <= 1) return { score: 25, label: 'Weak', color: 'bg-rose-500' };
    if (score === 2 || score === 3) return { score: 65, label: 'Medium', color: 'bg-amber-500' };
    return { score: 100, label: 'Strong', color: 'bg-emerald-500' };
  };

  const strength = getPasswordStrength(formData.password);

  const validateField = (name: string, value: any, currentFormData = formData): string => {
    switch (name) {
      case 'fullName':
        if (!value || !value.trim()) return 'Full Name is required.';
        if (value.trim().length < 2) return 'Full Name must be at least 2 characters long.';
        return '';
      case 'email':
        if (!value || !value.trim()) return 'Email address is required.';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
          return 'Please enter a valid email address (e.g. name@gmail.com).';
        }
        return '';
      case 'phone':
        if (!value || !value.trim()) return 'Mobile number is required.';
        if (value.trim().length !== 10) {
          return 'Mobile number must be exactly 10 digits.';
        }
        return '';
      case 'category':
        if (!value || !value.trim()) return 'Please select your teaching category.';
        return '';
      case 'specialization':
        if (!value || !value.trim()) return 'Specialization / Domain is required.';
        return '';
      case 'experience':
        if (!value || !value.trim()) return 'Experience is required.';
        return '';
      case 'qualification':
        if (!value || !value.trim()) return 'Highest qualification is required.';
        return '';
      case 'password':
        if (!value) return 'Password is required.';
        if (value.length < 8) return 'Password must be at least 8 characters long.';
        return '';
      case 'confirmPassword':
        if (!value) return 'Please confirm your password.';
        if (value !== currentFormData.password) return 'Passwords do not match.';
        return '';
      default:
        return '';
    }
  };

  const validateAll = (): Record<string, string> => {
    const errors: Record<string, string> = {};
    const fieldsToValidate = [
      'fullName',
      'email',
      'phone',
      'category',
      'specialization',
      'experience',
      'qualification',
      'password',
      'confirmPassword',
    ];

    fieldsToValidate.forEach((field) => {
      const err = validateField(field, (formData as any)[field], formData);
      if (err) {
        errors[field] = err;
      }
    });

    return errors;
  };

  const handleInputChange = (field: string, value: any) => {
    const processedValue = field === 'email' && typeof value === 'string' ? value.toLowerCase() : value;
    const updatedForm = { ...formData, [field]: processedValue };
    setFormData(updatedForm);

    // If already touched or has error, validate on the fly
    if (touched[field] || fieldErrors[field]) {
      const err = validateField(field, processedValue, updatedForm);
      setFieldErrors((prev) => ({ ...prev, [field]: err }));
    }

    // If password changed, re-validate confirmPassword if touched
    if (field === 'password' && touched.confirmPassword) {
      const confirmErr = validateField('confirmPassword', formData.confirmPassword, updatedForm);
      setFieldErrors((prev) => ({ ...prev, confirmPassword: confirmErr }));
    }
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const err = validateField(field, (formData as any)[field], formData);
    setFieldErrors((prev) => ({ ...prev, [field]: err }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate image format
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setAvatarError('Please select a valid image file (JPG, PNG, or WEBP).');
      return;
    }

    // Validate size (max 5 MB)
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError('Profile picture must be under 5 MB in size.');
      return;
    }

    setAvatarError(null);
    setAvatarFile(file);
    const objectUrl = URL.createObjectURL(file);
    setAvatarPreview(objectUrl);
  };

  const handleRemoveAvatar = (e: React.MouseEvent) => {
    e.stopPropagation();
    setAvatarFile(null);
    setAvatarError(null);
    if (avatarPreview) {
      URL.revokeObjectURL(avatarPreview);
    }
    setAvatarPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isRegistrationOpen) {
      setError('Instructor registration applications are currently closed by platform administrators.');
      return;
    }

    // Mark all fields as touched
    setTouched({
      fullName: true,
      email: true,
      phone: true,
      category: true,
      specialization: true,
      experience: true,
      qualification: true,
      password: true,
      confirmPassword: true,
    });

    const validationErrors = validateAll();
    setFieldErrors(validationErrors);

    const errorKeys = Object.keys(validationErrors);
    if (errorKeys.length > 0) {
      setError('Please fill in all required fields marked with * correctly.');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      let uploadedAvatarUrl: string | undefined = undefined;

      // 1. Upload Profile Picture to Supabase Storage if selected
      if (avatarFile) {
        setLoadingStatusText('Uploading Profile Photo...');
        try {
          const uploadRes = await authService.uploadAvatarImage(avatarFile);
          if (uploadRes.success && uploadRes.data?.url) {
            uploadedAvatarUrl = uploadRes.data.url;
          }
        } catch (uploadErr: any) {
          console.warn('Avatar upload warning, falling back to data URL:', uploadErr);
        }

        // Guaranteed fallback to Data URL if upload failed
        if (!uploadedAvatarUrl) {
          try {
            uploadedAvatarUrl = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.readAsDataURL(avatarFile);
            });
          } catch {
            // non-blocking
          }
        }
      }

      // 2. Submit Instructor Application
      setLoadingStatusText('Submitting Application...');
      await registerInstructor({
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        password: formData.password,
        phone: formData.phone.trim(),
        avatarUrl: uploadedAvatarUrl,
        category: formData.category,
        qualification: formData.qualification.trim(),
        experience: formData.experience.trim(),
        specialization: formData.specialization.trim(),
        termsAgreed: true,
      });

      setIsLoading(false);
      navigate('/auth/pending-approval');
    } catch (err: any) {
      setError(err?.message || 'Failed to submit instructor application. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="w-full max-w-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-[24px] p-6 sm:p-8 shadow-2xl space-y-6"
    >
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
          <FiAward className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">Create Instructor Account</h2>
      </div>

      {!isRegistrationOpen && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-start gap-3 text-amber-600 dark:text-amber-400 text-xs">
          <FiAlertTriangle className="w-5 h-5 shrink-0 text-amber-500 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold block">Instructor Registration Currently Closed</span>
            <span className="text-[11px] text-amber-700/80 dark:text-amber-300/80 leading-relaxed block">
              New instructor applications are temporarily paused by platform administrators. Existing instructors can sign in normally.
            </span>
          </div>
        </div>
      )}

      {/* Admin Review Notice */}
      <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60 rounded-xl flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-200">
        <FiAlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <span>Your application will remain pending until administrator review and approval.</span>
        </div>
      </div>

      {/* Error Message Styling */}
      {error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/60 rounded-xl flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300"
          role="alert"
        >
          <FiAlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
          <span className="flex-1 leading-relaxed">{error}</span>
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* Profile Picture Upload Section */}
        <div className="flex flex-col p-3.5 bg-slate-50/70 dark:bg-slate-800/50 border border-dashed border-slate-200 dark:border-slate-700/80 rounded-2xl transition-all">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleAvatarChange}
            accept="image/png,image/jpeg,image/jpg,image/webp"
            className="hidden"
            id="instructor-avatar-upload"
          />

          <div className="flex items-center gap-4 w-full">
            {/* Avatar Circle / Preview */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="relative group cursor-pointer w-16 h-16 rounded-full shrink-0 overflow-hidden bg-indigo-50 dark:bg-slate-700 border-2 border-indigo-200 dark:border-slate-600 shadow-inner flex items-center justify-center transition-all hover:border-indigo-500 hover:shadow-md"
              title="Click to select profile picture"
            >
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Profile Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  <FiCamera className="w-6 h-6" />
                </div>
              )}

              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                <FiCamera className="w-5 h-5" />
              </div>
            </div>

            {/* Avatar Controls & Info */}
            <div className="flex-1 min-w-0 space-y-1 text-left">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Profile Photo
                </span>
                {avatarPreview && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 transition-colors"
                  >
                    <FiTrash2 className="w-3 h-3" /> Remove
                  </button>
                )}
              </div>

              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {avatarFile ? avatarFile.name : 'Upload JPG, PNG, or WEBP (Max 5MB)'}
              </p>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline pt-0.5"
              >
                <FiUploadCloud className="w-3.5 h-3.5" />
                {avatarPreview ? 'Change Photo' : 'Choose Photo'}
              </button>
            </div>
          </div>

          {/* Avatar Error Message */}
          {avatarError && (
            <p className="text-[11px] text-rose-500 dark:text-rose-400 flex items-center gap-1 mt-2 font-medium">
              <FiAlertCircle className="w-3 h-3 shrink-0" />
              {avatarError}
            </p>
          )}
        </div>

        {/* Full Name */}
        <div className="space-y-1.5">
          <label htmlFor="fullName" className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
            Full Name <span className="text-rose-500 font-bold">*</span>
          </label>
          <div className="relative">
            <FiUser className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${fieldErrors.fullName && touched.fullName ? 'text-rose-500' : 'text-slate-400'}`} />
            <input
              id="fullName"
              type="text"
              name="fullName"
              autoComplete="name"
              placeholder="Enter your name"
              value={formData.fullName}
              onChange={(e) => handleInputChange('fullName', e.target.value)}
              onBlur={() => handleBlur('fullName')}
              aria-required="true"
              aria-invalid={Boolean(fieldErrors.fullName && touched.fullName)}
              className={`w-full pl-10 pr-4 py-2.5 text-xs bg-white/70 dark:bg-slate-800/70 border rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none transition-all ${
                fieldErrors.fullName && touched.fullName
                  ? 'border-rose-500 dark:border-rose-500/80 ring-1 ring-rose-500/50 focus:ring-2 focus:ring-rose-500'
                  : 'border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
              }`}
            />
          </div>
          <AnimatePresence>
            {fieldErrors.fullName && touched.fullName && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="text-[11px] text-rose-500 dark:text-rose-400 flex items-center gap-1 font-medium mt-1"
              >
                <FiAlertCircle className="w-3 h-3 shrink-0" />
                {fieldErrors.fullName}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Email Address & Mobile (+91) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Email Address */}
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              Email Address <span className="text-rose-500 font-bold">*</span>
            </label>
            <div className="relative">
              <FiMail className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 transition-colors ${fieldErrors.email && touched.email ? 'text-rose-500' : 'text-slate-400'}`} />
              <input
                id="email"
                type="email"
                name="email"
                autoComplete="email"
                placeholder="example@gmail.com"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                onBlur={() => handleBlur('email')}
                aria-required="true"
                aria-invalid={Boolean(fieldErrors.email && touched.email)}
                className={`w-full pl-9 pr-3 py-2.5 text-xs bg-white/70 dark:bg-slate-800/70 border rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none transition-all ${
                  fieldErrors.email && touched.email
                    ? 'border-rose-500 dark:border-rose-500/80 ring-1 ring-rose-500/50 focus:ring-2 focus:ring-rose-500'
                    : 'border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
                }`}
              />
            </div>
            <AnimatePresence>
              {fieldErrors.email && touched.email && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="text-[11px] text-rose-500 dark:text-rose-400 flex items-center gap-1 font-medium mt-1"
                >
                  <FiAlertCircle className="w-3 h-3 shrink-0" />
                  {fieldErrors.email}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Mobile Number (+91) */}
          <div className="space-y-1.5">
            <label htmlFor="phone" className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              Mobile Number (+91) <span className="text-rose-500 font-bold">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-xs">
                +91
              </span>
              <input
                id="phone"
                type="tel"
                name="phone"
                autoComplete="tel"
                placeholder="e.g. 9876543210"
                maxLength={10}
                value={formData.phone}
                onChange={(e) => {
                  const numericOnly = e.target.value.replace(/\D/g, '').slice(0, 10);
                  handleInputChange('phone', numericOnly);
                }}
                onBlur={() => handleBlur('phone')}
                aria-required="true"
                aria-invalid={Boolean(fieldErrors.phone && touched.phone)}
                className={`w-full pl-11 pr-3 py-2.5 text-xs bg-white/70 dark:bg-slate-800/70 border rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none transition-all ${
                  fieldErrors.phone && touched.phone
                    ? 'border-rose-500 dark:border-rose-500/80 ring-1 ring-rose-500/50 focus:ring-2 focus:ring-rose-500'
                    : 'border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
                }`}
              />
            </div>
            <AnimatePresence>
              {fieldErrors.phone && touched.phone && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="text-[11px] text-rose-500 dark:text-rose-400 flex items-center gap-1 font-medium mt-1"
                >
                  <FiAlertCircle className="w-3 h-3 shrink-0" />
                  {fieldErrors.phone}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Teaching Category & Specialization / Domain */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Category */}
          <div className="space-y-1.5">
            <label htmlFor="category" className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              Teaching Category <span className="text-rose-500 font-bold">*</span>
            </label>
            <div className="relative">
              <FiFolder className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none transition-colors ${fieldErrors.category && touched.category ? 'text-rose-500' : 'text-slate-400'}`} />
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                onBlur={() => handleBlur('category')}
                aria-required="true"
                aria-invalid={Boolean(fieldErrors.category && touched.category)}
                className={`w-full pl-9 pr-7 py-2.5 text-xs bg-white/70 dark:bg-slate-800/70 border rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none transition-all appearance-none cursor-pointer ${
                  fieldErrors.category && touched.category
                    ? 'border-rose-500 dark:border-rose-500/80 ring-1 ring-rose-500/50 focus:ring-2 focus:ring-rose-500'
                    : 'border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
                } ${!formData.category ? 'text-slate-400 dark:text-slate-400' : ''}`}
              >
                <option value="" disabled>
                  {isLoadingCategories
                    ? 'Loading categories...'
                    : categoriesList.length === 0
                    ? 'No categories available'
                    : 'Select teaching category...'}
                </option>
                {categoriesList.map((cat) => (
                  <option key={cat} value={cat} className="text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800">
                    {cat}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[10px]">
                ▼
              </div>
            </div>
            <AnimatePresence>
              {fieldErrors.category && touched.category && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="text-[11px] text-rose-500 dark:text-rose-400 flex items-center gap-1 font-medium mt-1"
                >
                  <FiAlertCircle className="w-3 h-3 shrink-0" />
                  {fieldErrors.category}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Specialization / Domain */}
          <div className="space-y-1.5">
            <label htmlFor="specialization" className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              Specialization / Domain <span className="text-rose-500 font-bold">*</span>
            </label>
            <div className="relative">
              <FiGrid className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 transition-colors ${fieldErrors.specialization && touched.specialization ? 'text-rose-500' : 'text-slate-400'}`} />
              <input
                id="specialization"
                type="text"
                name="specialization"
                autoComplete="off"
                placeholder="e.g. React, Node.js & Next.js"
                value={formData.specialization}
                onChange={(e) => handleInputChange('specialization', e.target.value)}
                onBlur={() => handleBlur('specialization')}
                aria-required="true"
                aria-invalid={Boolean(fieldErrors.specialization && touched.specialization)}
                className={`w-full pl-9 pr-3 py-2.5 text-xs bg-white/70 dark:bg-slate-800/70 border rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none transition-all ${
                  fieldErrors.specialization && touched.specialization
                    ? 'border-rose-500 dark:border-rose-500/80 ring-1 ring-rose-500/50 focus:ring-2 focus:ring-rose-500'
                    : 'border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
                }`}
              />
            </div>
            <AnimatePresence>
              {fieldErrors.specialization && touched.specialization && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="text-[11px] text-rose-500 dark:text-rose-400 flex items-center gap-1 font-medium mt-1"
                >
                  <FiAlertCircle className="w-3 h-3 shrink-0" />
                  {fieldErrors.specialization}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Experience & Qualification */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Experience */}
          <div className="space-y-1.5">
            <label htmlFor="experience" className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              Experience <span className="text-rose-500 font-bold">*</span>
            </label>
            <div className="relative">
              <FiBriefcase className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 transition-colors ${fieldErrors.experience && touched.experience ? 'text-rose-500' : 'text-slate-400'}`} />
              <input
                id="experience"
                type="text"
                name="experience"
                autoComplete="off"
                placeholder="e.g. 5+ years of software development"
                value={formData.experience}
                onChange={(e) => handleInputChange('experience', e.target.value)}
                onBlur={() => handleBlur('experience')}
                aria-required="true"
                aria-invalid={Boolean(fieldErrors.experience && touched.experience)}
                className={`w-full pl-9 pr-3 py-2.5 text-xs bg-white/70 dark:bg-slate-800/70 border rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none transition-all ${
                  fieldErrors.experience && touched.experience
                    ? 'border-rose-500 dark:border-rose-500/80 ring-1 ring-rose-500/50 focus:ring-2 focus:ring-rose-500'
                    : 'border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
                }`}
              />
            </div>
            <AnimatePresence>
              {fieldErrors.experience && touched.experience && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="text-[11px] text-rose-500 dark:text-rose-400 flex items-center gap-1 font-medium mt-1"
                >
                  <FiAlertCircle className="w-3 h-3 shrink-0" />
                  {fieldErrors.experience}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Qualification */}
          <div className="space-y-1.5">
            <label htmlFor="qualification" className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              Highest Qualification <span className="text-rose-500 font-bold">*</span>
            </label>
            <div className="relative">
              <FiAward className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 transition-colors ${fieldErrors.qualification && touched.qualification ? 'text-rose-500' : 'text-slate-400'}`} />
              <input
                id="qualification"
                type="text"
                name="qualification"
                autoComplete="off"
                placeholder="e.g. M.Tech / B.E. in Computer Science"
                value={formData.qualification}
                onChange={(e) => handleInputChange('qualification', e.target.value)}
                onBlur={() => handleBlur('qualification')}
                aria-required="true"
                aria-invalid={Boolean(fieldErrors.qualification && touched.qualification)}
                className={`w-full pl-9 pr-3 py-2.5 text-xs bg-white/70 dark:bg-slate-800/70 border rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none transition-all ${
                  fieldErrors.qualification && touched.qualification
                    ? 'border-rose-500 dark:border-rose-500/80 ring-1 ring-rose-500/50 focus:ring-2 focus:ring-rose-500'
                    : 'border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
                }`}
              />
            </div>
            <AnimatePresence>
              {fieldErrors.qualification && touched.qualification && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="text-[11px] text-rose-500 dark:text-rose-400 flex items-center gap-1 font-medium mt-1"
                >
                  <FiAlertCircle className="w-3 h-3 shrink-0" />
                  {fieldErrors.qualification}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Password & Confirm Password */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Password */}
          <div className="space-y-1.5">
            <label htmlFor="password" className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              Password <span className="text-rose-500 font-bold">*</span>
            </label>
            <div className="relative">
              <FiLock className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 transition-colors ${fieldErrors.password && touched.password ? 'text-rose-500' : 'text-slate-400'}`} />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                autoComplete="new-password"
                placeholder="Min. 8 characters"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                onBlur={() => handleBlur('password')}
                aria-required="true"
                aria-invalid={Boolean(fieldErrors.password && touched.password)}
                className={`w-full pl-9 pr-8 py-2.5 text-xs bg-white/70 dark:bg-slate-800/70 border rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none transition-all ${
                  fieldErrors.password && touched.password
                    ? 'border-rose-500 dark:border-rose-500/80 ring-1 ring-rose-500/50 focus:ring-2 focus:ring-rose-500'
                    : 'border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <FiEyeOff className="w-3.5 h-3.5" /> : <FiEye className="w-3.5 h-3.5" />}
              </button>
            </div>
            <AnimatePresence>
              {fieldErrors.password && touched.password && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="text-[11px] text-rose-500 dark:text-rose-400 flex items-center gap-1 font-medium mt-1"
                >
                  <FiAlertCircle className="w-3 h-3 shrink-0" />
                  {fieldErrors.password}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <label htmlFor="confirmPassword" className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              Confirm Password <span className="text-rose-500 font-bold">*</span>
            </label>
            <div className="relative">
              <FiLock className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 transition-colors ${fieldErrors.confirmPassword && touched.confirmPassword ? 'text-rose-500' : 'text-slate-400'}`} />
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                autoComplete="new-password"
                placeholder="Re-enter password"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                onBlur={() => handleBlur('confirmPassword')}
                aria-required="true"
                aria-invalid={Boolean(fieldErrors.confirmPassword && touched.confirmPassword)}
                className={`w-full pl-9 pr-8 py-2.5 text-xs bg-white/70 dark:bg-slate-800/70 border rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none transition-all ${
                  fieldErrors.confirmPassword && touched.confirmPassword
                    ? 'border-rose-500 dark:border-rose-500/80 ring-1 ring-rose-500/50 focus:ring-2 focus:ring-rose-500'
                    : 'border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <FiEyeOff className="w-3.5 h-3.5" /> : <FiEye className="w-3.5 h-3.5" />}
              </button>
            </div>
            <AnimatePresence>
              {fieldErrors.confirmPassword && touched.confirmPassword && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="text-[11px] text-rose-500 dark:text-rose-400 flex items-center gap-1 font-medium mt-1"
                >
                  <FiAlertCircle className="w-3 h-3 shrink-0" />
                  {fieldErrors.confirmPassword}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Password Strength Indicator */}
        {formData.password && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="space-y-1 pt-0.5"
          >
            <div className="flex justify-between items-center text-[10px] font-semibold text-slate-500 dark:text-slate-400">
              <span>Password Strength:</span>
              <span className={`font-bold ${strength.score >= 100 ? 'text-emerald-500' : strength.score >= 65 ? 'text-amber-500' : 'text-rose-500'}`}>
                {strength.label}
              </span>
            </div>
            <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${strength.color}`}
                style={{ width: `${strength.score}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-400">
              Use at least 8 characters with a mix of uppercase letters, numbers, and symbols.
            </p>
          </motion.div>
        )}

        {/* Register Button */}
        <motion.button
          whileHover={{ scale: isLoading || !isRegistrationOpen ? 1 : 1.01 }}
          whileTap={{ scale: isLoading || !isRegistrationOpen ? 1 : 0.98 }}
          type="submit"
          disabled={isLoading || !isRegistrationOpen}
          className="w-full py-3 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 disabled:opacity-60 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>{loadingStatusText}</span>
            </>
          ) : (
            <span>{isRegistrationOpen ? 'Submit Instructor Application' : 'Registration Closed'}</span>
          )}
        </motion.button>
      </form>

      {/* Buttons / Navigation Links */}
      <div className="pt-4 border-t border-slate-200/60 dark:border-slate-800 text-center space-y-2 text-xs">
        <p className="text-slate-600 dark:text-slate-400">
          Already have an account?{' '}
          <Link to="/auth/instructor-login" className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline">
            Back to Login
          </Link>
        </p>
        <Link
          to="/auth/role-selection"
          className="inline-flex items-center gap-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium transition-colors pt-1"
        >
          <FiArrowLeft className="w-3.5 h-3.5" /> Back to Role Selection
        </Link>
      </div>
    </motion.div>
  );
};
