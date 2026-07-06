import { FastifyInstance } from 'fastify';
import prisma from '../database/prisma.js';

export async function notificationRoutes(fastify: FastifyInstance) {
    fastify.addHook('preHandler', (fastify as any).authenticate);

    fastify.get('/', async (request, reply) => {
        const userId = (request.user as any).userId;
        const notifications = await prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
        return { success: true, notifications };
    });

    fastify.post('/read', async (request, reply) => {
        const userId = (request.user as any).userId;
        const body = request.body as { notificationIds?: string[] } | undefined;

        if (body?.notificationIds && body.notificationIds.length > 0) {
            await prisma.notification.updateMany({
                where: {
                    id: { in: body.notificationIds },
                    userId,
                },
                data: { read: true },
            });
        } else {
            // Mark all as read
            await prisma.notification.updateMany({
                where: { userId, read: false },
                data: { read: true },
            });
        }
        return { success: true, message: 'Notifications marked as read' };
    });
}
