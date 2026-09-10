import { Router } from 'express';
import {
  registerStudent,
  registerInstructor,
  uploadAvatar,
  login,
  logout,
  getCurrentUser,
  updateProfile,
  forgotPassword,
  resetPassword,
  deleteAccount,
} from '../controllers/auth.controller';
import { validateRequest } from '../middleware/validate.middleware';
import { imageUploadMiddleware } from '../middleware/upload.middleware';
import {
  studentRegisterSchema,
  instructorRegisterSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateProfileSchema,
} from '../validators/auth.validator';
import { authenticateUser } from '../middleware/auth.middleware';

const router = Router();

// Public Authentication Endpoints
router.post('/register/student', validateRequest(studentRegisterSchema), registerStudent);
router.post('/register/instructor', validateRequest(instructorRegisterSchema), registerInstructor);
router.post('/upload-avatar', imageUploadMiddleware.single('avatar'), uploadAvatar);
router.post('/login', validateRequest(loginSchema), login);
router.post('/logout', logout);
router.post('/forgot-password', validateRequest(forgotPasswordSchema), forgotPassword);

// Protected Authentication & Profile Endpoints
router.get('/me', authenticateUser, getCurrentUser);
router.put('/profile', authenticateUser, validateRequest(updateProfileSchema), updateProfile);
router.post('/reset-password', authenticateUser, validateRequest(resetPasswordSchema), resetPassword);
router.delete('/account', authenticateUser, deleteAccount);

export default router;
