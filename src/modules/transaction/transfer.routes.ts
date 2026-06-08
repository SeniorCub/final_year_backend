import { FastifyInstance } from 'fastify';
import { accountService } from '../account/account.service.js';
import { ethereumService } from '../blockchain/ethereum.service.js';
import { walletService } from '../wallet/wallet.service.js';
import { z } from 'zod';

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
               const txData = await ethereumService.generateTransactionData(
                   'TRANSFER',
                   'deposit',
                   [amount],
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
               const txData = await ethereumService.generateTransactionData(
                   'TRANSFER',
                   'withdraw',
                   [amount],
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

          try {
               const txData = await ethereumService.generateTransactionData(
                   'TRANSFER',
                   'transfer',
                   [recipientAddress, amount],
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
}
