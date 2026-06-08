import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('server-only', () => ({}));

// ── Prisma mock ──────────────────────────────────────────────────────────────
const mockTurnActionFindMany   = vi.hoisted(() => vi.fn());
const mockTurnActionFindFirst  = vi.hoisted(() => vi.fn());
const mockNarrativeEntryFindFirst = vi.hoisted(() => vi.fn());
const mockVoteUpsert           = vi.hoisted(() => vi.fn());
const mockVoteGroupBy          = vi.hoisted(() => vi.fn());
const mockVoteFindMany         = vi.hoisted(() => vi.fn());
const mockVoteFindUnique       = vi.hoisted(() => vi.fn());

vi.mock('@/lib/prisma', () => ({
  prisma: {
    turnAction: {
      findMany:  mockTurnActionFindMany,
      findFirst: mockTurnActionFindFirst,
    },
    narrativeEntry: {
      findFirst: mockNarrativeEntryFindFirst,
    },
    vote: {
      upsert:     mockVoteUpsert,
      groupBy:    mockVoteGroupBy,
      findMany:   mockVoteFindMany,
      findUnique: mockVoteFindUnique,
    },
  },
}));

// ── narrativeService mock ────────────────────────────────────────────────────
const mockGenerateTurnActions = vi.hoisted(() => vi.fn());
const mockSaveTurnActions     = vi.hoisted(() => vi.fn());

vi.mock('@/lib/services/ai/narrativeService', () => ({
  generateTurnActions: mockGenerateTurnActions,
  saveTurnActions:     mockSaveTurnActions,
}));

// ── sseManager mock ──────────────────────────────────────────────────────────
const mockBroadcastToGame = vi.hoisted(() => vi.fn());

vi.mock('@/lib/sse/sseManager', () => ({
  broadcastToGame: mockBroadcastToGame,
}));

import {
  getOrCreateTurnActions,
  castVote,
  getVoteState,
} from './voteService';
import type { GameContext } from '@/lib/services/ai/narrativeService';

// ── Fixtures ─────────────────────────────────────────────────────────────────

const MOCK_CTX: GameContext = {
  roomCode:              'ABC123',
  campaignTitle:         'Test Campaign',
  campaignSynopsis:      'Synopsis',
  campaignStartLocation: 'Village',
  campaignMainQuest:     'Quest',
  campaignSystemPrompt:  'Prompt',
  gameStateId:           'gs-1',
  currentTurn:           2,
  narrativeContext:      'Some narrative context',
  players: [],
};

const MOCK_ACTIONS = [
  { id: 'a1', content: 'Action 1', type: 'SUGGESTED' },
  { id: 'a2', content: 'Action 2', type: 'SUGGESTED' },
  { id: 'a3', content: 'Action 3', type: 'SUGGESTED' },
];

// ── Tests : getOrCreateTurnActions ───────────────────────────────────────────

describe('getOrCreateTurnActions', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retourne les actions existantes depuis la DB sans appeler OpenAI', async () => {
    mockTurnActionFindMany.mockResolvedValue(MOCK_ACTIONS);

    const result = await getOrCreateTurnActions(MOCK_CTX);

    expect(result).toHaveLength(3);
    expect(result[0].id).toBe('a1');
    expect(mockGenerateTurnActions).not.toHaveBeenCalled();
    expect(mockSaveTurnActions).not.toHaveBeenCalled();
  });

  it('génère les actions via OpenAI si la DB est vide et les persiste', async () => {
    mockTurnActionFindMany.mockResolvedValue([]);
    mockNarrativeEntryFindFirst.mockResolvedValue({ id: 'ne-1', content: 'Dernière narration' });
    mockGenerateTurnActions.mockResolvedValue(['A', 'B', 'C']);
    mockSaveTurnActions.mockResolvedValue(MOCK_ACTIONS);

    const result = await getOrCreateTurnActions(MOCK_CTX);

    expect(mockGenerateTurnActions).toHaveBeenCalledWith(MOCK_CTX, 'Dernière narration');
    expect(mockSaveTurnActions).toHaveBeenCalledWith('gs-1', 2, ['A', 'B', 'C']);
    expect(result).toEqual(MOCK_ACTIONS);
  });

  it('deux appels concurrents ne génèrent les actions qu\'une seule fois (dedup Promise)', async () => {
    mockTurnActionFindMany.mockResolvedValue([]);
    mockNarrativeEntryFindFirst.mockResolvedValue({ id: 'ne-1', content: 'Narration' });
    mockGenerateTurnActions.mockResolvedValue(['A', 'B', 'C']);
    mockSaveTurnActions.mockResolvedValue(MOCK_ACTIONS);

    const [r1, r2] = await Promise.all([
      getOrCreateTurnActions(MOCK_CTX),
      getOrCreateTurnActions(MOCK_CTX),
    ]);

    expect(mockGenerateTurnActions).toHaveBeenCalledTimes(1);
    expect(r1).toEqual(MOCK_ACTIONS);
    expect(r2).toEqual(MOCK_ACTIONS);
  });

  it('throw si aucune narration trouvée lors de la génération', async () => {
    mockTurnActionFindMany.mockResolvedValue([]);
    mockNarrativeEntryFindFirst.mockResolvedValue(null);

    await expect(getOrCreateTurnActions(MOCK_CTX)).rejects.toThrow('Aucune narration trouvée');
    expect(mockGenerateTurnActions).not.toHaveBeenCalled();
  });
});

