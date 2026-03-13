import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('server-only', () => ({}));

// ── Prisma mock ─────────────────────────────────────────────────────────────────
const mockFindUnique          = vi.hoisted(() => vi.fn());
const mockCreateEntry         = vi.hoisted(() => vi.fn());
const mockUpdateGameState     = vi.hoisted(() => vi.fn());
const mockFindManyEntries     = vi.hoisted(() => vi.fn());
const mockDeleteManyActions   = vi.hoisted(() => vi.fn());
const mockCreateTurnAction    = vi.hoisted(() => vi.fn());

vi.mock('@/lib/prisma', () => ({
  prisma: {
    room: {
      findUnique: mockFindUnique,
    },
    narrativeEntry: {
      create:   mockCreateEntry,
      findMany: mockFindManyEntries,
    },
    gameState: {
      update: mockUpdateGameState,
    },
    turnAction: {
      deleteMany: mockDeleteManyActions,
      create:     mockCreateTurnAction,
    },
  },
}));

// ── OpenAI mock ─────────────────────────────────────────────────────────────────
const mockCompleteStream = vi.hoisted(() => vi.fn());
const mockComplete       = vi.hoisted(() => vi.fn());

vi.mock('@/lib/services/ai/openAIService', () => ({
  completeStream: mockCompleteStream,
  complete:       mockComplete,
}));

// ── RAG mock ────────────────────────────────────────────────────────────────────
const mockBuildRagContext = vi.hoisted(() => vi.fn());

vi.mock('@/lib/services/ai/ragService', () => ({
  buildRagContext: mockBuildRagContext,
}));

import {
  getGameContext,
  generateCampaignIntroduction,
  generateTurnActions,
  saveTurnActions,
  generateSceneNarrative,
} from './narrativeService';
import type { GameContext } from './narrativeService';

// ── Fixtures ────────────────────────────────────────────────────────────────────

const MOCK_ROOM = {
  code: 'ABC123',
  campaign: {
    id:              'campaign-1',
    title:           'La Forêt Maudite',
    synopsis:        'Les héros entrent dans une forêt hantée.',
    startLocation:   'Village de Fauchombre',
    mainQuest:       'Lever la malédiction',
    systemPrompt:    'Tu es un Dungeon Master épique.',
    theme:           'HORROR',
    difficulty:      'MEDIUM',
    isPublic:        true,
    isPremium:       false,
    minPlayers:      2,
    maxPlayers:      5,
    estimatedDuration: 120,
    createdAt:       new Date(),
    updatedAt:       new Date(),
    creatorId:       'user-1',
  },
  gameState: {
    id:               'gs-1',
    currentTurn:      1,
    narrativeContext: '',
  },
  players: [
    {
      user:      { username: 'Thorin' },
      character: { name: 'Bjorn', race: 'DWARF', class: 'FIGHTER' },
    },
    {
      user:      { username: 'Elara' },
      character: null,
    },
  ],
};

const MOCK_CONTEXT: GameContext = {
  roomCode:              'ABC123',
  campaignTitle:         'La Forêt Maudite',
  campaignSynopsis:      'Les héros entrent dans une forêt hantée.',
  campaignStartLocation: 'Village de Fauchombre',
  campaignMainQuest:     'Lever la malédiction',
  campaignSystemPrompt:  'Tu es un Dungeon Master épique.',
  gameStateId:           'gs-1',
  currentTurn:           1,
  narrativeContext:      '',
  players: [
    { username: 'Thorin', characterName: 'Bjorn', race: 'DWARF', class: 'FIGHTER' },
    { username: 'Elara' },
  ],
};

// ── Tests : getGameContext ───────────────────────────────────────────────────────

describe('getGameContext', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retourne le contexte complet quand le salon est valide', async () => {
    mockFindUnique.mockResolvedValue(MOCK_ROOM);

    const ctx = await getGameContext('ABC123');

    expect(ctx.roomCode).toBe('ABC123');
    expect(ctx.campaignTitle).toBe('La Forêt Maudite');
    expect(ctx.gameStateId).toBe('gs-1');
    expect(ctx.currentTurn).toBe(1);
    expect(ctx.narrativeContext).toBe('');
    expect(ctx.players).toHaveLength(2);
    expect(ctx.players[0]).toMatchObject({ username: 'Thorin', characterName: 'Bjorn' });
    expect(ctx.players[1]).toMatchObject({ username: 'Elara' });
  });

  it('throw si le salon est introuvable', async () => {
    mockFindUnique.mockResolvedValue(null);
    await expect(getGameContext('XXXXXX')).rejects.toThrow('Salon introuvable');
  });

  it('throw si aucune campagne sélectionnée', async () => {
    mockFindUnique.mockResolvedValue({ ...MOCK_ROOM, campaign: null });
    await expect(getGameContext('ABC123')).rejects.toThrow('Aucune campagne');
  });

  it('throw si le GameState est manquant', async () => {
    mockFindUnique.mockResolvedValue({ ...MOCK_ROOM, gameState: null });
    await expect(getGameContext('ABC123')).rejects.toThrow('GameState introuvable');
  });
});

