import { FastifyInstance } from 'fastify';
import prisma from '../database/prisma.js';

export async function adminRoutes(fastify: FastifyInstance) {
     // In a real app, you'd add an isAdmin check here
     fastify.addHook('preHandler', (fastify as any).authenticate);

     fastify.get('/users', async () => {
          return await prisma.user.findMany({
               include: { account: true, wallet: true },
          });
     });

     fastify.get('/ledger', async () => {
          return await prisma.ledgerEntry.findMany({
               orderBy: { createdAt: 'desc' },
          });
     });

     fastify.get('/transactions', async () => {
          return await prisma.transaction.findMany({
               include: { sender: true, receiver: true },
          });
     });
}
