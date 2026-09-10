import React, { useState } from 'react';
import {
  FiSliders,
  FiMoon,
  FiGlobe,
  FiClock,
  FiShield,
  FiCheck,
} from 'react-icons/fi';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { useTheme } from '../../contexts/ThemeContext';
import type { FullStudentProfile } from '../../types';

interface ApplicationSettingsSectionProps {
  profile: FullStudentProfile;
  onSavePreferences: (profile: FullStudentProfile) => void;
}

export const ApplicationSettingsSection: React.FC<ApplicationSettingsSectionProps> = ({
  profile,
  onSavePreferences,
}) => {
  const { setTheme: setAppTheme } = useTheme();
  const [theme, setTheme] = useState(profile.themePreference);
  const [lang, setLang] = useState(profile.languagePreference);
  const [tz, setTz] = useState(profile.timezone);
  const [privacy, setPrivacy] = useState(profile.privacy);

  const [isSaved, setIsSaved] = useState(false);

  React.useEffect(() => {
    setTheme(profile.themePreference);
    setLang(profile.languagePreference);
    setTz(profile.timezone);
    setPrivacy(profile.privacy);
  }, [profile]);

  const handleSave = () => {
    onSavePreferences({
      ...profile,
      themePreference: theme,
      languagePreference: lang,
      timezone: tz,
      privacy: privacy,
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const togglePrivacyKey = (key: keyof typeof privacy) => {
    setPrivacy((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <div className="space-y-6">
      {/* 1. Appearance & Regional Preferences */}
      <Card className="p-6 space-y-6 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <FiSliders className="w-5 h-5 text-brand-600" />
              <span>Application Theme & Regional Settings</span>
            </h2>
            <p className="text-xs text-slate-500">
              Customize interface display themes, local language, and timezone settings.
            </p>
          </div>

          {isSaved && (
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 rounded-xl border border-emerald-200 flex items-center gap-1">
              <FiCheck className="w-3.5 h-3.5" /> Preferences Saved!
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Theme Selector */}
          <div className="space-y-2 p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700">
            <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <FiMoon className="w-4 h-4 text-brand-600" /> Display Theme
            </span>
            <div className="grid grid-cols-3 gap-1.5 pt-1">
              {[
                { id: 'light', label: 'Light' },
                { id: 'dark', label: 'Dark' },
                { id: 'system', label: 'System' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    const newTheme = t.id as 'light' | 'dark' | 'system';
                    setTheme(newTheme);
                    if (newTheme === 'light' || newTheme === 'dark') {
                      setAppTheme(newTheme);
                    } else {
                      const sysTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                      setAppTheme(sysTheme);
                    }
                  }}
                  className={`py-2 rounded-xl font-bold transition-all text-[11px] ${
                    theme === t.id
                      ? 'bg-brand-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Language Selector */}
          <div className="space-y-2 p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700">
            <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <FiGlobe className="w-4 h-4 text-brand-600" /> Language
            </span>
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-semibold outline-none text-xs"
            >
              <option value="English (India)">English (India)</option>
              <option value="Kannada (ಕನ್ನಡ)">Kannada (ಕನ್ನಡ)</option>
              <option value="Hindi (हिंदी)">Hindi (हिंदी)</option>
              <option value="Tamil (தமிழ்)">Tamil (தமிழ்)</option>
              <option value="Telugu (తెలుగు)">Telugu (తెలుగు)</option>
              <option value="Malayalam (മലയാളം)">Malayalam (മലയാളം)</option>
              <option value="Marathi (मराठी)">Marathi (मराठी)</option>
            </select>
          </div>

          {/* Timezone Selector */}
          <div className="space-y-2 p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700">
            <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <FiClock className="w-4 h-4 text-brand-600" /> System Timezone
            </span>
            <select
              value={tz}
              onChange={(e) => setTz(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-semibold outline-none text-[11px]"
            >
              <option value="Asia/Kolkata (IST)">Asia/Kolkata (IST - UTC+05:30)</option>
              <option value="UTC (UTC+00:00) Universal">UTC (UTC+00:00) Universal</option>
            </select>
          </div>
        </div>
      </Card>

      {/* 2. Privacy & Visibility Toggles */}
      <Card className="p-6 space-y-4 border border-slate-200 dark:border-slate-800">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FiShield className="w-4 h-4 text-brand-600" />
            <span>Privacy & Public Profile Controls</span>
          </h3>
          <p className="text-xs text-slate-500">
            Control what information other students and instructors can see on your public profile.
          </p>
        </div>

        <div className="space-y-3 text-xs">
          {[
            { key: 'publicProfile', label: 'Public Profile Visibility', desc: 'Allow other students to view your avatar and achievements.' },
            { key: 'showLearningProgress', label: 'Show Course Learning Progress', desc: 'Display course completion metrics on leaderboard.' },
            { key: 'shareCertificates', label: 'Share Academic Certificates', desc: 'Allow verification links to be publicly validated.' },
            { key: 'marketingEmails', label: 'Platform Update Announcements', desc: 'Receive news on new course releases and promotions.' },
          ].map((item) => {
            const pk = item.key as keyof typeof privacy;
            const isChecked = privacy[pk];
            return (
              <div
                key={item.key}
                onClick={() => togglePrivacyKey(pk)}
                className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between cursor-pointer hover:border-brand-400"
              >
                <div className="space-y-0.5">
                  <span className="font-bold text-slate-900 dark:text-slate-100 block">
                    {item.label}
                  </span>
                  <span className="text-[11px] text-slate-500 block">
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

        <div className="pt-2 flex justify-end">
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={handleSave}
            className="bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs"
          >
            <span>Save Settings</span>
          </Button>
        </div>
      </Card>
    </div>
  );
};
