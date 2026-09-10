import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
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
  FiCamera,
  FiTrash2,
  FiUploadCloud,
  FiAlertTriangle,
} from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/authService';
import { usePlatformSettings } from '../../hooks/usePlatformSettings';

export const InstructorRegister: React.FC = () => {
  const navigate = useNavigate();
  const { registerInstructor } = useAuth();
  const { settings } = usePlatformSettings();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isRegistrationOpen = settings?.enableInstructorRegistration !== false;

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    qualification: '',
    experience: '',
    specialization: '',
    password: '',
    confirmPassword: '',
    termsAgreed: false,
  });

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStatusText, setLoadingStatusText] = useState('Submitting Application...');

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate image format
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Please select a valid image file (JPG, PNG, or WEBP).');
      return;
    }

    // Validate size (max 5 MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Profile picture must be under 5 MB in size.');
      return;
    }

    setError('');
    setAvatarFile(file);
    const objectUrl = URL.createObjectURL(file);
    setAvatarPreview(objectUrl);
  };

  const handleRemoveAvatar = (e: React.MouseEvent) => {
    e.stopPropagation();
    setAvatarFile(null);
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
    if (!formData.fullName || !formData.email || !formData.password) {
      setError('Please fill in all required fields.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (formData.phone && formData.phone.trim().length > 0 && formData.phone.trim().length !== 10) {
      setError('Mobile number must be exactly 10 digits.');
      return;
    }
    if (!formData.termsAgreed) {
      setError('You must agree to the Terms & Guidelines.');
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
          console.warn('Avatar upload warning:', uploadErr);
          // Non-blocking: continue with registration even if avatar fails
        }
      }

      // 2. Submit Instructor Application
      setLoadingStatusText('Submitting Application...');
      await registerInstructor({
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        avatarUrl: uploadedAvatarUrl,
        qualification: formData.qualification,
        experience: formData.experience,
        specialization: formData.specialization,
        termsAgreed: formData.termsAgreed,
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
      className="w-full max-w-md bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-[20px] p-8 shadow-2xl space-y-6"
    >
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
          <FiAward className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">Create Account</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">Apply to become an Instructor on EduSphere LMS</p>
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
        <span>Your application will remain pending until administrator review and approval.</span>
      </div>

      {/* Error Message Styling */}
      {error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/60 rounded-xl flex items-center gap-2 text-xs text-rose-700 dark:text-rose-300"
          role="alert"
        >
          <FiAlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Profile Picture Upload Section */}
        <div className="flex flex-col items-center justify-center p-3.5 bg-slate-50/70 dark:bg-slate-800/50 border border-dashed border-slate-200 dark:border-slate-700/80 rounded-2xl transition-all">
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
                  Profile Photo <span className="text-[10px] font-normal text-slate-400">(Optional)</span>
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
                {avatarFile ? avatarFile.name : 'JPG, PNG, or WEBP (Max 5MB)'}
              </p>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline pt-0.5"
              >
                <FiUploadCloud className="w-3.5 h-3.5" />
                {avatarPreview ? 'Change Photo' : 'Choose File'}
              </button>
            </div>
          </div>
        </div>

        {/* Full Name */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
            Full Name *
          </label>
          <div className="relative">
            <FiUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              name="fullName"
              autoComplete="name"
              placeholder="e.g. Dr. Marcus Vance"
              required
              aria-label="Full Name"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-white/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Email Address & Mobile (+91) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              Email Address *
            </label>
            <div className="relative">
              <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
              <input
                type="email"
                name="email"
                autoComplete="email"
                placeholder="name@example.com"
                required
                aria-label="Email Address"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full pl-9 pr-3 py-2.5 text-xs bg-white/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              Mobile Number (+91)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-xs">
                +91
              </span>
              <input
                type="tel"
                name="phone"
                autoComplete="tel"
                placeholder="9876543210"
                aria-label="Mobile Number"
                maxLength={10}
                value={formData.phone}
                onChange={(e) => {
                  const numericOnly = e.target.value.replace(/\D/g, '').slice(0, 10);
                  setFormData({ ...formData, phone: numericOnly });
                }}
                className="w-full pl-11 pr-3 py-2.5 text-xs bg-white/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Specialization / Domain */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
            Specialization / Domain
          </label>
          <div className="relative">
            <FiGrid className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              name="specialization"
              autoComplete="off"
              placeholder="e.g. Web Architecture & AI Engineering"
              aria-label="Specialization"
              value={formData.specialization}
              onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-white/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Experience & Qualification */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              Experience
            </label>
            <div className="relative">
              <FiBriefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
              <input
                type="text"
                name="experience"
                autoComplete="off"
                placeholder="e.g. 10+ years"
                aria-label="Years of Experience"
                value={formData.experience}
                onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                className="w-full pl-9 pr-3 py-2.5 text-xs bg-white/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              Highest Qualification
            </label>
            <div className="relative">
              <FiAward className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
              <input
                type="text"
                name="qualification"
                autoComplete="off"
                placeholder="e.g. Ph.D. / M.Tech"
                aria-label="Highest Qualification"
                value={formData.qualification}
                onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                className="w-full pl-9 pr-3 py-2.5 text-xs bg-white/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Password & Confirm Password */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              Password *
            </label>
            <div className="relative">
              <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                autoComplete="new-password"
                placeholder="••••••••"
                required
                aria-label="Password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full pl-9 pr-8 py-2.5 text-xs bg-white/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <FiEyeOff className="w-3.5 h-3.5" /> : <FiEye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              Confirm Password *
            </label>
            <div className="relative">
              <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                autoComplete="new-password"
                placeholder="••••••••"
                required
                aria-label="Confirm Password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="w-full pl-9 pr-8 py-2.5 text-xs bg-white/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showConfirmPassword ? <FiEyeOff className="w-3.5 h-3.5" /> : <FiEye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Terms Agreement */}
        <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 dark:text-slate-400 select-none">
          <input
            type="checkbox"
            checked={formData.termsAgreed}
            onChange={(e) => setFormData({ ...formData, termsAgreed: e.target.checked })}
            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />
          <span>I agree to the Instructor Terms & Guidelines</span>
        </label>

        {/* Register Button */}
        <motion.button
          whileHover={{ scale: isLoading || !isRegistrationOpen ? 1 : 1.01 }}
          whileTap={{ scale: isLoading || !isRegistrationOpen ? 1 : 0.98 }}
          type="submit"
          disabled={isLoading || !isRegistrationOpen}
          className="w-full py-2.5 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 disabled:opacity-60 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>{loadingStatusText}</span>
            </>
          ) : (
            <span>{isRegistrationOpen ? 'Register Account' : 'Registration Closed'}</span>
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
