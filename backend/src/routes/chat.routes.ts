import { Router } from 'express';
import { authenticateUser } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import { chatController } from '../controllers/chat.controller';
import {
  createConversationSchema,
  sendMessageSchema,
  getMessagesQuerySchema,
} from '../validators/chat.validator';

const router = Router();

// All chat routes require authentication
router.use(authenticateUser);

// 1. Get eligible contacts for New Chat
router.get('/contacts', (req, res, next) => {
  chatController.getContacts(req, res, next);
});

// 2. Get unread messages count
router.get('/unread-count', (req, res, next) => {
  chatController.getUnreadCount(req, res, next);
});

// 3. Get conversations & Create/Get 1-to-1 conversation
router.get('/conversations', (req, res, next) => {
  chatController.getConversations(req, res, next);
});

router.post(
  '/conversations',
  validateRequest({ body: createConversationSchema }),
  (req, res, next) => {
    chatController.getOrCreateConversation(req, res, next);
  }
);

// 2. Get paginated messages
router.get(
  '/conversations/:id/messages',
  validateRequest({ query: getMessagesQuerySchema }),
  (req, res, next) => {
    chatController.getMessages(req, res, next);
  }
);

// 3. Send message
router.post(
  '/conversations/:id/messages',
  validateRequest({ body: sendMessageSchema }),
  (req, res, next) => {
    chatController.sendMessage(req, res, next);
  }
);

// 4. Mark conversation as read
router.post('/conversations/:id/read', (req, res, next) => {
  chatController.markAsRead(req, res, next);
});

// 5. Clear conversation history
router.post('/conversations/:id/clear', (req, res, next) => {
  chatController.clearConversation(req, res, next);
});

export default router;
