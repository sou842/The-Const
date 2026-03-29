/**
 * src/lib/socketServer.ts
 * Socket.io server-side logic — auth, presence, messaging, typing.
 *
 * Called once from server.js to attach to the shared HTTP server.
 */

import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { jwtVerify } from 'jose';
import mongoose from 'mongoose';
import connectDB from './db.js';
import { encryptMessage, sanitizeMessage, decryptMessage } from './crypto.js';

// Inline these to avoid circular deps from Next.js module system
const COOKIE_NAME = 'tc_session';
const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'THECONST');

// In-memory presence map: userId → Set<socketId>
// Using a Set supports multi-tab / multi-device presence naturally
const onlineUsers = new Map<string, Set<string>>();

// Per-user rate limiting: userId → { count, resetAt }
const rateLimits = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 30; // messages per window
const RATE_WINDOW_MS = 10_000; // 10 seconds

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimits.get(userId);

  if (!entry || now > entry.resetAt) {
    rateLimits.set(userId, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

async function verifySession(cookieHeader: string | undefined): Promise<{ userId: string; name: string } | null> {
  if (!cookieHeader) return null;
  const cookies = Object.fromEntries(
    cookieHeader.split(';').map((c) => {
      const [k, ...v] = c.trim().split('=');
      return [k, v.join('=')];
    })
  );
  const token = cookies[COOKIE_NAME];
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return { userId: payload.userId as string, name: payload.name as string };
  } catch {
    return null;
  }
}

export function initSocketServer(httpServer: HTTPServer): SocketIOServer {
  const io = new SocketIOServer(httpServer, {
    cors: { origin: false }, // same-origin — no CORS needed
    transports: ['websocket', 'polling'],
  });

  // Attach to global to make io accessible in API routes
  (global as any).io = io;

  // ─── Auth Middleware ────────────────────────────────────────────────────────
  // Runs on every socket connection BEFORE any events are processed
  io.use(async (socket, next) => {
    const cookieHeader = socket.handshake.headers.cookie;
    const session = await verifySession(cookieHeader);
    if (!session) {
      return next(new Error('Unauthorized: invalid or missing session'));
    }
    // Attach verified identity to socket
    socket.data.userId = session.userId;
    socket.data.name = session.name;
    next();
  });

  // ─── Connection ─────────────────────────────────────────────────────────────
  io.on('connection', async (socket: Socket) => {
    const userId: string = socket.data.userId;

    await connectDB();

    // Track presence — add this socket to the user's set
    if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
    onlineUsers.get(userId)!.add(socket.id);

    // Join a personal room so the server can push direct notifications
    socket.join(`user:${userId}`);

    // Broadcast online status to everyone
    socket.broadcast.emit('user:status', { userId, online: true });

    // ── join-conversation ──────────────────────────────────────────────────
    // Client joins a room to receive messages for a specific conversation
    socket.on('join-conversation', async (conversationId: string) => {
      if (!mongoose.Types.ObjectId.isValid(conversationId)) return;
      socket.join(`conv:${conversationId}`);
    });

    // ── message:send ──────────────────────────────────────────────────────
    socket.on(
      'message:send',
      async (data: { conversationId: string; content: string }, ack?: (res: { ok: boolean; messageId?: string; error?: string }) => void) => {
        try {
          if (!checkRateLimit(userId)) {
            ack?.({ ok: false, error: 'Rate limit exceeded. Slow down.' });
            return;
          }

          if (!data?.conversationId || !data?.content?.trim()) {
            ack?.({ ok: false, error: 'Invalid payload' });
            return;
          }

          // Dynamic import to stay within ES module scope
          const { Conversation } = await import('../models/Conversation.js');
          const { Message } = await import('../models/Message.js');

          // Verify sender is a participant
          const conversation = await Conversation.findById(data.conversationId);
          if (!conversation) { ack?.({ ok: false, error: 'Conversation not found' }); return; }

          const senderId = new mongoose.Types.ObjectId(userId);
          const isParticipant = conversation.participants.some(
            (p: mongoose.Types.ObjectId) => p.equals(senderId)
          );
          if (!isParticipant) { ack?.({ ok: false, error: 'Forbidden' }); return; }

          // Sanitize → Encrypt → Save
          const sanitized = sanitizeMessage(data.content);
          if (!sanitized) { ack?.({ ok: false, error: 'Empty message' }); return; }

          const { ciphertext, iv, authTag } = encryptMessage(sanitized);
          const message = await Message.create({
            conversationId: data.conversationId,
            senderId,
            content: ciphertext,
            iv,
            authTag,
            deliveredAt: null,
            readAt: null,
          });

          // Update conversation metadata
          const otherParticipant = conversation.participants.find(
            (p: mongoose.Types.ObjectId) => !p.equals(senderId)
          );
          const unreadKey = otherParticipant?.toString();
          const currentUnread = (conversation.unreadCount as Map<string, number>).get(unreadKey) || 0;
          conversation.lastMessage = sanitized.length > 80 ? sanitized.slice(0, 80) + '…' : sanitized;
          conversation.lastActivity = new Date();
          (conversation.unreadCount as Map<string, number>).set(unreadKey, currentUnread + 1);
          conversation.markModified('unreadCount');
          await conversation.save();

          // Build the outgoing payload (plaintext — TLS handles transit)
          const outgoingMessage = {
            _id: message._id,
            conversationId: data.conversationId,
            senderId: userId,
            senderName: socket.data.name,
            content: sanitized, // plaintext for real-time delivery
            readAt: null,
            deliveredAt: null,
            createdAt: message.createdAt,
          };

          // Broadcast to ALL room participants (including sender's other devices)
          io.to(`conv:${data.conversationId}`).emit('message:new', outgoingMessage);

          ack?.({ ok: true, messageId: message._id.toString() });
        } catch (err) {
          console.error('message:send error:', err);
          ack?.({ ok: false, error: 'Server error' });
        }
      }
    );

    // ── typing:start ─────────────────────────────────────────────────────
    socket.on('typing:start', (conversationId: string) => {
      socket.to(`conv:${conversationId}`).emit('typing:update', {
        conversationId,
        userId,
        isTyping: true,
      });
    });

    // ── typing:stop ──────────────────────────────────────────────────────
    socket.on('typing:stop', (conversationId: string) => {
      socket.to(`conv:${conversationId}`).emit('typing:update', {
        conversationId,
        userId,
        isTyping: false,
      });
    });

    // ── message:read ─────────────────────────────────────────────────────
    socket.on('message:read', async (data: { conversationId: string; messageId: string }) => {
      try {
        const { Message } = await import('../models/Message.js');
        const { Conversation } = await import('../models/Conversation.js');

        await Message.updateMany(
          {
            conversationId: data.conversationId,
            senderId: { $ne: new mongoose.Types.ObjectId(userId) },
            readAt: null,
          },
          { $set: { readAt: new Date() } }
        );

        // Reset unread count for this user
        const conv = await Conversation.findById(data.conversationId);
        if (conv) {
          (conv.unreadCount as Map<string, number>).set(userId, 0);
          conv.markModified('unreadCount');
          await conv.save();
        }

        // Notify sender their message was read
        socket.to(`conv:${data.conversationId}`).emit('message:read-ack', {
          conversationId: data.conversationId,
          readBy: userId,
          readAt: new Date(),
        });
      } catch (err) {
        console.error('message:read error:', err);
      }
    });

    // ── disconnect ────────────────────────────────────────────────────────
    socket.on('disconnect', () => {
      const userSockets = onlineUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        // Only mark offline if NO other tabs/devices remain
        if (userSockets.size === 0) {
          onlineUsers.delete(userId);
          io.emit('user:status', { userId, online: false });
        }
      }
    });
  });

  return io;
}
