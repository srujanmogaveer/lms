export interface AdminPlatformSettings {
  // Platform Information
  platformName: string;
  supportEmail: string;
  supportPhone: string;

  // Registration Toggles
  enableStudentRegistration: boolean;
  enableInstructorRegistration: boolean;

  // Payment Commission
  platformCommissionPercent: number;

  // Maintenance Toggle & Message
  enableMaintenanceMode: boolean;
  maintenanceMessage: string;
}

export const defaultAdminSettings: AdminPlatformSettings = {
  platformName: 'EduSphere Learning Management System',
  supportEmail: 'support@edusphere.edu',
  supportPhone: '9876543210',
  enableStudentRegistration: true,
  enableInstructorRegistration: true,
  platformCommissionPercent: 15,
  enableMaintenanceMode: false,
  maintenanceMessage: 'The platform is currently under maintenance.',
};