// ── Tests : castVote ─────────────────────────────────────────────────────────

describe('castVote', () => {
  beforeEach(() => vi.clearAllMocks());

  it('upsert le vote et broadcast vote_cast', async () => {
    mockTurnActionFindFirst.mockResolvedValue({ id: 'a1', content: 'Action 1' });
    mockVoteUpsert.mockResolvedValue({});
    mockVoteGroupBy.mockResolvedValue([{ actionId: 'a1', _count: { actionId: 2 } }]);
    mockVoteFindMany.mockResolvedValue([
      { userId: 'u1', actionId: 'a1' },
      { userId: 'u2', actionId: 'a1' },
    ]);

    await castVote('gs-1', 'room-1', 'ABC123', 'u1', 'a1', 2);

    expect(mockVoteUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where:  { gameStateId_userId_turn: { gameStateId: 'gs-1', userId: 'u1', turn: 2 } },
        create: expect.objectContaining({ actionId: 'a1' }),
        update: expect.objectContaining({ actionId: 'a1' }),
      }),
    );
    expect(mockBroadcastToGame).toHaveBeenCalledWith(
      'ABC123',
      expect.objectContaining({ type: 'vote_cast', turn: 2 }),
      expect.any(Function),
    );
    // Vérifier que myVote est bien personnalisé par userId
    const [, , perUserFn] = mockBroadcastToGame.mock.calls[0] as [string, object, (uid: string) => { myVote: string | null }];
    expect(perUserFn('u1')).toEqual({ myVote: 'a1' });
    expect(perUserFn('u3')).toEqual({ myVote: null });
  });

  it('throw 404 si l\'actionId n\'appartient pas au bon tour', async () => {
    mockTurnActionFindFirst.mockResolvedValue(null);

    await expect(
      castVote('gs-1', 'room-1', 'ABC123', 'u1', 'bad-action', 2),
    ).rejects.toThrow('Action introuvable pour ce tour');

    expect(mockVoteUpsert).not.toHaveBeenCalled();
  });

  it('permet de changer de vote (upsert sur même userId/turn)', async () => {
    mockTurnActionFindFirst.mockResolvedValue({ id: 'a2', content: 'Action 2' });
    mockVoteUpsert.mockResolvedValue({});
    mockVoteGroupBy.mockResolvedValue([
      { actionId: 'a2', _count: { actionId: 1 } },
    ]);
    mockVoteFindMany.mockResolvedValue([{ userId: 'u1', actionId: 'a2' }]);

    // Voter d'abord pour a1, puis changer pour a2
    await castVote('gs-1', 'room-1', 'ABC123', 'u1', 'a2', 2);

    expect(mockVoteUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({ actionId: 'a2' }),
      }),
    );
    const [, , perUserFn] = mockBroadcastToGame.mock.calls[0] as [string, object, (uid: string) => { myVote: string | null }];
    expect(perUserFn('u1')).toEqual({ myVote: 'a2' });
  });
});

// ── Tests : getVoteState ─────────────────────────────────────────────────────

describe('getVoteState', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retourne les compteurs et myVote pour un utilisateur', async () => {
    mockVoteGroupBy.mockResolvedValue([
      { actionId: 'a1', _count: { actionId: 3 } },
      { actionId: 'a2', _count: { actionId: 1 } },
    ]);
    mockVoteFindUnique.mockResolvedValue({ actionId: 'a1' });

    const result = await getVoteState('gs-1', 2, 'u1');

    expect(result.votes).toHaveLength(2);
    expect(result.votes[0]).toEqual({ actionId: 'a1', count: 3 });
    expect(result.myVote).toBe('a1');
  });

  it('retourne myVote null si l\'utilisateur n\'a pas encore voté', async () => {
    mockVoteGroupBy.mockResolvedValue([]);
    mockVoteFindUnique.mockResolvedValue(null);

    const result = await getVoteState('gs-1', 2, 'u99');

    expect(result.votes).toHaveLength(0);
    expect(result.myVote).toBeNull();
  });
});
