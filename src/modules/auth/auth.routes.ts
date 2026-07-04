import { FastifyInstance } from 'fastify';
import { authService } from './auth.service.js';
import { walletService } from '../wallet/wallet.service.js';
import { z } from 'zod';

const registerSchema = z.object({
     email: z.string().email(),
     password: z.string().min(6),
     fullName: z.string(),
     phone: z.string(),
     username: z.string()
});

const loginSchema = z.object({
     email: z.string().email(),
     password: z.string(),
});

export async function authRoutes(fastify: FastifyInstance) {
     fastify.post('/register', async (request, reply) => {
          const { email, password, fullName, phone, username } = registerSchema.parse(request.body);
          try {
               const user = await authService.register(email, password, fullName, phone, username);
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

     fastify.post('/logout', async (request, reply) => {
          // Clear cookie manually by setting expired header (no dependency on @fastify/cookie)
          reply.header('Set-Cookie', `token=; Path=/; HttpOnly; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; ${process.env.NODE_ENV === 'production' ? 'Secure;' : ''} SameSite=Strict`);
          return { success: true, message: 'Logged out successfully' };
     });
}
