import express from 'express';
import { getAllUsersAdmin, getAllLedgerEntriesAdmin } from '../controllers/adminController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/users', protect, getAllUsersAdmin);
router.get('/ledger', protect, getAllLedgerEntriesAdmin);

export default router;
