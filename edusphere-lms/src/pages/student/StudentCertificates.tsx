import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

import { CertificatesHeader } from '../../components/certificates/CertificatesHeader';
import { CertificatesStatsCards } from '../../components/certificates/CertificatesStatsCards';
import { CertificatesFilterBar, type CertificateFilterState } from '../../components/certificates/CertificatesFilterBar';
import { CertificateCard } from '../../components/certificates/CertificateCard';
import { CertificateDetailsModal } from '../../components/certificates/CertificateDetailsModal';
import { CertificatePreviewDocument } from '../../components/certificates/CertificatePreviewDocument';
import { EmptyState } from '../../components/ui/EmptyState';
import { SkeletonLoader } from '../../components/loaders/Loaders';

import { progressService } from '../../services/progressService';
import type { StudentCertificateDetail } from '../../types';

export const StudentCertificates: React.FC = () => {
  const navigate = useNavigate();

  // Core Datasets State from real backend with instant cache initialization
  const cachedCerts = progressService.getCachedStudentCertificates();
  const [certificates, setCertificates] = useState<StudentCertificateDetail[]>(cachedCerts || []);
  const [isLoading, setIsLoading] = useState(!cachedCerts);

  const fetchCertificates = async (forceRefresh = false) => {
    try {
      if (!certificates.length) {
        setIsLoading(true);
      }
      const res = await progressService.getAllStudentCertificates(forceRefresh);
      if (res.success && Array.isArray(res.data)) {
        setCertificates(res.data);
      }
    } catch {
      // Keep existing cached data — do not wipe on network error
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchCertificates();
  }, []);

  // Active Certificate Details & Printable Preview Modal Controls
  const [selectedCertificateForDetails, setSelectedCertificateForDetails] = useState<StudentCertificateDetail | null>(null);
  const [selectedCertificateForPreview, setSelectedCertificateForPreview] = useState<StudentCertificateDetail | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  // Filters State
  const [filters, setFilters] = useState<CertificateFilterState>({
    searchQuery: '',
    category: 'all',
    status: 'all',
    sortBy: 'newest',
  });

  // Unique Categories List
  const categoriesList = useMemo(() => {
    const set = new Set<string>();
    certificates.forEach((c) => set.add(c.courseCategory));
    return Array.from(set);
  }, [certificates]);

  // Statistics Metrics
  const totalCount = certificates.length;
  const earnedCount = useMemo(() => certificates.filter((c) => c.status === 'earned').length, [certificates]);
  const pendingCount = useMemo(() => certificates.filter((c) => c.status === 'pending' || c.status === 'locked').length, [certificates]);
  const totalLearningHours = useMemo(() => certificates.reduce((acc, curr) => acc + curr.learningHours, 0), [certificates]);

  // Filter & Sort Logic
  const filteredCertificates = useMemo(() => {
    return certificates
      .filter((cert) => {
        // 1. Search Query
        if (filters.searchQuery.trim() !== '') {
          const q = filters.searchQuery.toLowerCase();
          const matchesTitle = cert.courseTitle.toLowerCase().includes(q);
          const matchesCode = cert.certificateCode.toLowerCase().includes(q);
          const matchesInstructor = cert.instructorName.toLowerCase().includes(q);
          if (!matchesTitle && !matchesCode && !matchesInstructor) return false;
        }

        // 2. Category Filter
        if (filters.category !== 'all' && cert.courseCategory !== filters.category) return false;

        // 3. Status Filter
        if (filters.status !== 'all' && cert.status !== filters.status) return false;

        return true;
      })
      .sort((a, b) => {
        if (filters.sortBy === 'alphabetical') {
          return a.courseTitle.localeCompare(b.courseTitle);
        }
        if (filters.sortBy === 'oldest') {
          return a.id.localeCompare(b.id);
        }
        return b.id.localeCompare(a.id);
      });
  }, [certificates, filters]);

  // Reset Filters
  const handleResetFilters = () => {
    setFilters({
      searchQuery: '',
      category: 'all',
      status: 'all',
      sortBy: 'newest',
    });
  };

  // Refresh Real Certificates
  const handleRefresh = async () => {
    await fetchCertificates();
  };

  // Handlers for Modals
  const handleOpenDetails = (cert: StudentCertificateDetail) => {
    setSelectedCertificateForDetails(cert);
    setIsDetailsModalOpen(true);
  };

  const handleOpenPreview = (cert: StudentCertificateDetail) => {
    setSelectedCertificateForPreview(cert);
    setIsPreviewModalOpen(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-8 pb-12"
    >
      {/* Header */}
      <CertificatesHeader
        totalCount={totalCount}
        earnedCount={earnedCount}
        pendingCount={pendingCount}
        onRefresh={handleRefresh}
        isLoading={isLoading}
      />

      {/* Skeleton Loading State */}
      {isLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <SkeletonLoader key={i} className="h-28 rounded-2xl" />
            ))}
          </div>
          <SkeletonLoader className="h-20 w-full rounded-2xl" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <SkeletonLoader key={i} className="h-64 rounded-2xl" />
            ))}
          </div>
        </div>
      ) : certificates.length === 0 ? (
        /* Empty State View */
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-slate-900 rounded-3xl p-8 sm:p-12 border border-slate-200 dark:border-slate-800 text-center shadow-md space-y-6"
        >
          <EmptyState
            type="courses"
            title="You haven't earned any certificates yet."
            description="Complete all certificate requirements to unlock your certificate."
            actionLabel="Continue Learning"
            onAction={() => navigate('/student/courses')}
          />
        </motion.div>
      ) : (
        /* Populated Certificates View */
        <div className="space-y-8">
          {/* Statistics & Achievements Cards */}
          <CertificatesStatsCards
            totalCount={totalCount}
            earnedCount={earnedCount}
            pendingCount={pendingCount}
            totalLearningHours={totalLearningHours}
            activeStatusFilter={filters.status}
            onSelectStatusFilter={(st) => setFilters({ ...filters, status: st })}
          />

          {/* Filter Bar */}
          <CertificatesFilterBar
            filters={filters}
            onFilterChange={setFilters}
            onResetFilters={handleResetFilters}
            categories={categoriesList}
            totalFilteredCount={filteredCertificates.length}
          />

          {/* Certificate Cards Grid */}
          {filteredCertificates.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200 dark:border-slate-800 text-center space-y-4">
              <EmptyState
                type="courses"
                title="No certificate credentials match your search criteria"
                description="Try resetting search keywords or expanding status filters."
                actionLabel="Reset Search Filters"
                onAction={handleResetFilters}
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCertificates.map((cert) => (
                <motion.div key={cert.id} layout>
                  <CertificateCard
                    certificate={cert}
                    onOpenPreview={handleOpenPreview}
                    onOpenDetails={handleOpenDetails}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Certificate Details Modal */}
      <CertificateDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        certificate={selectedCertificateForDetails}
        onOpenPreview={handleOpenPreview}
      />

      {/* Printable Certificate Document Preview Modal */}
      <CertificatePreviewDocument
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        certificate={selectedCertificateForPreview}
      />
    </motion.div>
  );
};
