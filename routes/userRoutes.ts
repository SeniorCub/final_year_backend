import express from 'express';
import { getUsers, getUser, updateUser } from '../controllers/userController.js';

const router = express.Router();

router.get('/', getUsers);
router.get('/:id', getUser);
router.put('/:id', updateUser);

export default router;
