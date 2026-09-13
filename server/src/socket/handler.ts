import { Server as SocketIOServer, Socket } from 'socket.io';
import prisma from '../prisma';

interface AuthenticatedSocket extends Socket {
  userId: string;
  username: string;
}

export const handleSocketConnection = (socket: AuthenticatedSocket) => {
  console.log(`User connected: ${socket.username} (${socket.userId})`);

  // Join user's personal room for direct messages
  socket.join(`user:${socket.userId}`);

  // Join all user's chats
  prisma.chatMember
    .findMany({
      where: { userId: socket.userId },
      select: { chatId: true },
    })
    .then((memberships) => {
      memberships.forEach((membership) => {
        socket.join(`chat:${membership.chatId}`);
      });
    });

  // Handle joining a specific chat
  socket.on('join_chat', (chatId: string) => {
    prisma.chatMember
      .findFirst({
        where: {
          chatId,
          userId: socket.userId,
        },
      })
      .then((membership) => {
        if (membership) {
          socket.join(`chat:${chatId}`);
          console.log(`User ${socket.username} joined chat ${chatId}`);
        }
      });
  });

  // Handle leaving a chat
  socket.on('leave_chat', (chatId: string) => {
    socket.leave(`chat:${chatId}`);
    console.log(`User ${socket.username} left chat ${chatId}`);
  });

  // Handle sending a message
  socket.on('send_message', async (data: { chatId: string; text: string }) => {
    try {
      const { chatId, text } = data;

      if (!text || text.trim().length === 0) {
        socket.emit('error', { message: 'Message cannot be empty' });
        return;
      }

      // Verify user is member of chat
      const membership = await prisma.chatMember.findFirst({
        where: {
          chatId,
          userId: socket.userId,
        },
      });

      if (!membership) {
        socket.emit('error', { message: 'Not a member of this chat' });
        return;
      }

      // Create message
      const message = await prisma.message.create({
        data: {
          chatId,
          senderId: socket.userId,
          text: text.trim(),
        },
        include: {
          sender: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
        },
      });

      // Emit to all members of the chat
      socket.to(`chat:${chatId}`).emit('new_message', message);
      socket.emit('new_message', message);

      console.log(`Message sent in chat ${chatId} by ${socket.username}`);
    } catch (error) {
      console.error('Send message error:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Handle typing indicator
  socket.on('typing', (data: { chatId: string }) => {
    socket.to(`chat:${data.chatId}`).emit('user_typing', {
      userId: socket.userId,
      username: socket.username,
    });
  });

  socket.on('stop_typing', (data: { chatId: string }) => {
    socket.to(`chat:${data.chatId}`).emit('user_stop_typing', {
      userId: socket.userId,
    });
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.username} (${socket.userId})`);

    // Update last seen
    prisma.user
      .update({
        where: { id: socket.userId },
        data: { lastSeen: new Date() },
      })
      .catch((error) => {
        console.error('Error updating last seen:', error);
      });
  });
};
