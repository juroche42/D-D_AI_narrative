import net from 'net';
import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/api/middleware';

type DatabaseStatus = 'ok' | 'degraded' | 'not_configured';

interface HealthCheckResponse {
  status: 'healthy' | 'degraded';
  version: string;
  environment: string;
  timestamp: string;
  uptime: number;
  checks: {
    database: DatabaseStatus;
    memory: {
      usedMb: number;
      totalMb: number;
      percentage: number;
    };
  };
}

/**
 * @openapi
 * /api/health:
 *   get:
 *     summary: Healthcheck du service
 *     description: Retourne le statut de santé de l'application, incluant la base de données et la mémoire.
 *     tags:
 *       - health
 *     responses:
 *       200:
 *         description: Service opérationnel
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [healthy, degraded]
 *                   example: healthy
 *                 version:
 *                   type: string
 *                   example: 0.1.0
 *                 environment:
 *                   type: string
 *                   example: development
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: number
 *                   example: 42.5
 *                 checks:
 *                   type: object
 *                   properties:
 *                     database:
 *                       type: string
 *                       enum: [ok, degraded, not_configured]
 *                     memory:
 *                       type: object
 *                       properties:
 *                         usedMb:
 *                           type: number
 *                         totalMb:
 *                           type: number
 *                         percentage:
 *                           type: number
 */
export const GET = withErrorHandler(
  async (_req: NextRequest): Promise<NextResponse<HealthCheckResponse>> => {
    const database = await checkDatabase();
    const memory = getMemoryStats();

    const health: HealthCheckResponse = {
      status: database === 'degraded' ? 'degraded' : 'healthy',
      version: process.env.npm_package_version ?? '0.1.0',
      environment: process.env.NODE_ENV ?? 'development',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks: { database, memory },
    };

    return NextResponse.json(health, { status: 200 });
  },
);

/**
 * Vérifie la connectivité à la base de données via TCP (sans dépendance au client Prisma généré).
 * Cette approche fonctionne même si `prisma generate` n'a pas encore été exécuté.
 */
async function checkDatabase(): Promise<DatabaseStatus> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return 'not_configured';

  try {
    const url = new URL(databaseUrl);
    const host = url.hostname;
    const port = parseInt(url.port || '5432', 10);
    await checkTcpPort(host, port);
    return 'ok';
  } catch (err) {
    console.warn('[healthcheck] Database TCP check failed:', err);
    return 'degraded';
  }
}

/** Ouvre une connexion TCP et se déconnecte immédiatement pour vérifier l'accessibilité du port. */
function checkTcpPort(host: string, port: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host, port });
    const timeout = setTimeout(() => {
      socket.destroy();
      reject(new Error(`TCP timeout connecting to ${host}:${port}`));
    }, 3000);

    socket.once('connect', () => {
      clearTimeout(timeout);
      socket.destroy();
      resolve();
    });

    socket.once('error', (err) => {
      clearTimeout(timeout);
      socket.destroy();
      reject(err);
    });
  });
}

/** Calcule les statistiques mémoire du processus Node.js. */
function getMemoryStats(): { usedMb: number; totalMb: number; percentage: number } {
  const mem = process.memoryUsage();
  const usedMb = Math.round(mem.heapUsed / 1024 / 1024);
  const totalMb = Math.round(mem.heapTotal / 1024 / 1024);
  const percentage = totalMb > 0 ? Math.round((usedMb / totalMb) * 100) : 0;

  return { usedMb, totalMb, percentage };
}
