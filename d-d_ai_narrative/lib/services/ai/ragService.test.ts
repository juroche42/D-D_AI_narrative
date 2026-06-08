import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('server-only', () => ({}));

const mockQueryRaw  = vi.hoisted(() => vi.fn());
const mockCount     = vi.hoisted(() => vi.fn());
const mockGroupBy   = vi.hoisted(() => vi.fn());
const mockEmbed     = vi.hoisted(() => vi.fn());

vi.mock('@/lib/prisma', () => ({
  prisma: {
    $queryRaw:      mockQueryRaw,
    vectorDocument: {
      count:   mockCount,
      groupBy: mockGroupBy,
    },
  },
}));

vi.mock('@/lib/services/ai/openAIService', () => ({
  embed: mockEmbed,
}));

import {
  searchSimilarDocuments,
  buildRagContext,
  getIndexStats,
} from './ragService';
import { MemoryType } from '@/app/generated/prisma/enums';

const FAKE_VECTOR = Array.from({ length: 1536 }, (_, i) => i * 0.001);

const FAKE_DOCS = [
  { id: 'doc1', source: 'open5e:spells:fireball', chunk: 'Fireball est un sort de niveau 3.', type: MemoryType.RULE, similarity: 0.85 },
  { id: 'doc2', source: 'open5e:sections:combat',  chunk: 'En combat, lancez initiative.', type: MemoryType.RULE, similarity: 0.75 },
];

describe('searchSimilarDocuments', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retourne les documents similaires avec similarity en Number', async () => {
    mockEmbed.mockResolvedValue({ vector: FAKE_VECTOR, model: 'text-embedding-3-small', tokens: 10 });
    mockQueryRaw.mockResolvedValue(FAKE_DOCS);

    const results = await searchSimilarDocuments('fireball', 5);

    expect(results).toHaveLength(2);
    expect(results[0].similarity).toBe(0.85);
    expect(typeof results[0].similarity).toBe('number');
    expect(mockEmbed).toHaveBeenCalledWith({ text: 'fireball' });
  });

  it('retourne un tableau vide si aucun document trouvé', async () => {
    mockEmbed.mockResolvedValue({ vector: FAKE_VECTOR, model: 'text-embedding-3-small', tokens: 5 });
    mockQueryRaw.mockResolvedValue([]);

    const results = await searchSimilarDocuments('unknown query');

    expect(results).toHaveLength(0);
  });

  it('propage les erreurs de embed()', async () => {
    mockEmbed.mockRejectedValue(new Error('[OpenAI] Rate limit atteint'));

    await expect(searchSimilarDocuments('test')).rejects.toThrow('Rate limit');
  });
});

describe('buildRagContext', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retourne contextText formaté avec les documents dédupliqués', async () => {
    mockEmbed.mockResolvedValue({ vector: FAKE_VECTOR, model: 'text-embedding-3-small', tokens: 10 });

    // searchByType appelle $queryRaw : 3 appels (RULE, LORE, NPC)
    const ruleDoc = { id: 'r1', source: 'open5e:spells:fireball', chunk: 'Fireball…', type: MemoryType.RULE, similarity: 0.9 };
    const loreDoc = { id: 'l1', source: 'open5e:races:elf',       chunk: 'Les Elfes…', type: MemoryType.LORE, similarity: 0.8 };
    const npcDoc  = { id: 'n1', source: 'open5e:monsters:goblin', chunk: 'Gobelin FP 1/4…', type: MemoryType.NPC, similarity: 0.7 };

    mockQueryRaw
      .mockResolvedValueOnce([ruleDoc])
      .mockResolvedValueOnce([loreDoc])
      .mockResolvedValueOnce([npcDoc]);

    const { contextText, documents } = await buildRagContext('combat avec gobelins');

    expect(documents).toHaveLength(3);
    expect(contextText).toContain('[RULE]');
    expect(contextText).toContain('[LORE]');
    expect(contextText).toContain('[NPC]');
    expect(contextText).toContain('---');
  });

  it('retourne contextText vide si aucun document trouvé', async () => {
    mockEmbed.mockResolvedValue({ vector: FAKE_VECTOR, model: 'text-embedding-3-small', tokens: 10 });
    mockQueryRaw.mockResolvedValue([]);

    const { contextText, documents } = await buildRagContext('situation inconnue');

    expect(contextText).toBe('');
    expect(documents).toHaveLength(0);
  });

  it('déduplique les documents avec le même id', async () => {
    mockEmbed.mockResolvedValue({ vector: FAKE_VECTOR, model: 'text-embedding-3-small', tokens: 10 });

    const sharedDoc = { id: 'shared1', source: 'src', chunk: 'Chunk partagé', type: MemoryType.RULE, similarity: 0.9 };

    mockQueryRaw
      .mockResolvedValueOnce([sharedDoc])
      .mockResolvedValueOnce([sharedDoc]) // même doc dans LORE
      .mockResolvedValueOnce([]);

    const { documents } = await buildRagContext('test');

    expect(documents).toHaveLength(1);
  });
});

describe('getIndexStats', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retourne total et byType avec BigInt converti en Number', async () => {
    mockCount.mockResolvedValue(1234);
    mockGroupBy.mockResolvedValue([
      { type: MemoryType.RULE, _count: { _all: BigInt(500) } },
      { type: MemoryType.LORE, _count: { _all: BigInt(400) } },
      { type: MemoryType.NPC,  _count: { _all: BigInt(334) } },
    ]);

    const stats = await getIndexStats();

    expect(stats.total).toBe(1234);
    expect(stats.byType[MemoryType.RULE]).toBe(500);
    expect(stats.byType[MemoryType.LORE]).toBe(400);
    expect(stats.byType[MemoryType.NPC]).toBe(334);
    expect(typeof stats.byType[MemoryType.RULE]).toBe('number');
  });

  it('retourne total 0 et byType vide si aucun document', async () => {
    mockCount.mockResolvedValue(0);
    mockGroupBy.mockResolvedValue([]);

    const stats = await getIndexStats();

    expect(stats.total).toBe(0);
    expect(stats.byType).toEqual({});
  });
});
