import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiSliders,
  FiDollarSign,
  FiUserCheck,
  FiAlertOctagon,
  FiSave,
  FiRotateCcw,
  FiCheckCircle,
  FiMail,
  FiPhone,
  FiGlobe,
  FiPercent,
  FiTool,
  FiAlertTriangle,
  FiLoader,
  FiLock
} from 'react-icons/fi';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import {
  type AdminPlatformSettings,
  defaultAdminSettings
} from '../../data/adminSettingsData';
import {
  showSuccessAlert,
  showErrorAlert,
  showConfirmAlert
} from '../../utils/swalAlerts';
import { usePlatformSettings } from '../../hooks/usePlatformSettings';

export const AdminSettings: React.FC = () => {
  const {
    settings: serverSettings,
    updateSettings,
    resetSettings,
    isUpdating,
    isResetting,
  } = usePlatformSettings();

  // Local form state synchronized with backend settings
  const [settings, setSettings] = useState<AdminPlatformSettings>(serverSettings || defaultAdminSettings);

  useEffect(() => {
    if (serverSettings) {
      setSettings(serverSettings);
    }
  }, [serverSettings]);

  // Toast Notification State
  const [toastMessage] = useState<string | null>(null);

  // Save Handler
  const handleSaveChanges = async () => {
    if (settings.supportPhone && !/^\d{10}$/.test(settings.supportPhone)) {
      showErrorAlert('Invalid Phone Number', 'Support phone number must be exactly 10 digits (numbers only).');
      return;
    }

    try {
      await updateSettings(settings);
      showSuccessAlert('Success!', 'Platform settings saved successfully.');
    } catch (err: any) {
      showErrorAlert('Failed to Save', err.message || 'Could not save platform settings.');
    }
  };

  // Reset Handler
  const handleReset = async () => {
    const confirmed = await showConfirmAlert(
      'Reset Platform Settings?',
      'Are you sure you want to reset all platform settings to default values?',
      'Reset Settings',
      'Cancel',
      'warning'
    );

    if (confirmed) {
      try {
        const reset = await resetSettings();
        setSettings(reset);
        showSuccessAlert('Success!', 'Platform settings reset to default.');
      } catch (err: any) {
        showErrorAlert('Failed to Reset', err.message || 'Could not reset platform settings.');
      }
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers and limit to 10 digits
    const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 10);
    setSettings({ ...settings, supportPhone: digitsOnly });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-8 pb-20 font-sans max-w-5xl mx-auto"
    >
      {/* Toast Alert Banner */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-5 right-5 z-50 px-4 py-3 bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold rounded-2xl shadow-2xl flex items-center gap-2 border border-slate-700 dark:border-slate-300"
          >
            <FiCheckCircle className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-[24px] border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 rounded-xl">
              <FiSliders className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Platform Settings
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
            Essential configuration controls for platform identity, user registrations, revenue commission, and maintenance mode.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="outline"
            onClick={handleReset}
            disabled={isResetting || isUpdating}
            className="text-xs font-bold rounded-xl flex items-center gap-1.5 py-2.5 px-4 disabled:opacity-50"
          >
            {isResetting ? (
              <FiLoader className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <FiRotateCcw className="w-3.5 h-3.5" />
            )}
            {isResetting ? 'Resetting...' : 'Reset'}
          </Button>

          <Button
            size="sm"
            variant="primary"
            onClick={handleSaveChanges}
            disabled={isUpdating || isResetting}
            className="text-xs font-bold rounded-xl flex items-center gap-1.5 bg-rose-600 hover:bg-rose-500 text-white shadow-md py-2.5 px-5 disabled:opacity-50"
          >
            {isUpdating ? (
              <FiLoader className="w-4 h-4 animate-spin" />
            ) : (
              <FiSave className="w-4 h-4" />
            )}
            {isUpdating ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Maintenance Mode Warning Notice (When Active) */}
      {settings.enableMaintenanceMode && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-5 rounded-[24px] bg-rose-500/10 border-2 border-rose-500 text-rose-900 dark:text-rose-200 space-y-2 shadow-lg"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-600 text-white rounded-xl shrink-0">
              <FiAlertOctagon className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-rose-600 dark:text-rose-400">
                Maintenance Mode Active
              </h3>
              <p className="text-xs font-bold text-rose-700 dark:text-rose-300 mt-0.5">
                "{settings.maintenanceMessage || 'The platform is currently under maintenance.'}"
              </p>
            </div>
          </div>
          <p className="text-[11px] text-rose-600/90 dark:text-rose-300/90 pl-11">
            <strong>Access Rule:</strong> Maintenance mode blocks Student and Instructor access, but allows Admin access.
          </p>
        </motion.div>
      )}

      {/* 1. PLATFORM INFORMATION */}
      <Card className="p-6 rounded-[24px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <FiGlobe className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-slate-100">
                Platform Information
              </h2>
              <p className="text-xs text-slate-500">
                Basic platform identity and support contact details.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
          {/* Platform Name (System Fixed) */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <FiGlobe className="w-3.5 h-3.5 text-rose-500" /> Platform Name
              </span>
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1">
                <FiLock className="w-2.5 h-2.5" /> Fixed
              </span>
            </label>
            <div className="relative flex items-center">
              <input
                type="text"
                readOnly
                disabled
                value={settings.platformName || 'EduSphere Learning Management System'}
                className="w-full px-3.5 py-2.5 pr-9 bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-500 dark:text-slate-400 font-semibold cursor-not-allowed select-none"
              />
              <div className="absolute right-3 text-slate-400 dark:text-slate-500 pointer-events-none">
                <FiLock className="w-3.5 h-3.5" />
              </div>
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500">
              Core brand identity is permanently fixed.
            </p>
          </div>

          {/* Support Email */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <FiMail className="w-3.5 h-3.5 text-indigo-500" /> Support Email
            </label>
            <input
              type="email"
              value={settings.supportEmail}
              onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
              placeholder="e.g. support@edusphere.edu"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500 font-semibold"
            />
          </div>

          {/* Support Phone */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <FiPhone className="w-3.5 h-3.5 text-emerald-500" /> Support Phone
              </span>
              <span className="text-[10px] text-slate-400 font-normal">
                {settings.supportPhone?.length || 0}/10 digits
              </span>
            </label>
            <div className="relative flex items-center">
              <input
                type="tel"
                maxLength={10}
                value={settings.supportPhone}
                onChange={handlePhoneChange}
                placeholder="e.g. 9876543210"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500 font-semibold font-mono tracking-wider"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* 2. REGISTRATION */}
      <Card className="p-6 rounded-[24px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 rounded-xl">
              <FiUserCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-slate-100">
                Registration
              </h2>
              <p className="text-xs text-slate-500">
                Enable or disable student signups and instructor applications.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
          {/* Student Registration Toggle */}
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                  Student Registration
                </h3>
                <Badge variant={settings.enableStudentRegistration ? 'success' : 'danger'}>
                  {settings.enableStudentRegistration ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
              <p className="text-slate-500 text-[11px] mt-0.5">
                Allow new students to create an account.
              </p>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={settings.enableStudentRegistration}
              onClick={() =>
                setSettings({
                  ...settings,
                  enableStudentRegistration: !settings.enableStudentRegistration,
                })
              }
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                settings.enableStudentRegistration ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  settings.enableStudentRegistration ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Instructor Registration Toggle */}
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                  Instructor Registration
                </h3>
                <Badge variant={settings.enableInstructorRegistration ? 'success' : 'danger'}>
                  {settings.enableInstructorRegistration ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
              <p className="text-slate-500 text-[11px] mt-0.5">
                Allow new instructors to submit registration applications.
              </p>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={settings.enableInstructorRegistration}
              onClick={() =>
                setSettings({
                  ...settings,
                  enableInstructorRegistration: !settings.enableInstructorRegistration,
                })
              }
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                settings.enableInstructorRegistration ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  settings.enableInstructorRegistration ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </Card>

      {/* 3. PAYMENT */}
      <Card className="p-6 rounded-[24px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <FiDollarSign className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-slate-100">
                Payment
              </h2>
              <p className="text-xs text-slate-500">
                Platform revenue share used to calculate instructor earnings in Indian Rupees (₹).
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-1.5 max-w-sm text-xs">
          <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <FiPercent className="w-3.5 h-3.5 text-emerald-600" /> Platform Commission (%)
          </label>
          <div className="flex items-center gap-3">
            <div className="relative w-36">
              <input
                type="number"
                min={0}
                max={100}
                value={settings.platformCommissionPercent}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    platformCommissionPercent: Math.max(0, Math.min(100, Number(e.target.value))),
                  })
                }
                className="w-full pl-3 pr-7 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500 font-bold text-sm"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">
                %
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Instructor share: <strong>{100 - settings.platformCommissionPercent}%</strong> of course revenue.
            </p>
          </div>
        </div>
      </Card>

      {/* 4. MAINTENANCE */}
      <Card className="p-6 rounded-[24px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 rounded-xl">
              <FiTool className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-slate-100">
                Maintenance
              </h2>
              <p className="text-xs text-slate-500">
                Lock student & instructor access during platform updates.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4 text-xs">
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                  Maintenance Mode
                </h3>
                <Badge variant={settings.enableMaintenanceMode ? 'danger' : 'success'}>
                  {settings.enableMaintenanceMode ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
              <p className="text-slate-500 text-[11px] mt-0.5">
                When enabled, blocks Student and Instructor access but allows Admin access.
              </p>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={settings.enableMaintenanceMode}
              onClick={() =>
                setSettings({
                  ...settings,
                  enableMaintenanceMode: !settings.enableMaintenanceMode,
                })
              }
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                settings.enableMaintenanceMode ? 'bg-rose-600' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  settings.enableMaintenanceMode ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Display Message Notice Box when enabled */}
          {settings.enableMaintenanceMode && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl space-y-1.5"
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 block">
                User Maintenance Screen Notice:
              </span>
              <p className="text-xs font-bold text-rose-900 dark:text-rose-200 flex items-center gap-2">
                <FiAlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                "The platform is currently under maintenance."
              </p>
            </motion.div>
          )}
        </div>
      </Card>

      {/* Footer Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button
          size="sm"
          variant="outline"
          onClick={handleReset}
          disabled={isResetting || isUpdating}
          className="text-xs font-bold rounded-xl py-2.5 px-5 disabled:opacity-50"
        >
          {isResetting ? (
            <FiLoader className="w-3.5 h-3.5 mr-1 animate-spin" />
          ) : (
            <FiRotateCcw className="w-3.5 h-3.5 mr-1" />
          )}
          {isResetting ? 'Resetting...' : 'Reset'}
        </Button>
        <Button
          size="sm"
          variant="primary"
          onClick={handleSaveChanges}
          disabled={isUpdating || isResetting}
          className="text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-500 text-white shadow-md py-2.5 px-6 disabled:opacity-50"
        >
          {isUpdating ? (
            <FiLoader className="w-4 h-4 mr-1 animate-spin" />
          ) : (
            <FiSave className="w-4 h-4 mr-1" />
          )}
          {isUpdating ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </motion.div>
  );
};
