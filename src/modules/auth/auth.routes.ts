import { FastifyInstance } from 'fastify';
import { authService } from './auth.service.js';
import { walletService } from '../wallet/wallet.service.js';
import { z } from 'zod';

const registerSchema = z.object({
     email: z.string().email(),
     password: z.string().min(6),
});

const loginSchema = z.object({
     email: z.string().email(),
     password: z.string(),
});

export async function authRoutes(fastify: FastifyInstance) {
     fastify.post('/register', async (request, reply) => {
          const { email, password } = registerSchema.parse(request.body);
          try {
               const user = await authService.register(email, password);

               // Auto-create wallet for new user
               await walletService.createWallet(user.id);

               return reply.code(201).send({ message: 'User registered successfully', userId: user.id });
          } catch (error: any) {
               return reply.code(400).send({ error: error.message });
          }
     });

     fastify.post('/login', async (request, reply) => {
          const { email, password } = loginSchema.parse(request.body);
          try {
               const result = await authService.login(email, password);
               return result;
          } catch (error: any) {
               return reply.code(401).send({ error: error.message });
          }
     });
}
