import type { Response } from 'express';

const accountBalances = new Map<string, number>();
const accountNumbers = new Map<string, string>();

const getOrInitAccount = (userId: string) => {
     if (!accountBalances.has(userId)) {
          accountBalances.set(userId, 1000.00); // Default balance
     }
     if (!accountNumbers.has(userId)) {
          const randomAcc = Math.floor(1000000000 + Math.random() * 9000000000).toString();
          accountNumbers.set(userId, randomAcc);
     }
     return {
          id: `acc-${userId.slice(-6)}`,
          userId,
          accountNumber: accountNumbers.get(userId)!,
          balance: accountBalances.get(userId)!
     };
};

export const getAccountDetails = async (req: any, res: Response): Promise<void> => {
     try {
          const acc = getOrInitAccount(req.user.userId);
          res.status(200).json(acc);
     } catch (error: any) {
          res.status(500).json({ success: false, error: error.message });
     }
};

export const getBalance = async (req: any, res: Response): Promise<void> => {
     try {
          const acc = getOrInitAccount(req.user.userId);
          res.status(200).json({ balance: acc.balance });
     } catch (error: any) {
          res.status(500).json({ success: false, error: error.message });
     }
};

export const deposit = async (req: any, res: Response): Promise<void> => {
     try {
          const { amount } = req.body;
          if (!amount || typeof amount !== 'number' || amount <= 0) {
               res.status(400).json({ success: false, message: 'Invalid deposit amount' });
               return;
          }
          const acc = getOrInitAccount(req.user.userId);
          const newBalance = acc.balance + amount;
          accountBalances.set(req.user.userId, newBalance);

          res.status(200).json({
               message: 'Deposit successful',
               balance: newBalance
          });
     } catch (error: any) {
          res.status(500).json({ success: false, error: error.message });
     }
};
