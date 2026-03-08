import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { registerClient, unregisterClient } from '@/lib/sse/sseManager';
import { getRoomPlayers } from '@/lib/sse/sseService';
import { type NextRequest } from 'next/server';

interface Props {
  params: Promise<{ code: string }>;
}

/**
 * GET /api/rooms/:code/events — Flux SSE temps réel
 *
 * Envoie immédiatement un snapshot des joueurs actuels,
 * puis streame les mises à jour (join/leave/update).
 * Keepalive toutes les 25s pour éviter les timeouts proxy.
 */
export async function GET(req: NextRequest, { params }: Props) {
  const { code } = await params;
  const roomCode = code.toUpperCase();

  const session = await auth();
  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const room = await prisma.room.findUnique({
    where: { code: roomCode },
    include: { players: { where: { userId: session.user.id } } },
  });

  if (!room) return new Response('Room not found', { status: 404 });
  if (room.players.length === 0) return new Response('Not a member of this room', { status: 403 });

  let clientId: string;

  const stream = new ReadableStream({
    async start(controller) {
      clientId = registerClient(roomCode, controller);

      // Snapshot initial
      const players = await getRoomPlayers(roomCode);
      const initialEvent = JSON.stringify({
        type: 'player_joined',
        roomCode,
        players,
        timestamp: Date.now(),
      });
      controller.enqueue(new TextEncoder().encode(`data: ${initialEvent}\n\n`));

      // Keepalive toutes les 25s (commentaire SSE — ne déclenche pas onmessage)
      const keepalive = setInterval(() => {
        try {
          controller.enqueue(new TextEncoder().encode(': keepalive\n\n'));
        } catch {
          clearInterval(keepalive);
        }
      }, 25_000);

      req.signal.addEventListener('abort', () => {
        clearInterval(keepalive);
        unregisterClient(clientId);
        try {
          controller.close();
        } catch {
        }
      });
    },

    cancel() {
      unregisterClient(clientId);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
