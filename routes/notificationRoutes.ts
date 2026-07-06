import { Router } from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { getNotifications, markAsRead } from '../controllers/notificationController.js';

const router = Router();

// GET /api/notifications
// Retrieves notifications for the logged in user
router.get('/', protect, getNotifications);

// POST /api/notifications/read
// Marks all or specific notifications as read
router.post('/read', protect, markAsRead);

export default router;

