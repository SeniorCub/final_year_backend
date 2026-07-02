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
                    phone: true,
                    theme: true,
                    kycStatus: true,
                    securityPin: true,
                    tier: true,
                    limit: true,
                    linkedBanks: true
               },
          });
          return user;
     });

     fastify.post('/profile', { preHandler: [(fastify as any).authenticate] }, async (request, reply) => {
          const userId = (request.user as any).userId;
          const body = request.body as any;
          
          const updateData: any = {};
          if (body.theme) updateData.theme = body.theme;
          if (body.securityPin) updateData.securityPin = body.securityPin;
          if (body.linkedBanks) updateData.linkedBanks = body.linkedBanks;
          
          const user = await prisma.user.update({
               where: { id: userId },
               data: updateData,
               select: { id: true, theme: true, kycStatus: true }
          });
          
          return { success: true, user };
     });
}
