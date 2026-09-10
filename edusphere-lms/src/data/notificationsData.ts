import type { NotificationPreferencesSettings } from '../types';

export const initialNotificationPreferences: NotificationPreferencesSettings = {
  assignmentReminders: true,
  quizDueDates: true,
  liveClassAlerts: true,
  courseAnnouncements: true,
  certificateUnlocks: true,
  paymentReceipts: true,
  emailDigest: true,
  pushNotifications: false,
};

