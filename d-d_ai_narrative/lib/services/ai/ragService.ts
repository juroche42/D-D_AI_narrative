import 'server-only';
import { prisma } from '@/lib/prisma';
import { embed } from '@/lib/services/ai/openAIService';
import { MemoryType } from '@/app/generated/prisma/client';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface SimilarDocument {
  id:         string;
  source:     string;
  chunk:      string;
  type:       MemoryType;
  similarity: number;
}

export interface RagContext {
  contextText: string;
  documents:   SimilarDocument[];
}

export interface IndexStats {
  total:  number;
  byType: Record<string, number>;
}

// ─── Recherche par similarité ───────────────────────────────────────────────────

/**
 * Recherche les documents les plus similaires à une requête, sans filtre de type.
 */
export async function searchSimilarDocuments(
  query:     string,
  limit     = 5,
  threshold = 0.65,
): Promise<SimilarDocument[]> {
  const { vector } = await embed({ text: query });
  const vectorStr  = `[${vector.join(',')}]`;

  const rows = await prisma.$queryRaw<Array<{
    id:         string;
    source:     string;
    chunk:      string;
    type:       MemoryType;
    similarity: number;
  }>>`
    SELECT id, source, chunk, type,
           1 - (embedding <=> ${vectorStr}::vector(1536)) AS similarity
    FROM vector_documents
    WHERE 1 - (embedding <=> ${vectorStr}::vector(1536)) >= ${threshold}
    ORDER BY embedding <=> ${vectorStr}::vector(1536)
    LIMIT ${limit}
  `;

  return rows.map((r) => ({ ...r, similarity: Number(r.similarity) }));
}

/**
 * Recherche les documents similaires filtrés par type (RULE, LORE, NPC, ...).
 */
export async function searchByType(
  query:     string,
  type:      MemoryType,
  limit     = 5,
  threshold = 0.65,
): Promise<SimilarDocument[]> {
  const { vector } = await embed({ text: query });
  const vectorStr  = `[${vector.join(',')}]`;

  const rows = await prisma.$queryRaw<Array<{
    id:         string;
    source:     string;
    chunk:      string;
    type:       MemoryType;
    similarity: number;
  }>>`
    SELECT id, source, chunk, type,
           1 - (embedding <=> ${vectorStr}::vector(1536)) AS similarity
    FROM vector_documents
    WHERE type = ${type}::"MemoryType"
      AND 1 - (embedding <=> ${vectorStr}::vector(1536)) >= ${threshold}
    ORDER BY embedding <=> ${vectorStr}::vector(1536)
    LIMIT ${limit}
  `;

  return rows.map((r) => ({ ...r, similarity: Number(r.similarity) }));
}

// ─── Contexte RAG ──────────────────────────────────────────────────────────────

/**
 * Génère un contexte RAG enrichi pour une situation donnée.
 * Recherche en parallèle des règles (RULE), du lore (LORE) et des PNJ (NPC).
 * Déduplique par ID et formate pour injection dans un system prompt.
 */
export async function buildRagContext(situation: string): Promise<RagContext> {
  const [rules, lore, npcs] = await Promise.all([
    searchByType(situation, MemoryType.RULE, 3, 0.65),
    searchByType(situation, MemoryType.LORE, 3, 0.65),
    searchByType(situation, MemoryType.NPC,  2, 0.65),
  ]);

  // Déduplication par ID
  const seen = new Set<string>();
  const documents: SimilarDocument[] = [];
  for (const doc of [...rules, ...lore, ...npcs]) {
    if (!seen.has(doc.id)) {
      seen.add(doc.id);
      documents.push(doc);
    }
  }

  if (documents.length === 0) {
    return { contextText: '', documents: [] };
  }

  const contextText = documents
    .map((d) => `[${d.type}] ${d.chunk}`)
    .join('\n\n---\n\n');

  return { contextText, documents };
}

// ─── Stats ─────────────────────────────────────────────────────────────────────

/**
 * Retourne les statistiques d'indexation : total + répartition par type.
 */
export async function getIndexStats(): Promise<IndexStats> {
  const [total, byTypeRaw] = await Promise.all([
    prisma.vectorDocument.count(),
    prisma.vectorDocument.groupBy({
      by:     ['type'],
      _count: { _all: true },
    }),
  ]);

  const byType: Record<string, number> = {};
  for (const row of byTypeRaw) {
    byType[row.type] = Number(row._count._all);
  }

  return { total, byType };
}
