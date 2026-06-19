import express from 'express';
import { getUnifiedLedger, getBlockchainAudit } from '../controllers/ledgerController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getUnifiedLedger);
router.get('/blockchain', protect, getBlockchainAudit);

export default router;
