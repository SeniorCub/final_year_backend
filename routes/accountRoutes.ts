import express from 'express';
import { getAccountDetails, getBalance, deposit, verifyDeposit, webhookDeposit } from '../controllers/accountController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Webhook is unauthenticated
router.post('/deposit/webhook', webhookDeposit);

router.get('/', protect, getAccountDetails);
router.get('/balance', protect, getBalance);
router.post('/deposit', protect, deposit);
router.get('/deposit/verify/:reference', protect, verifyDeposit);

export default router;
