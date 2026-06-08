import 'server-only';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { registerGameClient, unregisterGameClient } from '@/lib/sse/sseManager';
import { getOrCreateTurnActions, getVoteState } from '@/lib/services/game/voteService';
import { getGameContext } from '@/lib/services/ai/narrativeService';

const KEEPALIVE_MS = 25_000;

/**
 * GET /api/game/:code/events
 *
 * SSE persistant — diffuse en temps réel :
 * - `actions_ready` : snapshot initial (actions + compteurs de votes + myVote)
 * - `vote_cast`     : mise à jour des compteurs après chaque vote
 * - `turn_resolving`: signal que le DM commence à générer la scène suivante
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { code } = await params;
  const roomCode = code.toUpperCase();

  const room = await prisma.room.findUnique({
    where:  { code: roomCode },
    select: { id: true, status: true },
  });
  if (!room) {
    return NextResponse.json({ error: 'Salon introuvable' }, { status: 404 });
  }
  if (room.status !== 'IN_PROGRESS') {
    return NextResponse.json({ error: "La partie n'est pas en cours" }, { status: 409 });
  }

  const isMember = await prisma.roomPlayer.findFirst({
    where:  { roomId: room.id, userId: session.user.id },
    select: { id: true },
  });
  if (!isMember) {
    return NextResponse.json({ error: "Vous n'êtes pas membre de ce salon" }, { status: 403 });
  }

  const encoder = new TextEncoder();
  let clientId       = '';
  let keepaliveTimer: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream({
    async start(controller) {
      clientId = registerGameClient(roomCode, session.user.id, controller);

      keepaliveTimer = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': keepalive\n\n'));
        } catch {
          // Client déconnecté
        }
      }, KEEPALIVE_MS);

      // Snapshot initial — actions + votes du tour courant
      try {
        const ctx     = await getGameContext(roomCode);
        const actions = await getOrCreateTurnActions(ctx);
        const { votes, myVote } = await getVoteState(ctx.gameStateId, ctx.currentTurn, session.user.id);

        const snapshot = {
          type:      'actions_ready',
          roomCode,
          turn:      ctx.currentTurn,
          timestamp: Date.now(),
          actions,
          votes,
          myVote,
        };
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(snapshot)}\n\n`));
      } catch {
        // Intro pas encore terminée — aucune narration disponible
        // Le client recevra les actions via broadcast quand elles seront prêtes
      }
    },
    cancel() {
      if (keepaliveTimer) clearInterval(keepaliveTimer);
      if (clientId) unregisterGameClient(clientId);
    },
  });

  req.signal.addEventListener('abort', () => {
    if (keepaliveTimer) clearInterval(keepaliveTimer);
    if (clientId) unregisterGameClient(clientId);
  });

  return new Response(stream, {
    headers: {
      'Content-Type':  'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection':    'keep-alive',
    },
  });
}
