import type { Response } from 'express';
import User from '../models/User.js';

export const getAllUsersAdmin = async (req: any, res: Response): Promise<void> => {
     try {
          const users = await User.find().select('-password');
          res.status(200).json(users);
     } catch (error: any) {
          res.status(500).json({ success: false, error: error.message });
     }
};

export const getAllLedgerEntriesAdmin = async (req: any, res: Response): Promise<void> => {
     try {
          res.status(200).json([
               {
                    id: 'ledger-entry-1',
                    userId: 'admin-simulated-user-id',
                    type: 'DEPOSIT',
                    amount: 1000,
                    reference: 'DEP-12345',
                    metadata: { method: 'simulation' },
                    createdAt: new Date().toISOString()
               }
          ]);
     } catch (error: any) {
          res.status(500).json({ success: false, error: error.message });
     }
};
