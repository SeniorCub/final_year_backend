import express from 'express';
import { getWalletInfo, getWalletBalance, faucet } from '../controllers/walletController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getWalletInfo);
router.get('/balance', protect, getWalletBalance);
router.post('/faucet', protect, faucet);

export default router;
