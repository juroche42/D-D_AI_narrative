import 'server-only';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { castVote } from '@/lib/services/game/voteService';

const VoteSchema = z.union([
  z.object({ actionId:   z.string().min(1) }),
  z.object({ freeAction: z.string().min(1).max(200) }),
]);

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { code } = await params;
  const roomCode = code.toUpperCase();

  const body   = await req.json().catch(() => null);
  const parsed = VoteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'actionId ou freeAction requis' }, { status: 422 });
  }

  const room = await prisma.room.findUnique({
    where:  { code: roomCode },
    select: {
      id:     true,
      status: true,
      gameState: { select: { id: true, currentTurn: true } },
    },
  });
  if (!room) {
    return NextResponse.json({ error: 'Salon introuvable' }, { status: 404 });
  }
  if (room.status !== 'IN_PROGRESS') {
    return NextResponse.json({ error: "La partie n'est pas en cours" }, { status: 409 });
  }
  if (!room.gameState) {
    return NextResponse.json({ error: 'GameState introuvable' }, { status: 404 });
  }

  const isMember = await prisma.roomPlayer.findFirst({
    where: { roomId: room.id, userId: session.user.id },
  });
  if (!isMember) {
    return NextResponse.json({ error: "Vous n'êtes pas membre de ce salon" }, { status: 403 });
  }

  try {
    if ('freeAction' in parsed.data) {
      const newAction = await prisma.turnAction.create({
        data: {
          gameStateId: room.gameState.id,
          turn:        room.gameState.currentTurn,
          type:        'FREE',
          content:     parsed.data.freeAction,
          authorId:    session.user.id,
        },
      });
      await castVote(
        room.gameState.id,
        room.id,
        roomCode,
        session.user.id,
        newAction.id,
        room.gameState.currentTurn,
      );
    } else {
      await castVote(
        room.gameState.id,
        room.id,
        roomCode,
        session.user.id,
        parsed.data.actionId,
        room.gameState.currentTurn,
      );
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    const e = err as Error & { statusCode?: number };
    return NextResponse.json({ error: e.message }, { status: e.statusCode ?? 500 });
  }
}
