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
          const solBalance = await solanaService.getTokenBalance(wallet.solPublicKey);
          
          return {
               ethPublicKey: wallet.ethPublicKey,
               solPublicKey: wallet.solPublicKey,
               eth: ethBalance,
               sol: solBalance,
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
}

export const walletService = new WalletService();
