import type { Response } from 'express';

export const createAccount = async (req: any, res: Response): Promise<void> => {
     try {
          const fromAddress = req.body.fromAddress || '0xMockUserAddress';
          res.status(200).json({
               to: '0xMockAccountContractAddress',
               value: '0',
               data: '0x9e7a8e7a000000000000000000000000' + fromAddress.slice(2),
               gasLimit: '150000',
               nonce: 0,
               chainId: 11155111 // Sepolia Testnet
          });
     } catch (error: any) {
          res.status(500).json({ success: false, error: error.message });
     }
};

export const depositContract = async (req: any, res: Response): Promise<void> => {
     try {
          const { amount } = req.body;
          res.status(200).json({
               to: '0xMockTransferContractAddress',
               value: amount || '0',
               data: '0xd0e30db0', // deposit method selector
               gasLimit: '100000',
               nonce: 1,
               chainId: 11155111
          });
     } catch (error: any) {
          res.status(500).json({ success: false, error: error.message });
     }
};

export const withdrawContract = async (req: any, res: Response): Promise<void> => {
     try {
          const { amount } = req.body;
          res.status(200).json({
               to: '0xMockTransferContractAddress',
               value: '0',
               data: '0x2e1a7d4d' + (amount || '0'), // withdraw method selector
               gasLimit: '120000',
               nonce: 2,
               chainId: 11155111
          });
     } catch (error: any) {
          res.status(500).json({ success: false, error: error.message });
     }
};

export const p2pContract = async (req: any, res: Response): Promise<void> => {
     try {
          const { recipientAddress, amount } = req.body;
          res.status(200).json({
               to: '0xMockTransferContractAddress',
               value: '0',
               data: '0xa9059cbb' + recipientAddress + (amount || '0'),
               gasLimit: '120000',
               nonce: 3,
               chainId: 11155111
          });
     } catch (error: any) {
          res.status(500).json({ success: false, error: error.message });
     }
};

export const broadcast = async (req: any, res: Response): Promise<void> => {
     try {
          const { signedTx } = req.body;
          if (!signedTx) {
               res.status(400).json({ success: false, message: 'Please provide signed transaction hex' });
               return;
          }
          const mockTxHash = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
          res.status(200).json({
               txHash: mockTxHash,
               status: 'confirmed',
               message: 'Transaction broadcasted and pending consensus (simulated).'
          });
     } catch (error: any) {
          res.status(500).json({ success: false, error: error.message });
     }
};

export const simulateSync = async (req: any, res: Response): Promise<void> => {
     try {
          const { type, hash, amount } = req.body;
          res.status(200).json({
               success: true,
               message: 'Simulated sync successful',
               hash
          });
     } catch (error: any) {
          res.status(500).json({ success: false, error: error.message });
     }
};
