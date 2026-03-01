import { notFound } from '@/lib/api/errors';
import { prisma } from '@/lib/prisma';

export interface UserMeResponse {
  readonly id: string;
  readonly username: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly profile: {
    readonly id: string;
    readonly avatarUrl: string;
    readonly bio: string;
    readonly language: 'FR' | 'EN';
    readonly darkMode: boolean;
    readonly totalGames: number;
    readonly totalTurns: number;
    readonly monstersDefeated: number;
    readonly naturalCrits: number;
    readonly updatedAt: Date;
  };
}

export async function getUserMe(userId: string): Promise<UserMeResponse> {
  const rows = await prisma.$queryRaw<
    Array<{
      id: string;
      username: string;
      createdAt: Date;
      updatedAt: Date;
      profileId: string | null;
      avatarUrl: string | null;
      bio: string | null;
      language: 'FR' | 'EN' | null;
      darkMode: boolean | null;
      totalGames: number | null;
      totalTurns: number | null;
      monstersDefeated: number | null;
      naturalCrits: number | null;
      profileUpdatedAt: Date | null;
    }>
  >`
    SELECT
      u."id",
      u."username",
      u."createdAt",
      u."updatedAt",
      p."id" AS "profileId",
      p."avatarUrl",
      p."bio",
      p."language",
      p."darkMode",
      p."totalGames",
      p."totalTurns",
      p."monstersDefeated",
      p."naturalCrits",
      p."updatedAt" AS "profileUpdatedAt"
    FROM "User" u
    LEFT JOIN "Profile" p ON p."userId" = u."id"
    WHERE u."id" = ${userId}
    LIMIT 1
  `;

  const user = rows[0];

  if (!user || !user.profileId) {
    throw notFound('User');
  }

  return {
    id: user.id,
    username: user.username,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    profile: {
      id: user.profileId,
      avatarUrl: user.avatarUrl ?? '',
      bio: user.bio ?? '',
      language: user.language ?? 'FR',
      darkMode: user.darkMode ?? false,
      totalGames: user.totalGames ?? 0,
      totalTurns: user.totalTurns ?? 0,
      monstersDefeated: user.monstersDefeated ?? 0,
      naturalCrits: user.naturalCrits ?? 0,
      updatedAt: user.profileUpdatedAt ?? user.updatedAt,
    },
  };
}
