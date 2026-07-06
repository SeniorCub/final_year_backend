import express from 'express';
import { createAccount, depositContract, withdrawContract, p2pContract, broadcast, simulateSync } from '../controllers/transferController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/eth/create-account', protect, createAccount);
router.post('/eth/deposit', protect, depositContract);
router.post('/eth/withdraw', protect, withdrawContract);
router.post('/eth/p2p', protect, p2pContract);
router.post('/eth/broadcast', protect, broadcast);
router.post('/eth/simulate-sync', protect, simulateSync);

export default router;
