import express from 'express';
import { createAccount, depositContract, withdrawContract, p2pContract, broadcast } from '../controllers/transferController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/eth/create-account', protect, createAccount);
router.post('/eth/deposit', protect, depositContract);
router.post('/eth/withdraw', protect, withdrawContract);
router.post('/eth/p2p', protect, p2pContract);
router.post('/eth/broadcast', protect, broadcast);

export default router;
