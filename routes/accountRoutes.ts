import express from 'express';
import { getAccountDetails, getBalance, deposit } from '../controllers/accountController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getAccountDetails);
router.get('/balance', protect, getBalance);
router.post('/deposit', protect, deposit);

export default router;
