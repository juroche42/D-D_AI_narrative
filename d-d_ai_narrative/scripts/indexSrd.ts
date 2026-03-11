import { config } from 'dotenv';
config({ path: '.env' });
config({ path: '.env.local', override: true });

import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../app/generated/prisma/client';
import OpenAI from 'openai';

// ─── Config ────────────────────────────────────────────────────────────────────

const OPEN5E_V1 = 'https://api.open5e.com/v1';
const OPEN5E_V2 = 'https://api.open5e.com/v2';
const ENDPOINTS: Array<{ base: string; path: string; type: 'RULE' | 'LORE' | 'NPC' }> = [
  { base: OPEN5E_V2, path: 'spells',     type: 'RULE' },
  { base: OPEN5E_V1, path: 'monsters',   type: 'NPC'  },
  { base: OPEN5E_V1, path: 'classes',    type: 'RULE' },
  { base: OPEN5E_V1, path: 'races',      type: 'LORE' },
  { base: OPEN5E_V1, path: 'sections',   type: 'LORE' },
  { base: OPEN5E_V1, path: 'magicitems', type: 'LORE' },
];

const CHUNK_SIZE    = 2000;
const CHUNK_OVERLAP = 200;
const EMBED_BATCH   = 10;
const BATCH_DELAY   = 200;

const pool    = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma  = new PrismaClient({ adapter });
const openai  = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ─── Helpers ───────────────────────────────────────────────────────────────────

function sanitize(text: string): string {
  return text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim();
}

function chunkText(text: string): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    const end = start + CHUNK_SIZE;
    chunks.push(sanitize(text.slice(start, end)));
    start = end - CHUNK_OVERLAP;
  }
  return chunks.filter((c) => c.length > 50);
}

function itemToText(item: Record<string, unknown>): string {
  const parts: string[] = [];
  const name = (item.name ?? item.slug ?? '') as string;
  if (name) parts.push(`Nom : ${name}`);

  const textFields = ['desc', 'description', 'brief_description', 'document__title'];
  for (const field of textFields) {
    if (typeof item[field] === 'string' && item[field]) {
      parts.push(item[field] as string);
    }
  }

  if (item.level !== undefined)          parts.push(`Niveau : ${item.level}`);
  if (item.school)                       parts.push(`École : ${item.school}`);
  if (item.casting_time)                 parts.push(`Temps d'incantation : ${item.casting_time}`);
  if (item.range)                        parts.push(`Portée : ${item.range}`);
  if (item.duration)                     parts.push(`Durée : ${item.duration}`);
  if (item.components)                   parts.push(`Composantes : ${item.components}`);

  if (item.challenge_rating !== undefined) parts.push(`FP : ${item.challenge_rating}`);
  if (item.type)                         parts.push(`Type : ${item.type}`);
  if (item.size)                         parts.push(`Taille : ${item.size}`);

  return parts.join('\n');
}

async function fetchAll(base: string, path: string): Promise<Record<string, unknown>[]> {
  const results: Record<string, unknown>[] = [];
  let url: string | null = `${base}/${path}/?limit=100`;

  while (url) {
    const res  = await fetch(url);
    if (!res.ok) throw new Error(`Open5e ${path} → HTTP ${res.status}`);
    const data = await res.json() as { results: Record<string, unknown>[]; next: string | null };
    results.push(...data.results);
    url = data.next ?? null;
  }

  return results;
}

async function embedBatch(texts: string[]): Promise<number[][]> {
  const res = await openai.embeddings.create({
    model: process.env.OPENAI_MODEL_EMBED ?? 'text-embedding-3-small',
    input: texts,
  });
  return res.data.map((d) => d.embedding);
}

async function insertDocuments(
  chunks: Array<{ source: string; chunk: string; type: string; embedding: number[] }>,
): Promise<void> {
  for (const doc of chunks) {
    const vector = `[${doc.embedding.join(',')}]`;
    await prisma.$executeRaw`
      INSERT INTO vector_documents (id, "createdAt", source, chunk, type, embedding)
      VALUES (
        gen_random_uuid()::text,
        NOW(),
        ${doc.source},
        ${doc.chunk},
        ${doc.type}::"MemoryType",
        ${vector}::vector(1536)
      )
    `;
  }
}

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const force = process.argv.includes('--force');

  const existing = await prisma.vectorDocument.count();
  if (existing > 0 && !force) {
    console.log(`✅ ${existing} documents déjà indexés. Utiliser --force pour réindexer.`);
    return;
  }

  if (force && existing > 0) {
    console.log(`🗑️  Suppression de ${existing} documents existants...`);
    await prisma.vectorDocument.deleteMany();
  }

  let totalIndexed = 0;

  for (const { base, path, type } of ENDPOINTS) {
    console.log(`\n📥 Récupération : ${path}...`);
    const items = await fetchAll(base, path);
    console.log(`   → ${items.length} éléments récupérés`);

    const allChunks: Array<{ source: string; chunk: string; type: string }> = [];

    for (const item of items) {
      const text   = itemToText(item);
      const source = `open5e:${path}:${item.slug ?? item.name ?? 'unknown'}`;
      for (const chunk of chunkText(text)) {
        allChunks.push({ source, chunk, type });
      }
    }

    console.log(`   → ${allChunks.length} chunks générés`);

    for (let i = 0; i < allChunks.length; i += EMBED_BATCH) {
      const batch  = allChunks.slice(i, i + EMBED_BATCH);
      const texts  = batch.map((c) => c.chunk);
      const vectors = await embedBatch(texts);

      const docs = batch.map((c, idx) => ({ ...c, embedding: vectors[idx] }));
      await insertDocuments(docs);

      totalIndexed += docs.length;
      process.stdout.write(`\r   → ${totalIndexed} documents indexés...`);

      if (i + EMBED_BATCH < allChunks.length) {
        await new Promise((r) => setTimeout(r, BATCH_DELAY));
      }
    }

    console.log('');
  }

  console.log(`\n🎉 Indexation terminée : ${totalIndexed} documents dans vector_documents.`);
}

main()
  .catch((err) => { console.error('❌ Erreur :', err); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); await pool.end(); });