// ── Tests : generateCampaignIntroduction ────────────────────────────────────────

describe('generateCampaignIntroduction', () => {
  beforeEach(() => vi.clearAllMocks());

  it('streame les tokens et persiste le contenu en base', async () => {
    mockBuildRagContext.mockResolvedValue({ contextText: 'Forêt sombre...', documents: [] });
    mockCreateEntry.mockResolvedValue({});
    mockUpdateGameState.mockResolvedValue({});

    mockCompleteStream.mockImplementation(async (opts: {
      onChunk: (t: string) => void;
      onDone?: () => Promise<void>;
    }) => {
      opts.onChunk('Dans les');
      opts.onChunk(' ténèbres...');
      await opts.onDone?.();
    });

    const chunks: string[] = [];
    await generateCampaignIntroduction(MOCK_CONTEXT, (t) => chunks.push(t));

    expect(chunks).toEqual(['Dans les', ' ténèbres...']);
    expect(mockCreateEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          gameStateId: 'gs-1',
          turn:        1,
          content:     'Dans les ténèbres...',
        }),
      }),
    );
    expect(mockUpdateGameState).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'gs-1' },
        data:  expect.objectContaining({ narrativeContext: 'Dans les ténèbres...' }),
      }),
    );
  });

  it('appelle buildRagContext avec le lieu de départ', async () => {
    mockBuildRagContext.mockResolvedValue({ contextText: '', documents: [] });
    mockCompleteStream.mockImplementation(async (opts: { onDone?: () => Promise<void> }) => {
      await opts.onDone?.();
    });
    mockCreateEntry.mockResolvedValue({});
    mockUpdateGameState.mockResolvedValue({});

    await generateCampaignIntroduction(MOCK_CONTEXT, () => {});

    expect(mockBuildRagContext).toHaveBeenCalledWith('Village de Fauchombre');
  });

  it('ne retourne pas le systemPrompt dans les chunks streamés', async () => {
    mockBuildRagContext.mockResolvedValue({ contextText: '', documents: [] });

    let capturedMessages: { role: string; content: string }[] = [];
    mockCompleteStream.mockImplementation(async (opts: {
      messages: { role: string; content: string }[];
      onDone?: () => Promise<void>;
    }) => {
      capturedMessages = opts.messages;
      await opts.onDone?.();
    });
    mockCreateEntry.mockResolvedValue({});
    mockUpdateGameState.mockResolvedValue({});

    const chunks: string[] = [];
    await generateCampaignIntroduction(MOCK_CONTEXT, (t) => chunks.push(t));

    const systemMsg = capturedMessages.find((m) => m.role === 'system');
    expect(systemMsg?.content).toContain('Tu es un Dungeon Master épique.');
    expect(chunks).toHaveLength(0);
  });
});

// ── Tests : generateTurnActions ─────────────────────────────────────────────────

describe('generateTurnActions', () => {
  beforeEach(() => vi.clearAllMocks());

  it('parse le JSON et retourne 3 actions', async () => {
    mockFindManyEntries.mockResolvedValue([]);
    mockComplete.mockResolvedValue({
      content: '{"actions":["Inspecter les bas-reliefs","Allumer une torche","Appeler à voix haute"]}',
      model: 'gpt-4o-mini', promptTokens: 50, completionTokens: 30, totalTokens: 80,
    });

    const actions = await generateTurnActions(MOCK_CONTEXT, 'Vous êtes dans une crypte sombre.');

    expect(actions).toHaveLength(3);
    expect(actions[0]).toBe('Inspecter les bas-reliefs');
    expect(actions[1]).toBe('Allumer une torche');
    expect(actions[2]).toBe('Appeler à voix haute');
  });

  it('retourne 3 actions fallback si le JSON est invalide', async () => {
    mockFindManyEntries.mockResolvedValue([]);
    mockComplete.mockResolvedValue({
      content: 'Voici quelques idées pour vous...',
      model: 'gpt-4o-mini', promptTokens: 20, completionTokens: 10, totalTokens: 30,
    });

    const actions = await generateTurnActions(MOCK_CONTEXT, 'Scène quelconque');

    expect(actions).toHaveLength(3);
    expect(typeof actions[0]).toBe('string');
    expect(typeof actions[1]).toBe('string');
    expect(typeof actions[2]).toBe('string');
  });

  it('inclut le systemPrompt dans les messages OpenAI', async () => {
    mockFindManyEntries.mockResolvedValue([]);
    let capturedMessages: { role: string; content: string }[] = [];
    mockComplete.mockImplementation(async (opts: { messages: { role: string; content: string }[] }) => {
      capturedMessages = opts.messages;
      return { content: '{"actions":["A","B","C"]}', model: 'gpt-4o-mini', promptTokens: 10, completionTokens: 10, totalTokens: 20 };
    });

    await generateTurnActions(MOCK_CONTEXT, 'Scène test');

    const systemMsg = capturedMessages.find((m) => m.role === 'system');
    expect(systemMsg?.content).toContain('Tu es un Dungeon Master épique.');
  });
});

