import type { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get user notifications
export const getNotifications = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;

        const notifications = await prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 50 // Limit to recent 50
        });

        res.json({
            success: true,
            notifications
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// Mark notifications as read
export const markAsRead = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const { notificationIds } = req.body;

        if (notificationIds && Array.isArray(notificationIds) && notificationIds.length > 0) {
            // Update specific notifications
            await prisma.notification.updateMany({
                where: {
                    userId,
                    id: { in: notificationIds }
                },
                data: { read: true }
            });
        } else {
            // Mark all as read
            await prisma.notification.updateMany({
                where: { userId, read: false },
                data: { read: true }
            });
        }

        res.json({
            success: true,
            message: 'Notifications marked as read'
        });
    } catch (error) {
        console.error('Error marking notifications as read:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
