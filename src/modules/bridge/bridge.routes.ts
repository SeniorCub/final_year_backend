import { FastifyInstance } from 'fastify';
import { bridgeService } from './bridge.service.js';
import { z } from 'zod';

const withdrawSchema = z.object({
     amount: z.number().positive(),
});

export async function bridgeRoutes(fastify: FastifyInstance) {
     fastify.addHook('preHandler', (fastify as any).authenticate);

     /**
      * Get Bridge Configuration
      * Returns the system wallet address where users should send tokens to deposit into the bank
      */
     fastify.get('/config', async () => {
          return {
               systemWalletAddress: process.env.SYSTEM_WALLET_PUBLIC_KEY,
               tokenMintAddress: process.env.CNGN_TOKEN_ADDRESS,
               network: 'Solana Devnet',
               instructions: 'To deposit into your bank account, send cNGN tokens to the system wallet address. The blockchain monitor will automatically credit your account.'
          };
     });

     /**
      * Withdraw Bank Balance to Blockchain Wallet (cNGN)
      */
     fastify.post('/withdraw', async (request, reply) => {
          const userId = (request.user as any).userId;
          const { amount } = withdrawSchema.parse(request.body);

          try {
               const result = await bridgeService.withdrawToBlockchain(userId, amount);
               return result;
          } catch (error: any) {
               return reply.code(400).send({ error: error.message });
          }
     });
}