// ── Tests : saveTurnActions ─────────────────────────────────────────────────────

describe('saveTurnActions', () => {
  beforeEach(() => vi.clearAllMocks());

  it('supprime les actions existantes et crée les nouvelles', async () => {
    mockDeleteManyActions.mockResolvedValue({ count: 0 });
    mockCreateTurnAction
      .mockResolvedValueOnce({ id: 'a1', content: 'Action 1', type: 'SUGGESTED' })
      .mockResolvedValueOnce({ id: 'a2', content: 'Action 2', type: 'SUGGESTED' })
      .mockResolvedValueOnce({ id: 'a3', content: 'Action 3', type: 'SUGGESTED' });

    const result = await saveTurnActions('gs-1', 1, ['Action 1', 'Action 2', 'Action 3']);

    expect(mockDeleteManyActions).toHaveBeenCalledWith({
      where: { gameStateId: 'gs-1', turn: 1, type: 'SUGGESTED' },
    });
    expect(mockCreateTurnAction).toHaveBeenCalledTimes(3);
    expect(result).toHaveLength(3);
    expect(result[0].id).toBe('a1');
  });
});

// ── Tests : generateSceneNarrative ──────────────────────────────────────────────

describe('generateSceneNarrative', () => {
  beforeEach(() => vi.clearAllMocks());

  it('persiste ACTION puis NARRATION dans cet ordre', async () => {
    mockFindManyEntries.mockResolvedValue([]);
    mockBuildRagContext.mockResolvedValue({ contextText: '', documents: [] });
    mockCompleteStream.mockImplementation(async (opts: {
      onChunk: (t: string) => void;
    }) => {
      opts.onChunk('La hache');
      opts.onChunk(' tombe.');
    });
    mockCreateEntry.mockResolvedValue({});
    mockUpdateGameState.mockResolvedValue({});

    const chunks: string[] = [];
    await generateSceneNarrative(MOCK_CONTEXT, 'Attaquer le gobelin', null, (t) => chunks.push(t));

    expect(chunks).toEqual(['La hache', ' tombe.']);

    const calls = mockCreateEntry.mock.calls;
    expect(calls[0][0].data.type).toBe('ACTION');
    expect(calls[0][0].data.content).toBe('Attaquer le gobelin');
    expect(calls[1][0].data.type).toBe('NARRATION');
    expect(calls[1][0].data.content).toBe('La hache tombe.');
  });

  it('incrémente currentTurn après génération', async () => {
    mockFindManyEntries.mockResolvedValue([]);
    mockBuildRagContext.mockResolvedValue({ contextText: '', documents: [] });
    mockCompleteStream.mockImplementation(async (opts: { onChunk: (t: string) => void }) => {
      opts.onChunk('test');
    });
    mockCreateEntry.mockResolvedValue({});
    mockUpdateGameState.mockResolvedValue({});

    await generateSceneNarrative(MOCK_CONTEXT, 'Agir', null, () => {});

    expect(mockUpdateGameState).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ currentTurn: { increment: 1 } }),
      }),
    );
  });

  it('appelle buildRagContext avec l\'action + le lieu de départ', async () => {
    mockFindManyEntries.mockResolvedValue([]);
    mockBuildRagContext.mockResolvedValue({ contextText: '', documents: [] });
    mockCompleteStream.mockImplementation(async (opts: { onChunk: (t: string) => void }) => {
      opts.onChunk('narration');
    });
    mockCreateEntry.mockResolvedValue({});
    mockUpdateGameState.mockResolvedValue({});

    await generateSceneNarrative(MOCK_CONTEXT, 'Inspecter la crypte', null, () => {});

    expect(mockBuildRagContext).toHaveBeenCalledWith('Inspecter la crypte Village de Fauchombre');
  });
});
