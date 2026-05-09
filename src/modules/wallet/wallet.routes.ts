import { FastifyInstance } from 'fastify';
import { walletService } from './wallet.service.js';

export async function walletRoutes(fastify: FastifyInstance) {
     fastify.addHook('preHandler', (fastify as any).authenticate);

     fastify.get('/', async (request) => {
          const userId = (request.user as any).userId;
          return await walletService.getWallet(userId);
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
