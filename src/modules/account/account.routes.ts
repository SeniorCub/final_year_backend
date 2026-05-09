import { FastifyInstance } from 'fastify';
import { accountService } from './account.service.js';
import { z } from 'zod';

const depositSchema = z.object({
     amount: z.number().positive(),
});

export async function accountRoutes(fastify: FastifyInstance) {
     fastify.addHook('preHandler', (fastify as any).authenticate);

     fastify.get('/', async (request) => {
          const userId = (request.user as any).userId;
          return await accountService.getAccount(userId);
     });

     fastify.get('/balance', async (request) => {
          const userId = (request.user as any).userId;
          const account = await accountService.getAccount(userId);
          return { balance: account.balance };
     });

     fastify.post('/deposit', async (request, reply) => {
          const userId = (request.user as any).userId;
          const { amount } = depositSchema.parse(request.body);
          const account = await accountService.deposit(userId, amount);
          return { message: 'Deposit successful', balance: account.balance };
     });
}
