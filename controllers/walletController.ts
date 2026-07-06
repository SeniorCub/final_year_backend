import type { Response } from 'express';

const wallets = new Map<string, { ethPublicKey: string, solPublicKey: string }>();

const getOrInitWallet = (userId: string) => {
     if (!wallets.has(userId)) {
          // Generate realistic looking mock addresses
          const ethKey = '0x' + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
          const solKey = Array.from({ length: 44 }, () => {
               const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
               return chars.charAt(Math.floor(Math.random() * chars.length));
          }).join('');
          wallets.set(userId, { ethPublicKey: ethKey, solPublicKey: solKey });
     }
     const wallet = wallets.get(userId)!;
     return {
          id: `wal-${userId.slice(-6)}`,
          userId,
          ethPublicKey: wallet.ethPublicKey,
          solPublicKey: wallet.solPublicKey,
          publicKey: wallet.solPublicKey // for test script compatibility
     };
};

export const getWalletInfo = async (req: any, res: Response): Promise<void> => {
     try {
          const wallet = getOrInitWallet(req.user.userId);
          res.status(200).json(wallet);
     } catch (error: any) {
          res.status(500).json({ success: false, error: error.message });
     }
};

export const getWalletBalance = async (req: any, res: Response): Promise<void> => {
     try {
          const wallet = getOrInitWallet(req.user.userId);
          res.status(200).json({
               ethPublicKey: wallet.ethPublicKey,
               solPublicKey: wallet.solPublicKey,
               eth: '1.25',
               sol: '500.0'
          });
     } catch (error: any) {
          res.status(500).json({ success: false, error: error.message });
     }
};

export const faucet = async (req: any, res: Response): Promise<void> => {
     try {
          const { coin, amount } = req.body;
          res.status(200).json({
               success: true,
               message: `Added ${amount} ${coin} to simulated wallet.`
          });
     } catch (error: any) {
          res.status(500).json({ success: false, error: error.message });
     }
};
