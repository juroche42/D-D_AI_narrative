import 'server-only';
import { prisma } from '@/lib/prisma';
import { generateTurnActions, saveTurnActions } from '@/lib/services/ai/narrativeService';
import type { GameContext } from '@/lib/services/ai/narrativeService';
import { NarrativeEntryType } from '@/app/generated/prisma/enums';
import { broadcastToGame } from '@/lib/sse/sseManager';

export interface VoteCount { actionId: string; count: number }
export interface TurnActionDTO { id: string; content: string; type: string }

// ── Dedup Promise map ─────────────────────────────────────────────────────────
// Garantit qu'une seule génération OpenAI se produit par (gameStateId, turn),
// même si plusieurs clients se connectent simultanément.

declare global {
  // eslint-disable-next-line no-var
  var __actionGenPromises: Map<string, Promise<TurnActionDTO[]>> | undefined;
}

function getActionGenPromises(): Map<string, Promise<TurnActionDTO[]>> {
  if (!globalThis.__actionGenPromises) globalThis.__actionGenPromises = new Map();
  return globalThis.__actionGenPromises;
}

/**
 * Retourne les actions du tour courant depuis la DB, ou les génère une seule fois (idempotent).
 * Résout la race condition où deux clients concurrents généraient chacun 3 actions différentes,
 * causant 6 enregistrements avec des IDs distincts et la désync des votes.
 */
export async function getOrCreateTurnActions(ctx: GameContext): Promise<TurnActionDTO[]> {
  // 1. Fast path : déjà en DB
  const existing = await prisma.turnAction.findMany({
    where:   { gameStateId: ctx.gameStateId, turn: ctx.currentTurn },
    orderBy: { createdAt: 'asc' },
    select:  { id: true, content: true, type: true },
  });
  if (existing.length > 0) return existing.map((a) => ({ ...a, type: a.type as string }));

  // 2. Déduplication : si une génération est en cours (même process), attendre la même Promise
  const key      = `${ctx.gameStateId}_${ctx.currentTurn}`;
  const promises = getActionGenPromises();
  const ongoing  = promises.get(key);
  if (ongoing) return ongoing;

  // 3. Premier appelant : lancer la génération
  const genPromise = (async () => {
    try {
      const lastEntry = await prisma.narrativeEntry.findFirst({
        where:   { gameStateId: ctx.gameStateId, type: NarrativeEntryType.NARRATION },
        orderBy: { createdAt: 'desc' },
      });
      if (!lastEntry) throw new Error('Aucune narration trouvée');

      const actions = await generateTurnActions(ctx, lastEntry.content);
      return saveTurnActions(ctx.gameStateId, ctx.currentTurn, actions);
    } finally {
      promises.delete(key);
    }
  })();

  promises.set(key, genPromise);
  return genPromise;
}

// ── Helpers privés ────────────────────────────────────────────────────────────

async function getVoteCounts(gameStateId: string, turn: number): Promise<VoteCount[]> {
  const rows = await prisma.vote.groupBy({
    by:    ['actionId'],
    where: { gameStateId, turn },
    _count: { actionId: true },
  });
  return rows.map((r) => ({ actionId: r.actionId, count: r._count.actionId }));
}

// ── Exported functions ────────────────────────────────────────────────────────

/**
 * Upsert d'un vote (1 vote par joueur par tour, changement autorisé).
 * Broadcast `vote_cast` avec compteurs + myVote personnalisé.
 */
export async function castVote(
  gameStateId: string,
  roomId:      string,
  roomCode:    string,
  userId:      string,
  actionId:    string,
  turn:        number,
): Promise<void> {
  // Vérifier que l'action appartient bien à ce tour/gameState
  const action = await prisma.turnAction.findFirst({
    where: { id: actionId, gameStateId, turn },
  });
  if (!action) {
    const err = new Error('Action introuvable pour ce tour') as Error & { statusCode: number };
    err.statusCode = 404;
    throw err;
  }

  await prisma.vote.upsert({
    where:  { gameStateId_userId_turn: { gameStateId, userId, turn } },
    create: { gameStateId, roomId, userId, actionId, turn },
    update: { actionId, votedAt: new Date() },
  });

  const [voteCounts, allVotes] = await Promise.all([
    getVoteCounts(gameStateId, turn),
    prisma.vote.findMany({
      where:  { gameStateId, turn },
      select: { userId: true, actionId: true },
    }),
  ]);

  const votesByUser = new Map(allVotes.map((v) => [v.userId, v.actionId]));

  broadcastToGame(
    roomCode,
    { type: 'vote_cast', roomCode, turn, timestamp: Date.now(), votes: voteCounts },
    (uid) => ({ myVote: votesByUser.get(uid) ?? null }),
  );
}

/**
 * Snapshot complet des votes pour les clients qui se connectent en cours de tour.
 */
export async function getVoteState(
  gameStateId: string,
  turn:        number,
  userId:      string,
): Promise<{ votes: VoteCount[]; myVote: string | null }> {
  const [votes, myVoteRecord] = await Promise.all([
    getVoteCounts(gameStateId, turn),
    prisma.vote.findUnique({
      where:  { gameStateId_userId_turn: { gameStateId, userId, turn } },
      select: { actionId: true },
    }),
  ]);
  return { votes, myVote: myVoteRecord?.actionId ?? null };
}
