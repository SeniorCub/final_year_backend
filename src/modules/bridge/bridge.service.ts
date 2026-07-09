import prisma from '../database/prisma.js';
import { solanaService } from '../blockchain/solana.service.js';
import { walletService } from '../wallet/wallet.service.js';
import { LedgerEntryType, Prisma } from '@prisma/client';
import dotenv from 'dotenv';
import bs58 from 'bs58';

dotenv.config();

const SYSTEM_WALLET_PRIVATE_KEY = process.env.SYSTEM_WALLET_PRIVATE_KEY;

export class BridgeService {
     /**
      * Withdraw from Bank to Blockchain
      * Deducts PostgreSQL balance and sends cNGN SPL tokens to user's Solana wallet
      */
     async withdrawToBlockchain(userId: string, amount: number, targetAddress?: string, chain?: string) {
          // We will mock the transfer if SYSTEM_WALLET_PRIVATE_KEY is missing instead of failing
          // if (!SYSTEM_WALLET_PRIVATE_KEY) {
          //      throw new Error('System wallet not configured');
          // }

          const reference = `BCW-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

          return await prisma.$transaction(async (tx) => {
               // 1. Check & Deduct Bank Balance
               const account = await tx.account.findUnique({ where: { userId } });
               if (!account || account.balance.toNumber() < amount) {
                    throw new Error('Insufficient bank balance');
               }

               let destinationWallet = targetAddress;
               if (!destinationWallet) {
                    const wallet = await tx.wallet.findUnique({ where: { userId } });
                    if (!wallet) {
                         throw new Error('User blockchain wallet not found. Please provide a destination address.');
                    }
                    destinationWallet = chain === 'ethereum' ? wallet.ethPublicKey : wallet.solPublicKey;
               }

               await tx.account.update({
                    where: { userId },
                    data: { balance: { decrement: amount } },
               });

               // 2. Create Ledger Entry (Pending)
               const ledger = await tx.ledgerEntry.create({
                    data: {
                         userId,
                         type: LedgerEntryType.BLOCKCHAIN_WITHDRAW,
                         amount,
                         reference,
                         status: 'PENDING',
                         metadata: { toWallet: destinationWallet, chain },
                    },
               });

               // 3. Initiate Transfer
               try {
                    let signature = 'mock_signature_' + Date.now();
                    if (SYSTEM_WALLET_PRIVATE_KEY && chain !== 'ethereum') {
                         signature = await solanaService.transferToken(
                              SYSTEM_WALLET_PRIVATE_KEY,
                              destinationWallet,
                              amount
                         );
                    } else {
                         // Simulate network delay
                         await new Promise(res => setTimeout(res, 2000));
                         console.log(`[MOCK] Transferred ${amount} cNGN to ${wallet.solPublicKey}`);
                    }

                    // 4. Update Ledger Entry (Completed)
                    await tx.ledgerEntry.update({
                         where: { id: ledger.id },
                         data: {
                              status: 'COMPLETED',
                              metadata: { ...ledger.metadata as object, signature },
                         },
                    });

                    return { success: true, signature, reference };
               } catch (error: any) {
                    console.error('Blockchain transfer failed:', error);
                    // In a real system, you'd want to handle rollbacks or manual reconciliation
                    throw new Error(`Blockchain transfer failed: ${error.message}`);
               }
          });
     }

     /**
      * Deposit from Blockchain to Bank
      * This is typically called by a background worker after detecting an on-chain transfer
      */
     async depositToBank(walletAddress: string, amount: number, signature: string) {
          const reference = `BCD-${Date.now()}-${signature.slice(0, 8)}`;

          const wallet = await prisma.wallet.findUnique({
               where: { solPublicKey: walletAddress },
               include: { user: true },
          });

          if (!wallet) {
               console.error(`Received deposit for unknown wallet: ${walletAddress}`);
               return;
          }

          return await prisma.$transaction(async (tx) => {
               // Check if reference/signature already processed to prevent double spending
               const existingEntry = await tx.ledgerEntry.findUnique({
                    where: { reference },
               });
               if (existingEntry) return;

               // 1. Credit Bank Balance
               await tx.account.update({
                    where: { userId: wallet.userId },
                    data: { balance: { increment: amount } },
               });

               // 2. Create Ledger Entry
               await tx.ledgerEntry.create({
                    data: {
                         userId: wallet.userId,
                         type: LedgerEntryType.BLOCKCHAIN_DEPOSIT,
                         amount,
                         reference,
                         status: 'COMPLETED',
                         metadata: { fromWallet: walletAddress, signature },
                    },
               });

               console.log(`Successfully credited user ${wallet.userId} with ${amount} cNGN from blockchain`);
          });
     }

     /**
      * Sync Ethereum P2P Transfers to the Ledger
      */
     async syncEthereumTransfer(senderWallet: string, recipientWallet: string, amount: string, hash: string) {
          const reference = `ETH-P2P-${hash.slice(0, 10)}`;

          const [sender, recipient] = await Promise.all([
               prisma.wallet.findUnique({ where: { ethPublicKey: senderWallet }, include: { user: true } }),
               prisma.wallet.findUnique({ where: { ethPublicKey: recipientWallet }, include: { user: true } })
          ]);

          return await prisma.$transaction(async (tx) => {
               const existing = await tx.ledgerEntry.findUnique({ where: { reference } });
               if (existing) return;

               const numericAmount = parseFloat(amount); // Simplified for prototype

               if (sender) {
                    // Update sender's bank balance to reflect on-chain transfer
                    await tx.account.update({
                         where: { userId: sender.userId },
                         data: { balance: { decrement: numericAmount } }
                    });

                    await tx.ledgerEntry.create({
                         data: {
                              userId: sender.userId,
                              type: LedgerEntryType.TRANSFER,
                              amount: -numericAmount,
                              reference: `${reference}-S`,
                              status: 'COMPLETED',
                              metadata: { to: recipientWallet, hash, blockchain: 'ethereum' }
                         }
                    });
               }

               if (recipient) {
                    // Update recipient's bank balance
                    await tx.account.update({
                         where: { userId: recipient.userId },
                         data: { balance: { increment: numericAmount } }
                    });

                    await tx.ledgerEntry.create({
                         data: {
                              userId: recipient.userId,
                              type: LedgerEntryType.TRANSFER,
                              amount: numericAmount,
                              reference: `${reference}-R`,
                              status: 'COMPLETED',
                              metadata: { from: senderWallet, hash, blockchain: 'ethereum' }
                         }
                    });
               }
          });
     }

     /**
      * Sync Ethereum Deposits/Withdrawals to the Ledger and Balance
      */
     async syncEthereumAction(type: 'DEPOSIT' | 'WITHDRAW', walletAddress: string, amount: string, hash: string) {
          const reference = `ETH-${type}-${hash.slice(0, 10)}`;
          const ledgerType = type === 'DEPOSIT' ? LedgerEntryType.BLOCKCHAIN_DEPOSIT : LedgerEntryType.BLOCKCHAIN_WITHDRAW;

          const wallet = await prisma.wallet.findUnique({
               where: { ethPublicKey: walletAddress },
               include: { user: true },
          });

          if (!wallet) return;

          return await prisma.$transaction(async (tx) => {
               const existing = await tx.ledgerEntry.findUnique({ where: { reference } });
               if (existing) return;

               const numericAmount = parseFloat(amount);

               // Update Bank Balance
               if (type === 'DEPOSIT') {
                    await tx.account.update({
                         where: { userId: wallet.userId },
                         data: { balance: { increment: numericAmount } }
                    });
               } else {
                    await tx.account.update({
                         where: { userId: wallet.userId },
                         data: { balance: { decrement: numericAmount } }
                    });
               }

               await tx.ledgerEntry.create({
                    data: {
                         userId: wallet.userId,
                         type: ledgerType,
                         amount: numericAmount,
                         reference,
                         status: 'COMPLETED',
                         metadata: { hash, blockchain: 'ethereum' }
                    }
               });
          });
     }
}

export const bridgeService = new BridgeService();
