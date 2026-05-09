import { FastifyInstance } from 'fastify';
import prisma from '../database/prisma.js';

export async function userRoutes(fastify: FastifyInstance) {
     fastify.get('/me', { preHandler: [(fastify as any).authenticate] }, async (request, reply) => {
          const userId = (request.user as any).userId;
          const user = await prisma.user.findUnique({
               where: { id: userId },
               select: { id: true, email: true, createdAt: true },
          });
          return user;
     });
}
