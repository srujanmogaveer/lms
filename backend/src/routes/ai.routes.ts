import { Router } from 'express';
import { studentAiController } from '../controllers/ai.controller';
import { authenticateUser } from '../middleware/auth.middleware';

const router = Router();

// Protect all Student AI endpoints with student authentication
router.use(authenticateUser);

// AI Endpoints
router.post('/chat', studentAiController.chat);
router.get('/conversations', studentAiController.getConversations);
router.get('/conversations/:id', studentAiController.getConversationMessages);
router.get('/usage', studentAiController.getDailyUsage);

export default router;
