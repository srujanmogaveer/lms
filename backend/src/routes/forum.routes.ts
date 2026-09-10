import { Router } from 'express';
import { authenticateUser } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import { ForumController } from '../controllers/forum.controller';

const router = Router();

// All forum routes require user authentication
router.use(authenticateUser);

// 1. Get discussions (supports courseId, category, status, search, sortBy, pagination)
router.get('/discussions', ForumController.getDiscussions);

// 2. Get single discussion details (with replies and reaction state)
router.get('/discussions/:id', ForumController.getDiscussionDetails);

// 3. Create discussion thread
router.post('/discussions', ForumController.createDiscussion);

// 4. Update discussion thread (Author or Admin)
router.patch('/discussions/:id', ForumController.updateDiscussion);

// 5. Delete discussion thread
router.delete('/discussions/:id', ForumController.deleteDiscussion);

// 6. Post reply to discussion
router.post('/discussions/:id/replies', ForumController.createReply);

// 7. Update reply (Author or Admin)
router.patch('/replies/:id', ForumController.updateReply);

// 8. Delete reply
router.delete('/replies/:id', ForumController.deleteReply);

// 9. Toggle reaction (Like / Unlike) on discussion or reply
router.post('/react', ForumController.toggleReaction);

// 10. Moderate discussion (Pin, Solve, Lock) - Instructor or Admin
router.patch(
  '/discussions/:id/moderate',
  requireRole(['instructor', 'admin']),
  ForumController.moderateDiscussion
);

// 11. Moderate reply (Pin, Accepted Answer) - Instructor or Admin
router.patch(
  '/replies/:id/moderate',
  requireRole(['instructor', 'admin']),
  ForumController.moderateReply
);

// 12. Create moderation report
router.post('/reports', ForumController.createReport);

// 13. Get moderation reports - Instructor or Admin
router.get(
  '/reports',
  requireRole(['instructor', 'admin']),
  ForumController.getReports
);

// 14. Resolve moderation report - Instructor or Admin
router.patch(
  '/reports/:id/resolve',
  requireRole(['instructor', 'admin']),
  ForumController.resolveReport
);

export default router;
