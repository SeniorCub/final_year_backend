import type { Response } from 'express';

export const getBridgeConfig = async (req: any, res: Response): Promise<void> => {
     try {
          res.status(200).json({
               systemWalletAddress: 'SysSolWalletAddress1111111111111111111111',
               tokenMintAddress: 'cNGNTokenMintAddress111111111111111111111',
               network: 'Solana Devnet'
          });
     } catch (error: any) {
          res.status(500).json({ success: false, error: error.message });
     }
};

export const withdrawBridge = async (req: any, res: Response): Promise<void> => {
     try {
          const { amount } = req.body;
          if (!amount || typeof amount !== 'number' || amount <= 0) {
               res.status(400).json({ success: false, message: 'Invalid withdrawal amount' });
               return;
          }
          const mockSig = Array.from({ length: 88 }, () => {
               const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
               return chars.charAt(Math.floor(Math.random() * chars.length));
          }).join('');
          res.status(200).json({
               success: true,
               signature: mockSig,
               reference: `BCW-${Date.now()}-${Math.floor(Math.random() * 1000)}`
          });
     } catch (error: any) {
          res.status(500).json({ success: false, error: error.message });
     }
};
