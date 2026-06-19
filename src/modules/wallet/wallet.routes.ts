import { FastifyInstance } from 'fastify';
import { walletService } from './wallet.service.js';

export async function walletRoutes(fastify: FastifyInstance) {
     fastify.addHook('preHandler', (fastify as any).authenticate);

     fastify.get('/', async (request) => {
          const userId = (request.user as any).userId;
          const wallet = await walletService.getWallet(userId);
          return {
               ...wallet,
               publicKey: wallet.solPublicKey
          };
     });

     fastify.get('/balance', async (request) => {
          const userId = (request.user as any).userId;
          return await walletService.getBalance(userId);
     });

     fastify.post('/create', async (request) => {
          const userId = (request.user as any).userId;
          return await walletService.createWallet(userId);
     });
}
