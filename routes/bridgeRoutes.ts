import express from 'express';
import { getBridgeConfig, withdrawBridge } from '../controllers/bridgeController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/config', protect, getBridgeConfig);
router.post('/withdraw', protect, withdrawBridge);

export default router;
