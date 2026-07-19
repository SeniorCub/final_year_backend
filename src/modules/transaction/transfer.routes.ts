import { FastifyInstance } from 'fastify';
import { accountService } from '../account/account.service.js';
import { ethereumService } from '../blockchain/ethereum.service.js';
import { walletService } from '../wallet/wallet.service.js';
import { bridgeService } from '../bridge/bridge.service.js';
import prisma from '../database/prisma.js';
import { z } from 'zod';
import { ethers } from 'ethers';

const ethActionSchema = z.object({
     amount: z.string(),
     fromAddress: z.string().optional(),
});

const ethP2PSchema = z.object({
     recipientAddress: z.string(),
     amount: z.string(),
     fromAddress: z.string().optional(),
});

const ethCreateAccountSchema = z.object({
     fromAddress: z.string().optional(),
}).optional();

const broadcastSchema = z.object({
     signedTx: z.string(),
});

export async function transferRoutes(fastify: FastifyInstance) {
     fastify.addHook('preHandler', (fastify as any).authenticate);

     // 1. Generate Create Account Transaction Data
     fastify.post('/eth/create-account', async (request, reply) => {
          const userId = (request.user as any).userId;
          const body = ethCreateAccountSchema.parse(request.body) || {};
          
          let fromAddress = body.fromAddress;
          if (!fromAddress) {
               const wallet = await walletService.getWallet(userId);
               fromAddress = wallet.ethPublicKey;
          }

          try {
               const txData = await ethereumService.generateTransactionData(
                   'ACCOUNT',
                   'createAccount',
                   [],
                   fromAddress
               );
               return txData;
          } catch (error: any) {
               return reply.code(400).send({ error: error.message });
          }
     });

     // 2. Generate Deposit Transaction Data
     fastify.post('/eth/deposit', async (request, reply) => {
          const userId = (request.user as any).userId;
          const { amount, fromAddress: providedAddress } = ethActionSchema.parse(request.body);
          
          let fromAddress = providedAddress;
          if (!fromAddress) {
               const wallet = await walletService.getWallet(userId);
               fromAddress = wallet.ethPublicKey;
          }

          try {
               const amountWei = ethers.parseEther(amount).toString();
               const txData = await ethereumService.generateTransactionData(
                   'TRANSFER',
                   'deposit',
                   [amountWei],
                   fromAddress
               );
               return txData;
          } catch (error: any) {
               return reply.code(400).send({ error: error.message });
          }
     });

     // 3. Generate Withdraw Transaction Data
     fastify.post('/eth/withdraw', async (request, reply) => {
          const userId = (request.user as any).userId;
          const { amount, fromAddress: providedAddress } = ethActionSchema.parse(request.body);
          
          let fromAddress = providedAddress;
          if (!fromAddress) {
               const wallet = await walletService.getWallet(userId);
               fromAddress = wallet.ethPublicKey;
          }

          try {
               const amountWei = ethers.parseEther(amount).toString();
               const txData = await ethereumService.generateTransactionData(
                   'TRANSFER',
                   'withdraw',
                   [amountWei],
                   fromAddress
               );
               return txData;
          } catch (error: any) {
               return reply.code(400).send({ error: error.message });
          }
     });

     // 4. Generate P2P Transfer Transaction Data
     fastify.post('/eth/p2p', async (request, reply) => {
          const userId = (request.user as any).userId;
          const { recipientAddress, amount, fromAddress: providedAddress } = ethP2PSchema.parse(request.body);
          
          let fromAddress = providedAddress;
          if (!fromAddress) {
               const wallet = await walletService.getWallet(userId);
               fromAddress = wallet.ethPublicKey;
          }

          let resolvedRecipientAddress = recipientAddress;
          if (!ethers.isAddress(recipientAddress)) {
               let query = String(recipientAddress).trim();
               if (!query.startsWith('@') && !query.includes('@')) {
                    query = '@' + query;
               }

               const user = await prisma.user.findFirst({
                    where: {
                         OR: [
                              { email: recipientAddress },
                              { fullName: recipientAddress },
                              { username: query }
                         ]
                    },
                    include: { wallet: true }
               });
               
               if (!user || !user.wallet) {
                    return reply.code(404).send({ error: 'User not found or has no wallet' });
               }
               resolvedRecipientAddress = user.wallet.ethPublicKey;
          }

          try {
               const amountWei = ethers.parseEther(amount).toString();
               const txData = await ethereumService.generateTransactionData(
                   'TRANSFER',
                   'transfer',
                   [resolvedRecipientAddress, amountWei],
                   fromAddress
               );
               return txData;
          } catch (error: any) {
               return reply.code(400).send({ error: error.message });
          }
     });

     // 5. Broadcast Signed Transaction
     fastify.post('/eth/broadcast', async (request, reply) => {
          try {
               const { signedTx } = broadcastSchema.parse(request.body);
               
               if (signedTx.includes('YourSignedTransactionHexHere')) {
                    return reply.code(400).send({ 
                         error: 'Invalid Transaction', 
                         message: 'You are using a placeholder string from Postman. You must provide a real signed transaction hex.' 
                    });
               }

               const txHash = await ethereumService.broadcastTransaction(signedTx);
               return { txHash, status: 'confirmed', message: 'Transaction broadcasted and pending consensus.' };
          } catch (error: any) {
               fastify.log.error(error);
               return reply.code(400).send({ 
                    error: error.name || 'Broadcast Error', 
                    message: error.message || 'Failed to broadcast transaction. Ensure the hex is valid and signed correctly.' 
               });
          }
     });

     // 6. Manual Sync for Simulated Transactions (Demo Environment)
     fastify.post('/eth/simulate-sync', async (request, reply) => {
          const userId = (request.user as any).userId;
          const body = request.body as any;
          if (!body.hash) {
               return reply.code(400).send({ error: 'Transaction hash is required.' });
          }

          const wallet = await walletService.getWallet(userId);
          
          if (body.type === 'DEPOSIT') {
               await bridgeService.syncEthereumAction('DEPOSIT', wallet.ethPublicKey, body.amount, body.hash);
          } else if (body.type === 'WITHDRAW') {
               await bridgeService.syncEthereumAction('WITHDRAW', wallet.ethPublicKey, body.amount, body.hash);
          }
          
          return { success: true, message: 'Simulated transaction synced to ledger.' };
     });

     // 7. Get List of Banks from Paystack
     fastify.get('/banks', async (request, reply) => {
          try {
               const response = await fetch('https://api.paystack.co/bank?country=nigeria', {
                    headers: {
                         'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY || 'sk_test_12345'}`
                    }
               });
               const data = await response.json();
               if (!data.status) throw new Error(data.message);
               return reply.send({ success: true, banks: data.data });
          } catch (error: any) {
               return reply.code(400).send({ error: error.message || 'Failed to fetch banks' });
          }
     });

     // 8. Verify Bank Account
     fastify.post('/verify-account', async (request, reply) => {
          const { accountNumber, bankCode } = request.body as { accountNumber: string, bankCode: string };
          try {
               const response = await fetch(`https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`, {
                    headers: {
                         'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY || 'sk_test_12345'}`
                    }
               });
               const data = await response.json();
               if (!data.status) throw new Error(data.message);
               return reply.send({ success: true, accountName: data.data.account_name });
          } catch (error: any) {
               return reply.code(400).send({ error: error.message || 'Failed to verify account' });
          }
     });

     // 9. Send to Bank
     fastify.post('/bank-transfer', { preHandler: [(fastify as any).authenticate] }, async (request, reply) => {
          const userId = (request.user as any).userId;
          const { amount, accountNumber, bankCode, bankName } = request.body as { amount: number, accountNumber: string, bankCode: string, bankName: string };
          
          try {
               // Mock deducting bank balance for a local bank transfer
               await prisma.$transaction(async (tx) => {
                    const account = await tx.account.findUnique({ where: { userId } });
                    if (!account || account.balance.toNumber() < amount) {
                         throw new Error('Insufficient bank balance');
                    }
                    await tx.account.update({
                         where: { userId },
                         data: { balance: { decrement: amount } },
                    });
                    await tx.ledgerEntry.create({
                         data: {
                              userId,
                              type: 'WITHDRAW',
                              amount,
                              reference: `BANK-${Date.now()}-${accountNumber.slice(-4)}`,
                              status: 'COMPLETED',
                              metadata: { bankCode, bankName, accountNumber }
                         }
                    });
               });
               return reply.send({ success: true, message: `Successfully sent ₦${amount} to ${accountNumber} (${bankName})` });
          } catch (error: any) {
               return reply.code(400).send({ error: error.message || 'Transfer failed' });
          }
     });

     // 10. Native P2P Fiat Transfer (cNGN internal)
     fastify.post('/p2p', { preHandler: [(fastify as any).authenticate] }, async (request, reply) => {
          const senderId = (request.user as any).userId;
          const { recipientUsername, amount, note } = request.body as { recipientUsername: string, amount: number, note?: string };

          if (amount <= 0) {
               return reply.code(400).send({ error: 'Invalid amount' });
          }

          try {
               let query = recipientUsername.trim();
               if (!query.startsWith('@') && !query.includes('@')) {
                    query = '@' + query;
               }

               const recipientUser = await prisma.user.findFirst({
                    where: {
                         OR: [
                              { username: query },
                              { username: recipientUsername.trim() },
                              { email: recipientUsername.trim() }
                         ]
                    }
               });

               if (!recipientUser) {
                    return reply.code(404).send({ error: 'Recipient not found' });
               }

               if (recipientUser.id === senderId) {
                    return reply.code(400).send({ error: 'Cannot send money to yourself' });
               }

               const sendRef = `P2P-SEND-${Date.now()}`;

               await prisma.$transaction(async (tx) => {
                    const senderUser = await tx.user.findUnique({ where: { id: senderId } });
                    if (!senderUser) {
                         throw new Error('Sender not found');
                    }
                    
                    const senderAccount = await tx.account.findUnique({ where: { userId: senderId } });
                    if (!senderAccount || senderAccount.balance.toNumber() < amount) {
                         throw new Error('Insufficient balance');
                    }

                    // Deduct from sender
                    await tx.account.update({
                         where: { userId: senderId },
                         data: { balance: { decrement: amount } },
                    });

                    // Add to recipient
                    await tx.account.update({
                         where: { userId: recipientUser.id },
                         data: { balance: { increment: amount } },
                    });

                    // Sender Ledger Entry
                    await tx.ledgerEntry.create({
                         data: {
                              userId: senderId,
                              type: 'WITHDRAW',
                              amount,
                              reference: sendRef,
                              status: 'COMPLETED',
                              metadata: { recipientId: recipientUser.id, recipientUsername: recipientUser.username || recipientUser.fullName || recipientUser.email, note }
                         }
                    });

                    // Recipient Ledger Entry
                    await tx.ledgerEntry.create({
                         data: {
                              userId: recipientUser.id,
                              type: 'DEPOSIT',
                              amount,
                              reference: `P2P-RECV-${Date.now()}`,
                              status: 'COMPLETED',
                              metadata: { senderId, senderUsername: senderUser.username || senderUser.fullName || senderUser.email, note }
                         }
                    });
               });

               return reply.send({ success: true, message: `Successfully sent ₦${amount} to ${recipientUser.username}`, reference: sendRef });
          } catch (error: any) {
               return reply.code(400).send({ error: error.message || 'P2P Transfer failed' });
          }
     });
}
