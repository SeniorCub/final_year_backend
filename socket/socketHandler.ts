import { Server, Socket } from 'socket.io';

/**
 * Socket.IO handler
 * Centralises all socket event registration.
 * @param io - The Socket.IO server instance
 */
const socketHandler = (io: Server): void => {
     io.on('connection', (socket: Socket) => {
          console.log(`[Socket.IO] Client connected: ${socket.id}`);

          // ── Join a personal room (used for DMs / notifications) ──────────────
          socket.on('join', (userId: string | number) => {
               if (userId) {
                    socket.join(userId.toString());
                    console.log(`[Socket.IO] User ${userId} joined their room`);
               }
          });

          // ── Join a group room ────────────────────────────────────────────────
          socket.on('joinGroup', (groupId: string | number) => {
               if (groupId) {
                    socket.join(`group:${groupId}`);
                    console.log(`[Socket.IO] Socket ${socket.id} joined group room: group:${groupId}`);
               }
          });

          // ── Leave a group room ───────────────────────────────────────────────
          socket.on('leaveGroup', (groupId: string | number) => {
               if (groupId) {
                    socket.leave(`group:${groupId}`);
                    console.log(`[Socket.IO] Socket ${socket.id} left group room: group:${groupId}`);
               }
          });

          // ── Send a direct message ────────────────────────────────────────────
          socket.on('sendMessage', (data: { receiverId: string | number; message: any }) => {
               const { receiverId, message } = data || {};
               if (receiverId && message) {
                    io.to(receiverId.toString()).emit('newMessage', message);
               }
          });

          // ── Send a group message ─────────────────────────────────────────────
          socket.on('sendGroupMessage', (data: { groupId: string | number; message: any }) => {
               const { groupId, message } = data || {};
               if (groupId && message) {
                    io.to(`group:${groupId}`).emit('newGroupMessage', message);
               }
          });

          // ── Typing indicator ─────────────────────────────────────────────────
          socket.on('typing', ({ receiverId, userId }: { receiverId: string | number; userId: string | number }) => {
               if (receiverId) {
                    io.to(receiverId.toString()).emit('typing', { userId });
               }
          });

          socket.on('stopTyping', ({ receiverId, userId }: { receiverId: string | number; userId: string | number }) => {
               if (receiverId) {
                    io.to(receiverId.toString()).emit('stopTyping', { userId });
               }
          });

          // ── Disconnect ───────────────────────────────────────────────────────
          socket.on('disconnect', () => {
               console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
          });
     });
};

export default socketHandler;
