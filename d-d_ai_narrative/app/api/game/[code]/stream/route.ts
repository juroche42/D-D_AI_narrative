import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  getGameContext,
  generateCampaignIntroduction,
  generateTurnActions,
  saveTurnActions,
  generateSceneNarrative,
} from '@/lib/services/ai/narrativeService';
import { NarrativeEntryType } from '@/app/generated/prisma/enums';
import {
  acquireLock, releaseLock,
  pushToken, markGenerationDone, getTokensFrom, isBuffered,
} from '@/lib/sse/generationLock';

const CACHE_CHUNK  = 10;      // chars par chunk pour le replay depuis DB
const CACHE_DELAY  = 10;      // ms entre chunks du replay (effet typewriter)
const POLL_MS      = 50;      // ms entre polls du buffer en mémoire
const TIMEOUT_MS   = 90_000;  // timeout max pour les joueurs en attente

/**
 * GET /api/game/:code/stream?type=intro|actions|scene
 *
 * SSE endpoint — streame la narration ou retourne les actions du tour.
 *
 * type=intro   : Introduction narrative (streaming tokens)
 * type=actions : 3 actions suggérées pour le tour courant (payload JSON)
 * type=scene   : Scène narrative suite à une action (streaming tokens)
 *                Params: &actionId=<id> OU &action=<texte encodé>
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
  const roomCode  = code.toUpperCase();
  const reqUrl    = new URL(req.url);
  const type      = reqUrl.searchParams.get('type') ?? 'intro';

  const room = await prisma.room.findUnique({
    where: { code: roomCode },
    select: {
      id:       true,
      status:   true,
      gameState: { select: { narrativeContext: true } },
    },
  });

  if (!room) {
    return NextResponse.json({ error: 'Salon introuvable' }, { status: 404 });
  }

  if (room.status !== 'IN_PROGRESS') {
    return NextResponse.json({ error: "La partie n'est pas en cours" }, { status: 409 });
  }

  const isMember = await prisma.roomPlayer.findFirst({
    where: { roomId: room.id, userId: session.user.id },
    select: { id: true },
  });

  if (!isMember) {
    return NextResponse.json({ error: "Vous n'êtes pas membre de ce salon" }, { status: 403 });
  }

  let ctx;
  try {
    ctx = await getGameContext(roomCode);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erreur lors du chargement du contexte' },
      { status: 500 },
    );
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      };

      send({ type: 'start' });

      try {
        if (type === 'intro') {
          const cached = room.gameState?.narrativeContext ?? '';

          // Cas 1 : texte déjà persisté en DB (rechargement de page)
          if (cached) {
            for (let i = 0; i < cached.length; i += CACHE_CHUNK) {
              send({ type: 'token', token: cached.slice(i, i + CACHE_CHUNK) });
              await new Promise((r) => setTimeout(r, CACHE_DELAY));
            }
            send({ type: 'done' });
            return;
          }

          // Cas 2 : génération en cours — relais depuis le buffer mémoire
          if (isBuffered(roomCode) || !acquireLock(roomCode)) {
            const deadline = Date.now() + TIMEOUT_MS;
            let offset     = 0;

            while (Date.now() < deadline) {
              const { tokens, done } = getTokensFrom(roomCode, offset);

              for (const token of tokens) {
                send({ type: 'token', token });
                offset++;
              }

              if (done && tokens.length === 0) break;
              await new Promise((r) => setTimeout(r, POLL_MS));
            }

            const { done: finallyDone } = getTokensFrom(roomCode, offset);
            if (finallyDone) {
              send({ type: 'done' });
            } else {
              send({ type: 'error', error: 'Timeout : la génération a pris trop de temps' });
            }
            return;
          }

          // Cas 3 : premier appelant — générer via OpenAI
          try {
            await generateCampaignIntroduction(ctx, (token) => {
              pushToken(roomCode, token);
              send({ type: 'token', token });
            });
            markGenerationDone(roomCode);
            send({ type: 'done' });
          } catch (genErr) {
            markGenerationDone(roomCode);
            throw genErr;
          } finally {
            releaseLock(roomCode);
          }
          return;
        }

        if (type === 'actions') {
          const lastEntry = await prisma.narrativeEntry.findFirst({
            where:   { gameStateId: ctx.gameStateId, type: NarrativeEntryType.NARRATION },
            orderBy: { createdAt: 'desc' },
          });

          if (!lastEntry) {
            send({ type: 'error', error: 'Aucune narration trouvée pour ce tour' });
            return;
          }

          const actions = await generateTurnActions(ctx, lastEntry.content);
          const saved   = await saveTurnActions(ctx.gameStateId, ctx.currentTurn, actions);

          send({ type: 'actions', actions: saved, turn: ctx.currentTurn });
          send({ type: 'done' });
          return;
        }

        if (type === 'scene') {
          const actionId = reqUrl.searchParams.get('actionId');
          const freeText = reqUrl.searchParams.get('action');

          let chosenAction: string;
          let chosenActionId: string | null = null;

          if (actionId) {
            const turnAction = await prisma.turnAction.findUnique({
              where: { id: actionId },
            });
            if (!turnAction) {
              send({ type: 'error', error: 'Action introuvable' });
              return;
            }
            chosenAction   = turnAction.content;
            chosenActionId = actionId;
          } else if (freeText) {
            chosenAction = decodeURIComponent(freeText).slice(0, 200);
          } else {
            send({ type: 'error', error: 'actionId ou action requis' });
            return;
          }

          send({ type: 'start', turn: ctx.currentTurn, action: chosenAction });

          await generateSceneNarrative(ctx, chosenAction, chosenActionId, (token) => {
            send({ type: 'token', token });
          });

          send({ type: 'done' });
          return;
        }

        send({ type: 'error', error: `Type de stream inconnu : ${type}` });
      } catch (err) {
        send({ type: 'error', error: err instanceof Error ? err.message : 'Erreur inconnue' });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type':  'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection':    'keep-alive',
    },
  });
}
