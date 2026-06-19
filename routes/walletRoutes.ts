import express from 'express';
import { getWalletInfo, getWalletBalance } from '../controllers/walletController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getWalletInfo);
router.get('/balance', protect, getWalletBalance);

export default router;
