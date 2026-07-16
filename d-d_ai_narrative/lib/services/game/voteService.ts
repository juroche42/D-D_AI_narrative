import 'server-only';
import { prisma } from '@/lib/prisma';
import { generateTurnActions, saveTurnActions } from '@/lib/services/ai/narrativeService';
import type { GameContext } from '@/lib/services/ai/narrativeService';
import { NarrativeEntryType, TurnActionType } from '@/app/generated/prisma/enums';
import { broadcastToGame } from '@/lib/sse/sseManager';

export interface VoteCount { actionId: string; count: number }
export interface TurnActionDTO { id: string; content: string; type: string }

export interface ResolveResult {
  turn:          number;
  winningAction: { id: string; content: string };
  votes:         VoteCount[];
  resolvedAt:    Date;
  wasAuto:       boolean;
}

// ── Dedup Promise map ─────────────────────────────────────────────────────────
// Garantit qu'une seule génération OpenAI se produit par (gameStateId, turn),
// même si plusieurs clients se connectent simultanément.

declare global {
  // eslint-disable-next-line no-var
  var __actionGenPromises: Map<string, Promise<TurnActionDTO[]>> | undefined;
  // eslint-disable-next-line no-var
  var __resolvePromises: Map<string, Promise<ResolveResult>> | undefined;
}

function getActionGenPromises(): Map<string, Promise<TurnActionDTO[]>> {
  if (!globalThis.__actionGenPromises) globalThis.__actionGenPromises = new Map();
  return globalThis.__actionGenPromises;
}

function getResolvePromises(): Map<string, Promise<ResolveResult>> {
  if (!globalThis.__resolvePromises) globalThis.__resolvePromises = new Map();
  return globalThis.__resolvePromises;
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

export async function resolveVote(
  roomCode:    string,
  triggeredBy: 'auto' | 'timer' = 'timer',
): Promise<ResolveResult> {
  const key      = roomCode.toUpperCase();
  const promises = getResolvePromises();
  const ongoing  = promises.get(key);
  if (ongoing) return ongoing;

  const promise = (async () => {
    try {
      const gameState = await prisma.gameState.findFirst({
        where:  { room: { code: key } },
        select: { id: true, currentTurn: true },
      });
      if (!gameState) throw new Error('GameState introuvable');

      // Idempotence : une NarrativeEntry ACTION pour ce tour = déjà résolu
      const alreadyResolved = await prisma.narrativeEntry.findFirst({
        where: { gameStateId: gameState.id, turn: gameState.currentTurn, type: NarrativeEntryType.ACTION },
      });
      if (alreadyResolved) {
        const [votes, actions] = await Promise.all([
          getVoteCounts(gameState.id, gameState.currentTurn),
          prisma.turnAction.findMany({
            where:  { gameStateId: gameState.id, turn: gameState.currentTurn },
            select: { id: true, content: true },
          }),
        ]);
        const winner = actions.find((a) => a.content === alreadyResolved.content)
          ?? actions[0]
          ?? { id: '', content: alreadyResolved.content };
        return { turn: gameState.currentTurn, winningAction: winner, votes, resolvedAt: alreadyResolved.createdAt, wasAuto: false };
      }

      // Calcul du gagnant
      const [voteCounts, actions] = await Promise.all([
        getVoteCounts(gameState.id, gameState.currentTurn),
        prisma.turnAction.findMany({
          where:   { gameStateId: gameState.id, turn: gameState.currentTurn, type: TurnActionType.SUGGESTED },
          select:  { id: true, content: true },
          orderBy: { createdAt: 'asc' },
        }),
      ]);

      let winningAction: { id: string; content: string };

      if (voteCounts.length === 0 || actions.length === 0) {
        const random = actions[Math.floor(Math.random() * actions.length)];
        winningAction = random ?? { id: '', content: 'Explorer les environs' };
      } else {
        const maxCount = Math.max(...voteCounts.map((v) => v.count));
        const topIds   = voteCounts.filter((v) => v.count === maxCount).map((v) => v.actionId);
        const winnerId = topIds[Math.floor(Math.random() * topIds.length)];
        const found    = actions.find((a) => a.id === winnerId);
        winningAction  = found ?? actions[0] ?? { id: '', content: 'Explorer les environs' };
      }

      broadcastToGame(key, {
        type:         'turn_resolved',
        roomCode:     key,
        turn:         gameState.currentTurn,
        timestamp:    Date.now(),
        winningAction,
        votes:        voteCounts,
      });

      return {
        turn:          gameState.currentTurn,
        winningAction,
        votes:         voteCounts,
        resolvedAt:    new Date(),
        wasAuto:       triggeredBy === 'auto',
      };
    } finally {
      setTimeout(() => getResolvePromises().delete(key), 5_000);
    }
  })();

  promises.set(key, promise);
  return promise;
}

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

  // Auto-resolve si tous les joueurs ont voté
  const totalPlayers = await prisma.roomPlayer.count({ where: { roomId } });
  if (allVotes.length >= totalPlayers) {
    resolveVote(roomCode, 'auto').catch((err) =>
      console.error('[voteService] Auto-resolve error:', err),
    );
  }
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
