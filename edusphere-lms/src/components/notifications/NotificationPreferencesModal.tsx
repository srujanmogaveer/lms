import React, { useState } from 'react';
import {
  FiSliders,
  FiMail,
  FiSmartphone,
  FiCheck,
  FiRotateCcw,
} from 'react-icons/fi';
import { BaseModal } from '../dashboard/DashboardModals';
import { Button } from '../ui/Button';
import { initialNotificationPreferences } from '../../data/notificationsData';
import type { NotificationPreferencesSettings } from '../../types';

interface NotificationPreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PREFS_STORAGE_KEY = 'edusphere_notification_preferences';

export const NotificationPreferencesModal: React.FC<NotificationPreferencesModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [preferences, setPreferences] = useState<NotificationPreferencesSettings>(() => {
    try {
      const saved = localStorage.getItem(PREFS_STORAGE_KEY);
      if (saved) {
        return { ...initialNotificationPreferences, ...JSON.parse(saved) };
      }
    } catch {
      // Fallback
    }
    return initialNotificationPreferences;
  });
  const [isSaved, setIsSaved] = useState(false);

  const toggleSetting = (key: keyof NotificationPreferencesSettings) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = () => {
    try {
      localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(preferences));
    } catch {
      // Storage error fallback
    }
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 1200);
  };

  const handleReset = () => {
    setPreferences(initialNotificationPreferences);
    try {
      localStorage.removeItem(PREFS_STORAGE_KEY);
    } catch {
      // Storage error fallback
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Notification Preferences & Channels"
    >
      <div className="space-y-6 py-2">
        {/* Header Intro */}
        <div className="p-4 bg-brand-50/60 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-900/60 rounded-2xl space-y-1 text-xs text-slate-700 dark:text-slate-300">
          <div className="flex items-center gap-1.5 font-bold text-brand-900 dark:text-brand-300">
            <FiSliders className="w-4 h-4 text-brand-600" />
            <span>Customize Alert Categories & Dispatch Channels</span>
          </div>
          <p>
            Choose which notifications you wish to receive on your dashboard, via email, or as web push alerts.
          </p>
        </div>

        {/* Categories Toggles Group */}
        <div className="space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
            Category Subscriptions
          </span>

          <div className="space-y-2">
            {[
              { key: 'assignmentReminders', title: 'Assignment Reminders & Deadlines', desc: 'Alerts when new assignments are posted or due soon.' },
              { key: 'quizDueDates', title: 'Quiz & Exam Announcements', desc: 'Alerts for upcoming test attempts and released grades.' },
              { key: 'liveClassAlerts', title: 'Live Class Studio Start Reminders', desc: 'Alerts 15 minutes before a live workshop room opens.' },
              { key: 'courseAnnouncements', title: 'Official Course & Platform News', desc: 'Instructor broadcasts and maintenance notices.' },
              { key: 'certificateUnlocks', title: 'Certificate Graduation Credentials', desc: 'Alerts when course certificates become available.' },
              { key: 'paymentReceipts', title: 'Payment & Billing Receipts', desc: 'Payment confirmation notices and tax invoices.' },
            ].map((item) => {
              const typedKey = item.key as keyof NotificationPreferencesSettings;
              const isChecked = preferences[typedKey];
              return (
                <div
                  key={item.key}
                  onClick={() => toggleSetting(typedKey)}
                  className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between cursor-pointer hover:border-brand-400 transition-colors"
                >
                  <div className="space-y-0.5 min-w-0 pr-3">
                    <span className="font-bold text-slate-900 dark:text-slate-100 text-xs block">
                      {item.title}
                    </span>
                    <span className="text-[11px] text-slate-500 block truncate">
                      {item.desc}
                    </span>
                  </div>

                  <div
                    className={`w-11 h-6 rounded-full transition-colors relative shrink-0 p-0.5 ${
                      isChecked ? 'bg-brand-600' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
                        isChecked ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Delivery Channels Group */}
        <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
            Dispatch Channels
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Email Digest */}
            <div
              onClick={() => toggleSetting('emailDigest')}
              className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between cursor-pointer hover:border-brand-400"
            >
              <div className="flex items-center gap-2">
                <FiMail className="w-4 h-4 text-brand-600" />
                <div>
                  <span className="font-bold text-slate-900 dark:text-slate-100 text-xs block">Email Digest</span>
                  <span className="text-[10px] text-slate-400">Daily summary email</span>
                </div>
              </div>
              <div
                className={`w-9 h-5 rounded-full transition-colors relative shrink-0 p-0.5 ${
                  preferences.emailDigest ? 'bg-brand-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white shadow-md transition-transform ${
                    preferences.emailDigest ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </div>
            </div>

            {/* Push Notifications */}
            <div
              onClick={() => toggleSetting('pushNotifications')}
              className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between cursor-pointer hover:border-brand-400"
            >
              <div className="flex items-center gap-2">
                <FiSmartphone className="w-4 h-4 text-brand-600" />
                <div>
                  <span className="font-bold text-slate-900 dark:text-slate-100 text-xs block">Push Alerts</span>
                  <span className="text-[10px] text-slate-400">Browser push popups</span>
                </div>
              </div>
              <div
                className={`w-9 h-5 rounded-full transition-colors relative shrink-0 p-0.5 ${
                  preferences.pushNotifications ? 'bg-brand-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white shadow-md transition-transform ${
                    preferences.pushNotifications ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="text-xs flex items-center gap-1 text-slate-500"
          >
            <FiRotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={handleSave}
            className="bg-brand-600 hover:bg-brand-700 text-white flex items-center gap-1.5 text-xs font-bold"
          >
            {isSaved ? (
              <>
                <FiCheck className="w-4 h-4 text-emerald-400" />
                <span>Preferences Saved!</span>
              </>
            ) : (
              <span>Save Preferences</span>
            )}
          </Button>
        </div>
      </div>
    </BaseModal>
  );
};
