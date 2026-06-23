import { FastifyInstance } from 'fastify';
import { accountService } from './account.service.js';
import { z } from 'zod';

const depositSchema = z.object({
     amount: z.number().positive(),
});

export async function accountRoutes(fastify: FastifyInstance) {
     // Webhook is unauthenticated (preHandler hook is not added at this root level)
     fastify.post('/deposit/webhook', async (request, reply) => {
          const signature = request.headers['x-paystack-signature'] as string;
          const payload = request.body;
          const success = await accountService.processWebhook(payload, signature);
          if (success) {
               return reply.status(200).send({ success: true, message: 'Webhook processed successfully' });
          }
          return reply.status(400).send({ success: false, message: 'Webhook ignored or signature verification failed' });
     });

     // Authenticated sub-routes
     fastify.register(async (authGroup) => {
          authGroup.addHook('preHandler', (fastify as any).authenticate);

          authGroup.get('/', async (request) => {
               const userId = (request.user as any).userId;
               return await accountService.getAccount(userId);
          });

          authGroup.get('/balance', async (request) => {
               const userId = (request.user as any).userId;
               const account = await accountService.getAccount(userId);
               return { balance: account.balance };
          });

          authGroup.post('/deposit', async (request, reply) => {
               const userId = (request.user as any).userId;
               const { amount } = depositSchema.parse(request.body);
               const result = await accountService.initializeDeposit(userId, amount);
               return { 
                    success: true, 
                    message: 'Deposit initialized', 
                    authorizationUrl: result.authorizationUrl, 
                    reference: result.reference 
               };
          });

          authGroup.get('/deposit/verify/:reference', async (request) => {
               const userId = (request.user as any).userId;
               const { reference } = request.params as { reference: string };
               const account = await accountService.verifyDeposit(userId, reference);
               if (!account) {
                    throw new Error('Account not found');
               }
               return { 
                    success: true, 
                    message: 'Deposit verified and account credited', 
                    balance: account.balance 
               };
          });
     });
}
