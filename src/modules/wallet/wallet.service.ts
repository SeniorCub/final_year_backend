import prisma from '../database/prisma.js';
import { solanaService } from '../blockchain/solana.service.js';
import { ethereumService } from '../blockchain/ethereum.service.js';
import { encrypt, decrypt } from '../../utils/encryption.js';

export class WalletService {
     async createWallet(userId: string) {
          const existingWallet = await prisma.wallet.findUnique({
               where: { userId },
          });

          if (existingWallet) {
               return existingWallet;
          }

          // 1. Create Ethereum Wallet
          const eth = await ethereumService.createWallet();
          const encryptedEthPrivateKey = encrypt(eth.privateKey);

          // 2. Create Solana Wallet
          const sol = await solanaService.createWallet();
          const encryptedSolPrivateKey = encrypt(sol.privateKey);

          const wallet = await prisma.wallet.create({
               data: {
                    userId,
                    ethPublicKey: eth.publicKey,
                    encryptedEthPrivateKey,
                    solPublicKey: sol.publicKey,
                    encryptedSolPrivateKey,
               },
          });

          return wallet;
     }

     async getWallet(userId: string) {
          const wallet = await prisma.wallet.findUnique({
               where: { userId },
          });

          if (!wallet) {
               throw new Error('Wallet not found for user');
          }

          return wallet;
     }

     async getBalance(userId: string) {
          const wallet = await this.getWallet(userId);
          const ethBalance = await ethereumService.getBalance(wallet.ethPublicKey);
          let solBalance: string | number = 0;
          try {
               solBalance = await solanaService.getSOLBalance(wallet.solPublicKey);
          } catch (err: any) {
               console.warn(`Failed to fetch Solana balance for ${wallet.solPublicKey}:`, err.message);
               solBalance = "0"; // Changed to just "0" for addition
          }
          
          const totalEth = parseFloat(ethBalance) + parseFloat(wallet.simulatedEthBalance.toString());
          const totalSol = parseFloat(solBalance.toString()) + parseFloat(wallet.simulatedSolBalance.toString());

          return {
               ethPublicKey: wallet.ethPublicKey,
               solPublicKey: wallet.solPublicKey,
               eth: totalEth,
               sol: totalSol,
          };
     }

     async getDecryptedEthPrivateKey(userId: string) {
          const wallet = await this.getWallet(userId);
          return decrypt(wallet.encryptedEthPrivateKey);
     }

     async getDecryptedSolPrivateKey(userId: string) {
          const wallet = await this.getWallet(userId);
          return decrypt(wallet.encryptedSolPrivateKey);
     }

     async fundDemoWallet(userId: string, coin: 'eth' | 'sol', amount: number) {
          if (coin === 'eth') {
               await prisma.wallet.update({
                    where: { userId },
                    data: { simulatedEthBalance: { increment: amount } }
               });
          } else if (coin === 'sol') {
               await prisma.wallet.update({
                    where: { userId },
                    data: { simulatedSolBalance: { increment: amount } }
               });
          }
     }
}

export const walletService = new WalletService();
