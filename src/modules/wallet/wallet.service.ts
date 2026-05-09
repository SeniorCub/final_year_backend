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

          // Create Ethereum Wallet
          const { publicKey, privateKey } = await ethereumService.createWallet();
          const encryptedPrivateKey = encrypt(privateKey);

          const wallet = await prisma.wallet.create({
               data: {
                    userId,
                    publicKey,
                    encryptedPrivateKey,
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
          const ethBalance = await ethereumService.getBalance(wallet.publicKey);
          
          return {
               publicKey: wallet.publicKey,
               eth: ethBalance,
          };
     }

     async getDecryptedPrivateKey(userId: string) {
          const wallet = await this.getWallet(userId);
          return decrypt(wallet.encryptedPrivateKey);
     }
}

export const walletService = new WalletService();
