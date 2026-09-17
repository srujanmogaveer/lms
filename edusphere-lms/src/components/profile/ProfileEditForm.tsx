import React, { useState, useEffect } from 'react';
import {
  FiUser,
  FiMail,
  FiPhone,
  FiCalendar,
  FiGlobe,
  FiMapPin,
  FiUploadCloud,
  FiTrash2,
  FiCheck,
  FiRotateCcw,
} from 'react-icons/fi';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Avatar, isPlaceholderAvatar } from '../common/Avatar';
import type { FullStudentProfile } from '../../types';

import { uploadAvatar } from '../../services/storageService';

interface ProfileEditFormProps {
  profile: FullStudentProfile;
  onSaveProfile: (updated: FullStudentProfile) => Promise<void> | void;
}

export const ProfileEditForm: React.FC<ProfileEditFormProps> = ({
  profile,
  onSaveProfile,
}) => {
  const [formData, setFormData] = useState<FullStudentProfile>(profile);
  const [avatarPreview, setAvatarPreview] = useState<string>(profile.avatarUrl || '');
  const [isSaved, setIsSaved] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setFormData(profile);
    setAvatarPreview(profile.avatarUrl || '');
  }, [profile]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && profile.id) {
      const file = e.target.files[0];
      try {
        setIsUploading(true);
        const publicUrl = await uploadAvatar(profile.id, file);
        setAvatarPreview(publicUrl);
        const updated = { ...formData, avatarUrl: publicUrl };
        setFormData(updated);
        onSaveProfile(updated);
      } catch (err) {
        console.error('Failed to upload student avatar:', err);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleRemovePhoto = () => {
    setAvatarPreview('');
    const updated = { ...formData, avatarUrl: '' };
    setFormData(updated);
    onSaveProfile(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSaveProfile(formData);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2500);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData(profile);
    setAvatarPreview(profile.avatarUrl || '');
  };

  const hasUploadedPhoto = Boolean(avatarPreview && !isPlaceholderAvatar(avatarPreview));

  return (
    <Card className="p-6 space-y-6 border border-slate-200 dark:border-slate-800">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FiUser className="w-5 h-5 text-brand-600" />
            <span>Personal Profile & Avatar</span>
          </h2>
          <p className="text-xs text-slate-500">
            Manage your personal identity, contact details, and bio displayed across EduSphere LMS.
          </p>
        </div>

        {isSaved && (
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 rounded-xl border border-emerald-200 flex items-center gap-1">
            <FiCheck className="w-3.5 h-3.5" /> Saved Successfully
          </span>
        )}
      </div>

      {/* Avatar Upload Section */}
      <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center gap-6">
        <div className="relative">
          <Avatar
            src={avatarPreview}
            name={formData.fullName}
            email={formData.email}
            role="student"
            size="3xl"
            shape="rounded"
            className="border-4 border-white dark:border-slate-900 shadow-md"
          />
        </div>

        <div className="space-y-2 text-center sm:text-left">
          <div className="space-y-0.5">
            <span className="font-bold text-slate-900 dark:text-slate-100 text-sm block">
              Profile Avatar Photo
            </span>
            <span className="text-xs text-slate-500 block">
              PNG, JPG or WEBP under 5MB. Recommended resolution 400x400.
            </span>
          </div>

          <div className="flex items-center justify-center sm:justify-start gap-3 pt-1">
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                disabled={isUploading}
                className="hidden"
              />
              <span className="px-3.5 py-1.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl inline-flex items-center gap-1.5 shadow-sm transition-all">
                <FiUploadCloud className="w-3.5 h-3.5" />
                {isUploading ? 'Uploading...' : 'Upload Photo'}
              </span>
            </label>

            {hasUploadedPhoto && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRemovePhoto}
                className="text-xs flex items-center gap-1 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
              >
                <FiTrash2 className="w-3.5 h-3.5" />
                <span>Remove</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Editable Profile Form Grid */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          {/* Full Name */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <FiUser className="w-3.5 h-3.5 text-slate-400" /> Full Name
            </label>
            <input
              type="text"
              required
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-semibold focus:ring-2 focus:ring-brand-500/50 outline-none"
            />
          </div>

          {/* Email */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <FiMail className="w-3.5 h-3.5 text-slate-400" /> Email Address
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-semibold focus:ring-2 focus:ring-brand-500/50 outline-none"
            />
          </div>

          {/* Phone Number */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <FiPhone className="w-3.5 h-3.5 text-slate-400" /> Phone Number
            </label>
            <input
              type="tel"
              maxLength={10}
              placeholder="9876543210"
              value={formData.phoneNumber || ''}
              onChange={(e) => {
                const numericOnly = e.target.value.replace(/\D/g, '').slice(0, 10);
                setFormData({ ...formData, phoneNumber: numericOnly });
              }}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-mono focus:ring-2 focus:ring-brand-500/50 outline-none"
            />
          </div>

          {/* Date of Birth */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <FiCalendar className="w-3.5 h-3.5 text-slate-400" /> Date of Birth
            </label>
            <input
              type="date"
              max={new Date().toISOString().split('T')[0]}
              value={formData.dateOfBirth}
              onChange={(e) => {
                const selected = e.target.value;
                const today = new Date().toISOString().split('T')[0];
                if (selected && selected > today) {
                  return; // Block future date selection
                }
                setFormData({ ...formData, dateOfBirth: selected });
              }}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-mono focus:ring-2 focus:ring-brand-500/50 outline-none"
            />
          </div>

          {/* Gender */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700 dark:text-slate-300">Gender</label>
            <select
              value={formData.gender}
              onChange={(e) =>
                setFormData({ ...formData, gender: e.target.value as any })
              }
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-semibold focus:ring-2 focus:ring-brand-500/50 outline-none"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
              <option value="prefer_not_to_say">Prefer not to say</option>
            </select>
          </div>

          {/* Country */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <FiGlobe className="w-3.5 h-3.5 text-slate-400" /> Country
            </label>
            <input
              type="text"
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-semibold focus:ring-2 focus:ring-brand-500/50 outline-none"
            />
          </div>

          {/* State */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <FiMapPin className="w-3.5 h-3.5 text-slate-400" /> State / Region
            </label>
            <input
              type="text"
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-semibold focus:ring-2 focus:ring-brand-500/50 outline-none"
            />
          </div>

          {/* City */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700 dark:text-slate-300">City</label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-semibold focus:ring-2 focus:ring-brand-500/50 outline-none"
            />
          </div>
        </div>

        {/* Bio Text Area */}
        <div className="space-y-1 text-xs">
          <label className="font-bold text-slate-700 dark:text-slate-300 block">
            Student Bio & Introduction
          </label>
          <textarea
            rows={4}
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            placeholder="Write a brief background summary about your learning goals and tech stack interests..."
            className="w-full p-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500/50 outline-none leading-relaxed"
          />
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="text-xs flex items-center gap-1.5 text-slate-500"
          >
            <FiRotateCcw className="w-3.5 h-3.5" />
            <span>Reset Fields</span>
          </Button>

          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={isSubmitting || isUploading}
            className="bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-600/20"
          >
            <span>{isSubmitting ? 'Saving Changes...' : 'Save Profile Changes'}</span>
          </Button>
        </div>
      </form>
    </Card>
  );
};
