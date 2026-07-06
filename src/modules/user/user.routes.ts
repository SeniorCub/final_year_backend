import { FastifyInstance } from 'fastify';
import prisma from '../database/prisma.js';

export async function userRoutes(fastify: FastifyInstance) {
     fastify.get('/me', { preHandler: [(fastify as any).authenticate] }, async (request, reply) => {
          const userId = (request.user as any).userId;
          const user = await prisma.user.findUnique({
               where: { id: userId },
               select: { 
                    id: true, 
                    email: true, 
                    createdAt: true,
                    fullName: true,
                    username: true,
                    phone: true,
                    theme: true,
                    kycStatus: true,
                    securityPin: true,
                    tier: true,
                    limit: true,
                    linkedBanks: true,
                    bvn: true,
                    nin: true,
                    address: true
               },
          });
          return user;
     });

     fastify.get('/lookup/:identifier', { preHandler: [(fastify as any).authenticate] }, async (request, reply) => {
          const { identifier } = request.params as { identifier: string };
          let query = identifier.trim();
          if (!query.startsWith('@') && !query.includes('@')) {
               query = '@' + query;
          }
          const user = await prisma.user.findFirst({
               where: {
                    OR: [
                         { username: query },
                         { email: query },
                         { fullName: identifier.trim() }
                    ]
               },
               select: {
                    fullName: true,
                    username: true,
               }
          });
          if (!user) {
               return reply.code(404).send({ error: 'User not found' });
          }
          return { success: true, accountName: user.fullName, username: user.username };
     });

     fastify.post('/profile', { preHandler: [(fastify as any).authenticate] }, async (request, reply) => {
          const userId = (request.user as any).userId;
          const body = request.body as any;
          
          const updateData: any = {};
          if (body.theme) updateData.theme = body.theme;
          if (body.securityPin) updateData.securityPin = body.securityPin;
          if (body.linkedBanks) updateData.linkedBanks = body.linkedBanks;
          if (body.fullName) updateData.fullName = body.fullName;
          if (body.phone) updateData.phone = body.phone;
          if (body.username) {
               // Check if username is already taken by someone else
               const existing = await prisma.user.findFirst({ where: { username: body.username } });
               if (existing && existing.id !== userId) {
                    return reply.code(400).send({ error: 'Username is already taken' });
               }
               updateData.username = body.username;
          }
          
          const user = await prisma.user.update({
               where: { id: userId },
               data: updateData,
               select: { id: true, theme: true, kycStatus: true }
          });
          
          return { success: true, user };
     });
}
