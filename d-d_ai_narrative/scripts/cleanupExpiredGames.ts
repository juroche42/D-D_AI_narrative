import { config } from 'dotenv';
config({ path: '.env' });
config({ path: '.env.local', override: true });

import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../app/generated/prisma/client';

/**
 * Supprime les parties non terminées (WAITING ou IN_PROGRESS) créées il y a
 * plus de 7 jours. Le cascade Prisma nettoie GameState, joueurs, votes, etc.
 *
 * À exécuter en tâche planifiée (cron) : `pnpm games:cleanup`.
 * La même logique tourne aussi à la volée dans `getResumableGames`
 * (voir lib/services/room/roomService.ts → deleteExpiredGames).
 */
const UNFINISHED_GAME_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const pool    = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma  = new PrismaClient({ adapter });

async function main(): Promise<void> {
  const cutoff = new Date(Date.now() - UNFINISHED_GAME_TTL_MS);

  const { count } = await prisma.room.deleteMany({
    where: {
      status: { not: 'FINISHED' },
      createdAt: { lt: cutoff },
    },
  });

  console.log(`🧹 Parties non terminées supprimées (créées avant ${cutoff.toISOString()}) : ${count}`);
}

main()
  .catch((err) => { console.error('❌ Erreur :', err); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); await pool.end(); });
