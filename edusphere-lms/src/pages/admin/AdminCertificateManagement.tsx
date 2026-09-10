import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiAward,
  FiCheckCircle,
  FiUsers,
  FiSearch,
  FiFilter,
  FiEye,
  FiShield,
  FiX,
  FiUser,
  FiBookOpen,
  FiCalendar,
  FiRotateCcw,
  FiHash,
  FiDownload,
  FiAlertTriangle,
  FiRefreshCw
} from 'react-icons/fi';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { SkeletonLoader } from '../../components/loaders/Loaders';
import { adminService } from '../../services/adminService';
import { downloadCertificatePdf } from '../../utils/certificatePdfGenerator';
import type {
  CertificateRecord,
  CertificateDashboardMetrics
} from '../../data/certificateData';

export const AdminCertificateManagement: React.FC = () => {
  const [certificates, setCertificates] = useState<CertificateRecord[]>([]);
  const [metrics, setMetrics] = useState<CertificateDashboardMetrics>({
    totalCertificates: 0,
    certificatesIssued: 0,
    eligibleStudentsCount: 0,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingCertId, setDownloadingCertId] = useState<string | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [courseFilter, setCourseFilter] = useState<string>('All');
  const [instructorFilter, setInstructorFilter] = useState<string>('All');

  // Modal States
  const [selectedCertForDetails, setSelectedCertForDetails] = useState<CertificateRecord | null>(null);
  const [verifyModalOpen, setVerifyModalOpen] = useState<boolean>(false);
  const [verifyInputNumber, setVerifyInputNumber] = useState<string>('');
  const [verificationResult, setVerificationResult] = useState<{
    searched: boolean;
    valid: boolean;
    record?: CertificateRecord;
  } | null>(null);

  // Toast Notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchCertificatesData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await adminService.getCertificates();
      if (res.success && res.data) {
        setCertificates(res.data.certificates || []);
        if (res.data.metrics) {
          setMetrics(res.data.metrics);
        } else {
          const list = res.data.certificates || [];
          setMetrics({
            totalCertificates: list.length,
            certificatesIssued: list.filter((c) => c.status === 'Issued').length,
            eligibleStudentsCount: new Set(list.map((c) => c.studentId)).size,
          });
        }
      } else {
        setError('Failed to load certificates.');
        setCertificates([]);
      }
    } catch {
      setError('Failed to load certificates.');
      setCertificates([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCertificatesData();
  }, [fetchCertificatesData]);

  // Metrics Computation from real data
  const totalCerts = metrics.totalCertificates;
  const issuedCerts = metrics.certificatesIssued;
  const eligibleStudents = metrics.eligibleStudentsCount;

  // Dropdown Lists
  const uniqueCourses = useMemo(
    () => Array.from(new Set(certificates.map((c) => c.courseName).filter(Boolean))),
    [certificates]
  );

  const uniqueInstructors = useMemo(
    () => Array.from(new Set(certificates.map((c) => c.instructorName).filter(Boolean))),
    [certificates]
  );

  // Filtered Certificates
  const filteredCertificates = useMemo(() => {
    return certificates.filter((c) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        q === '' ||
        (c.certificateNumber && c.certificateNumber.toLowerCase().includes(q)) ||
        (c.studentName && c.studentName.toLowerCase().includes(q)) ||
        (c.studentId && c.studentId.toLowerCase().includes(q)) ||
        (c.courseName && c.courseName.toLowerCase().includes(q));

      const matchesCourse = courseFilter === 'All' || c.courseName === courseFilter;
      const matchesInstructor = instructorFilter === 'All' || c.instructorName === instructorFilter;

      return matchesSearch && matchesCourse && matchesInstructor;
    });
  }, [certificates, searchQuery, courseFilter, instructorFilter]);

  const handleRunVerification = (certNumToTest?: string) => {
    const numToSearch = (certNumToTest || verifyInputNumber).trim();
    if (!numToSearch) {
      alert('Please enter a valid Certificate Number (e.g., EDU-2026-BD1F-0A8F2F8A).');
      return;
    }

    const match = certificates.find(
      (c) =>
        (c.certificateNumber && c.certificateNumber.toLowerCase() === numToSearch.toLowerCase()) ||
        (c.certificateCode && c.certificateCode.toLowerCase() === numToSearch.toLowerCase()) ||
        (c.serialCode && c.serialCode.toLowerCase() === numToSearch.toLowerCase())
    );

    if (match && match.status === 'Issued') {
      setVerificationResult({ searched: true, valid: true, record: match });
    } else {
      setVerificationResult({ searched: true, valid: false });
    }
  };

  const handleDownloadCertificate = async (cert: CertificateRecord) => {
    try {
      setDownloadingCertId(cert.id);
      await downloadCertificatePdf({
        studentName: cert.studentName,
        courseTitle: cert.courseName,
        instructorName: cert.instructorName,
        instructorTitle: cert.instructorTitle || 'Lead Instructor & Mentor',
        certificateCode: cert.certificateNumber || cert.certificateCode || cert.serialCode,
        issueDate: cert.issueDate,
        completionDate: cert.completionDate,
        durationHours: cert.learningHours || 4,
      });
      showToast(`Certificate PDF for ${cert.studentName} downloaded successfully!`);
    } catch {
      showToast('Failed to generate certificate PDF.');
    } finally {
      setDownloadingCertId(null);
    }
  };

  const resetFilters = () => {
    setSearchQuery('');
    setCourseFilter('All');
    setInstructorFilter('All');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-8 pb-16 font-sans"
    >
      {/* Toast Banner */}
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
            <FiAward className="w-7 h-7 text-amber-500" /> Certificate Master Registry & Verification Studio
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Monitor all automatically generated course completion certificates, verify authenticity hashes, and audit student eligibility criteria.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={fetchCertificatesData}
            disabled={isLoading}
            className="text-xs font-bold rounded-xl flex items-center gap-1.5"
          >
            <FiRefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
          </Button>

          <Button
            size="sm"
            variant="primary"
            onClick={() => {
              setVerifyInputNumber('');
              setVerificationResult(null);
              setVerifyModalOpen(true);
            }}
            className="self-start sm:self-auto text-xs font-bold rounded-xl flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm"
          >
            <FiShield className="w-4 h-4" /> Verify Certificate
          </Button>
        </div>
      </div>

      {/* Automatic Certificate Generation Business Rule Banner */}
      <div className="p-4 bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-2xl flex items-center gap-3 text-xs text-amber-900 dark:text-amber-300">
        <FiShield className="w-5 h-5 text-amber-600 shrink-0" />
        <div>
          <span className="font-extrabold block">Automatic LMS Certificate System Active</span>
          <span className="text-[11px] text-amber-800 dark:text-amber-300">
            Certificates cannot be created manually by Admin or Instructors. They are generated automatically by EduSphere LMS only when a student satisfies 100% video lesson completion, passes all mandatory instructor-graded assignments, and passes all mandatory quizzes.
          </span>
        </div>
      </div>

      {/* 1. Dashboard Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 rounded-[20px] bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 flex items-center gap-3">
          <div className="p-3 bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 rounded-xl">
            <FiAward className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Total Certificates</p>
            <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">
              {isLoading ? <SkeletonLoader className="h-6 w-12 mt-1" /> : totalCerts}
            </h3>
          </div>
        </Card>

        <Card className="p-4 rounded-[20px] bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-3">
          <div className="p-3 bg-emerald-600 text-white rounded-xl shadow-sm">
            <FiCheckCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Certificates Issued</p>
            <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">
              {isLoading ? <SkeletonLoader className="h-6 w-12 mt-1" /> : issuedCerts}
            </h3>
          </div>
        </Card>

        <Card className="p-4 rounded-[20px] bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 flex items-center gap-3">
          <div className="p-3 bg-indigo-600 text-white rounded-xl shadow-sm">
            <FiUsers className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Eligible Students</p>
            <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">
              {isLoading ? <SkeletonLoader className="h-6 w-12 mt-1" /> : eligibleStudents}
            </h3>
          </div>
        </Card>
      </div>

      {/* 2. Search & Multi-Filters Toolbar */}
      <Card className="p-4 sm:p-5 rounded-[20px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-96">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search Cert Number, Student Name, ID, Course..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={resetFilters}
              className="text-xs rounded-xl flex items-center gap-1.5"
            >
              <FiRotateCcw className="w-3.5 h-3.5" /> Reset Filters
            </Button>
          </div>
        </div>

        {/* Dropdown Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="space-y-1">
            <label className="font-semibold text-slate-500 dark:text-slate-400 text-[11px] flex items-center gap-1">
              <FiFilter className="w-3 h-3" /> Filter Course:
            </label>
            <select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="All">All Courses</option>
              {uniqueCourses.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-500 dark:text-slate-400 text-[11px] flex items-center gap-1">
              <FiUser className="w-3 h-3" /> Filter Instructor:
            </label>
            <select
              value={instructorFilter}
              onChange={(e) => setInstructorFilter(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="All">All Instructors</option>
              {uniqueInstructors.map((ins) => (
                <option key={ins} value={ins}>{ins}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* 3. Certificate List Table / Loading / Error / Empty State */}
      {isLoading ? (
        <Card className="p-8 rounded-[24px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
          <div className="space-y-3">
            <SkeletonLoader className="h-8 w-full rounded-xl" />
            <SkeletonLoader className="h-12 w-full rounded-xl" />
            <SkeletonLoader className="h-12 w-full rounded-xl" />
            <SkeletonLoader className="h-12 w-full rounded-xl" />
          </div>
        </Card>
      ) : error ? (
        <Card className="p-12 text-center rounded-[24px] border border-rose-200 dark:border-rose-900/60 bg-white dark:bg-slate-900 space-y-4">
          <div className="w-16 h-16 bg-rose-50 dark:bg-rose-950/50 rounded-full flex items-center justify-center mx-auto text-rose-500">
            <FiAlertTriangle className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Failed to load certificates.</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              There was an error connecting to the EduSphere certificate database. Please try again.
            </p>
          </div>
          <Button
            size="sm"
            variant="primary"
            onClick={fetchCertificatesData}
            className="text-xs rounded-xl py-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
          >
            Retry
          </Button>
        </Card>
      ) : filteredCertificates.length === 0 ? (
        <Card className="p-12 text-center rounded-[24px] border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 space-y-4">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-400">
            <FiAward className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">No certificates have been issued yet.</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {certificates.length === 0
                ? 'Certificates will automatically appear here as students complete 100% of course lessons, pass assignments, and pass mandatory quizzes.'
                : 'No certificate records matched your search query or filter selections.'}
            </p>
          </div>
          {(searchQuery || courseFilter !== 'All' || instructorFilter !== 'All') && (
            <Button
              size="sm"
              variant="outline"
              onClick={resetFilters}
              className="text-xs rounded-xl py-2 px-4"
            >
              Reset Filters
            </Button>
          )}
        </Card>
      ) : (
        <Card className="rounded-[24px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                <tr>
                  <th className="py-3.5 px-4">Certificate Number</th>
                  <th className="py-3.5 px-4">Student</th>
                  <th className="py-3.5 px-4">Course Name</th>
                  <th className="py-3.5 px-4">Instructor</th>
                  <th className="py-3.5 px-4">Issue Date</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredCertificates.map((cert) => (
                  <tr key={cert.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-amber-600 dark:text-amber-400">
                      {cert.certificateNumber}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={cert.studentAvatar}
                          alt={cert.studentName}
                          className="w-8 h-8 rounded-full object-cover border shrink-0"
                        />
                        <div>
                          <span className="font-bold text-slate-900 dark:text-slate-100 block">
                            {cert.studentName}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {cert.studentId}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 max-w-xs">
                      <span className="font-bold text-slate-900 dark:text-slate-100 line-clamp-1">
                        {cert.courseName}
                      </span>
                      <span className="text-[10px] text-indigo-500 font-semibold">
                        {cert.category}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-medium text-slate-700 dark:text-slate-300">
                      {cert.instructorName}
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 font-medium whitespace-nowrap">
                      {cert.issueDate}
                    </td>

                    <td className="py-3.5 px-4">
                      <Badge variant={cert.status === 'Issued' ? 'success' : 'danger'}>
                        {cert.status}
                      </Badge>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedCertForDetails(cert)}
                          className="text-xs py-1 px-2.5 rounded-xl flex items-center gap-1"
                        >
                          <FiEye className="w-3.5 h-3.5" /> View
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownloadCertificate(cert)}
                          disabled={downloadingCertId === cert.id}
                          className="text-xs py-1 px-2.5 rounded-xl flex items-center gap-1 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                        >
                          <FiDownload className="w-3.5 h-3.5" /> {downloadingCertId === cert.id ? '...' : 'PDF'}
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setVerifyInputNumber(cert.certificateNumber);
                            handleRunVerification(cert.certificateNumber);
                            setVerifyModalOpen(true);
                          }}
                          className="text-xs py-1 px-2.5 rounded-xl flex items-center gap-1 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800"
                        >
                          <FiShield className="w-3.5 h-3.5" /> Verify
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ======================================================== */}
      {/* CERTIFICATE DETAILS MODAL */}
      {/* ======================================================== */}
      <AnimatePresence>
        {selectedCertForDetails && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto font-sans" role="dialog" aria-label="Certificate Details">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[28px] p-6 sm:p-8 shadow-2xl space-y-6"
            >
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-bold px-3 py-1 bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 rounded-lg">
                    {selectedCertForDetails.certificateNumber}
                  </span>
                  <Badge variant={selectedCertForDetails.status === 'Issued' ? 'success' : 'danger'}>
                    {selectedCertForDetails.status}
                  </Badge>
                </div>

                <button
                  onClick={() => setSelectedCertForDetails(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              {/* Student Information */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 space-y-2 text-xs">
                <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                  <FiUser className="w-4 h-4 text-indigo-500" /> Student Profile Details
                </h3>
                <div className="flex items-center gap-3">
                  <img
                    src={selectedCertForDetails.studentAvatar}
                    alt={selectedCertForDetails.studentName}
                    className="w-10 h-10 rounded-full object-cover border"
                  />
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                      {selectedCertForDetails.studentName}
                    </h4>
                    <span className="text-slate-400 font-mono">
                      ID: {selectedCertForDetails.studentId} • {selectedCertForDetails.studentEmail}
                    </span>
                  </div>
                </div>
              </div>

              {/* Course Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 space-y-1">
                  <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                    <FiBookOpen className="w-4 h-4 text-rose-500" /> Course Information
                  </h3>
                  <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                    {selectedCertForDetails.courseName}
                  </h4>
                  <span className="text-slate-500 block">Instructor: {selectedCertForDetails.instructorName}</span>
                  <span className="text-slate-400 text-[11px] block">Completed on: {selectedCertForDetails.completionDate}</span>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 space-y-1">
                  <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                    <FiCalendar className="w-4 h-4 text-emerald-500" /> Certificate Audit
                  </h3>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Issue Date:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{selectedCertForDetails.issueDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Lessons Completed:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{selectedCertForDetails.lessonsCompleted} / {selectedCertForDetails.totalLessons} (100%)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Final Quiz Score:</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">{selectedCertForDetails.quizScore}%</span>
                  </div>
                </div>
              </div>

              {/* Cryptographic Verification Hash */}
              <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl font-mono text-[11px] text-slate-600 dark:text-slate-300 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <FiHash className="w-4 h-4 text-amber-500" />
                  <span><strong>Verification Hash:</strong> {selectedCertForDetails.verificationHash}</span>
                </div>
              </div>

              {/* Quick Actions Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => handleDownloadCertificate(selectedCertForDetails)}
                    disabled={downloadingCertId === selectedCertForDetails.id}
                    className="text-xs rounded-xl flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                  >
                    <FiDownload className="w-3.5 h-3.5" /> Download Certificate PDF
                  </Button>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedCertForDetails(null)}
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
      {/* INTERACTIVE CERTIFICATE VERIFICATION TOOL MODAL */}
      {/* ======================================================== */}
      <AnimatePresence>
        {verifyModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto font-sans" role="dialog" aria-label="Certificate Verification Tool">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[28px] p-6 sm:p-8 shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <h3 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <FiShield className="w-5 h-5 text-indigo-500" /> Public Certificate Verification Tool
                </h3>
                <button
                  onClick={() => setVerifyModalOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    Enter Certificate Number to Verify
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={verifyInputNumber}
                      onChange={(e) => setVerifyInputNumber(e.target.value)}
                      placeholder="e.g. EDU-2026-BD1F-0A8F2F8A"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-xs"
                    />
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleRunVerification()}
                      className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl py-2 px-4 shadow-sm shrink-0"
                    >
                      Verify
                    </Button>
                  </div>
                </div>

                {/* Verification Result Display */}
                {verificationResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-2xl border space-y-3 ${
                      verificationResult.valid
                        ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                        : 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-black uppercase text-[10px] tracking-wider">Verification Result</span>
                      <Badge variant={verificationResult.valid ? 'success' : 'danger'}>
                        {verificationResult.valid ? '✓ VALID CERTIFICATE' : '✕ CERTIFICATE NOT FOUND / INVALID'}
                      </Badge>
                    </div>

                    {verificationResult.valid && verificationResult.record ? (
                      <div className="space-y-1.5 text-xs">
                        <div className="font-bold text-sm text-slate-900 dark:text-slate-100">
                          {verificationResult.record.studentName}
                        </div>
                        <div>Course: <strong>{verificationResult.record.courseName}</strong></div>
                        <div>Issued On: {verificationResult.record.issueDate} • Instructor: {verificationResult.record.instructorName}</div>
                        <div className="text-[10px] font-mono opacity-80 pt-1 border-t border-emerald-200 dark:border-emerald-800">
                          Hash: {verificationResult.record.verificationHash}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1 text-xs">
                        <p className="font-bold">Certificate verification failed.</p>
                        <p className="text-[11px] opacity-90">
                          The entered certificate number does not match any authentic record in the EduSphere Master Registry.
                        </p>
                      </div>
                    )}
                  </motion.div>
                )}
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-200 dark:border-slate-800">
                <Button size="sm" variant="outline" onClick={() => setVerifyModalOpen(false)} className="text-xs rounded-xl">
                  Close
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

