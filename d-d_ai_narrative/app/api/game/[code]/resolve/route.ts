import 'server-only';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { resolveVote } from '@/lib/services/game/voteService';

const ResolveSchema = z.object({
  triggeredBy: z.enum(['auto', 'timer']).default('timer'),
});

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

  const room = await prisma.room.findUnique({
    where:  { code: roomCode },
    select: { id: true, status: true, gameState: { select: { id: true } } },
  });
  if (!room) {
    return NextResponse.json({ error: 'Salon introuvable' }, { status: 404 });
  }
  if (room.status !== 'IN_PROGRESS') {
    return NextResponse.json({ error: "Partie non en cours" }, { status: 409 });
  }

  const isMember = await prisma.roomPlayer.findFirst({
    where: { roomId: room.id, userId: session.user.id },
  });
  if (!isMember) {
    return NextResponse.json({ error: "Non membre" }, { status: 403 });
  }

  const body   = await req.json().catch(() => ({}));
  const parsed = ResolveSchema.safeParse(body);

  try {
    const result = await resolveVote(
      roomCode,
      parsed.success ? parsed.data.triggeredBy : 'timer',
    );
    return NextResponse.json({ ok: true, result });
  } catch (err) {
    const e = err as Error;
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
