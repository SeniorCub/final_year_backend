import { FastifyInstance } from 'fastify';
import { ledgerService } from './ledger.service.js';
import { ethereumService } from '../blockchain/ethereum.service.js';
import { walletService } from '../wallet/wallet.service.js';

export async function ledgerRoutes(fastify: FastifyInstance) {
     fastify.addHook('preHandler', (fastify as any).authenticate);

     fastify.get('/', async (request) => {
          const userId = (request.user as any).userId;
          return await ledgerService.getEntries(userId);
     });

     fastify.get('/blockchain', async (request, reply) => {
          const userId = (request.user as any).userId;
          try {
               const wallet = await walletService.getWallet(userId);
               const history = await ethereumService.getTransactionHistory(wallet.ethPublicKey);
               return history;
          } catch (error: any) {
               return reply.code(400).send({ error: error.message });
          }
     });
}
