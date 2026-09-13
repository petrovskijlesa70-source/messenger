import { Router, Response } from 'express';
import prisma from '../prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/:chatId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { chatId } = req.params;
    const { limit = 50, before } = req.query;

    // Check if user is member of chat
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        members: true,
      },
    });

    if (!chat) {
      res.status(404).json({ error: 'Chat not found' });
      return;
    }

    const isMember = chat.members.some((m) => m.userId === req.userId);

    if (!isMember) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const messages = await prisma.message.findMany({
      where: {
        chatId,
        ...(before && { createdAt: { lt: new Date(before as string) } }),
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
      orderBy: {
        createdAt: 'desc',
      },
      take: Number(limit),
    });

    res.json(messages.reverse());
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
