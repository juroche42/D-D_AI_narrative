import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('server-only', () => ({}));

// ── Prisma mock ─────────────────────────────────────────────────────────────────
const mockFindUnique       = vi.hoisted(() => vi.fn());
const mockCreateEntry      = vi.hoisted(() => vi.fn());
const mockUpdateGameState  = vi.hoisted(() => vi.fn());

vi.mock('@/lib/prisma', () => ({
  prisma: {
    room: {
      findUnique: mockFindUnique,
    },
    narrativeEntry: {
      create: mockCreateEntry,
    },
    gameState: {
      update: mockUpdateGameState,
    },
  },
}));

// ── OpenAI mock ─────────────────────────────────────────────────────────────────
const mockCompleteStream = vi.hoisted(() => vi.fn());

vi.mock('@/lib/services/ai/openAIService', () => ({
  completeStream: mockCompleteStream,
}));

// ── RAG mock ────────────────────────────────────────────────────────────────────
const mockBuildRagContext = vi.hoisted(() => vi.fn());

vi.mock('@/lib/services/ai/ragService', () => ({
  buildRagContext: mockBuildRagContext,
}));

import { getGameContext, generateCampaignIntroduction } from './narrativeService';
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
    id:              'gs-1',
    roomId:          'room-1',
    currentTurn:     1,
    worldState:      {},
    narrativeContext:'',
    lastActivityAt:  new Date(),
    createdAt:       new Date(),
    updatedAt:       new Date(),
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
  players: [
    { username: 'Thorin', characterName: 'Bjorn', race: 'DWARF', class: 'FIGHTER' },
    { username: 'Elara' },
  ],
};

// ── Tests ───────────────────────────────────────────────────────────────────────

describe('getGameContext', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retourne le contexte complet quand le salon est valide', async () => {
    mockFindUnique.mockResolvedValue(MOCK_ROOM);

    const ctx = await getGameContext('ABC123');

    expect(ctx.roomCode).toBe('ABC123');
    expect(ctx.campaignTitle).toBe('La Forêt Maudite');
    expect(ctx.gameStateId).toBe('gs-1');
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

describe('generateCampaignIntroduction', () => {
  beforeEach(() => vi.clearAllMocks());

  it('streame les tokens et persiste le contenu en base', async () => {
    mockBuildRagContext.mockResolvedValue({ contextText: 'Forêt sombre...', documents: [] });
    mockCreateEntry.mockResolvedValue({});
    mockUpdateGameState.mockResolvedValue({});

    // Simule completeStream : appelle onChunk puis onDone
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

    // Vérifier la persistance
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

    // Le systemPrompt est passé à OpenAI mais jamais inclus dans les chunks
    const systemMsg = capturedMessages.find((m) => m.role === 'system');
    expect(systemMsg?.content).toContain('Tu es un Dungeon Master épique.');
    expect(chunks).toHaveLength(0); // onChunk pas appelé car pas de tokens simulés
  });
});
