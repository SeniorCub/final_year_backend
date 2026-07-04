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
               // Try to resolve by email, exact fullName, or username
               const user = await prisma.user.findFirst({
                    where: {
                         OR: [
                              { email: recipientAddress },
                              { fullName: recipientAddress },
                              { username: recipientAddress }
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
               await bridgeService.withdrawToBlockchain(userId, amount); // Mock deducting bank balance
               return reply.send({ success: true, message: `Successfully sent ₦${amount} to ${accountNumber} (${bankName})` });
          } catch (error: any) {
               return reply.code(400).send({ error: error.message || 'Transfer failed' });
          }
     });
}
