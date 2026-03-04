import bcrypt from 'bcrypt';
import { conflict, notFound, unauthorized } from '@/lib/api/errors';
import { prisma } from '@/lib/prisma';
import type { UpdateUserMeInput } from '@/lib/validations/user';

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

export async function updateUserMe(userId: string, input: UpdateUserMeInput): Promise<UserMeResponse> {
  const userRows = await prisma.$queryRaw<Array<{ id: string; username: string; password: string }>>`
    SELECT "id", "username", "password"
    FROM "User"
    WHERE "id" = ${userId}
    LIMIT 1
  `;

  const user = userRows[0];
  if (!user) {
    throw notFound('User');
  }

  const profileRows = await prisma.$queryRaw<Array<{ userId: string }>>`
    SELECT "userId"
    FROM "Profile"
    WHERE "userId" = ${userId}
    LIMIT 1
  `;

  if (!profileRows[0]) {
    throw notFound('User');
  }

  if (input.username !== undefined) {
    const takenRows = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT "id"
      FROM "User"
      WHERE "username" = ${input.username}
        AND "id" <> ${userId}
      LIMIT 1
    `;

    if (takenRows[0]) {
      throw conflict('Ce pseudo est déjà utilisé');
    }
  }

  let nextPasswordHash: string | undefined;
  if (input.currentPassword && input.newPassword) {
    const isValidCurrentPassword = await bcrypt.compare(input.currentPassword, user.password);
    if (!isValidCurrentPassword) {
      throw unauthorized('Le mot de passe actuel est invalide');
    }
    nextPasswordHash = await bcrypt.hash(input.newPassword, 12);
  }

  if (input.username !== undefined || nextPasswordHash !== undefined) {
    await prisma.$executeRaw`
      UPDATE "User"
      SET
        "username" = COALESCE(${input.username}, "username"),
        "password" = COALESCE(${nextPasswordHash}, "password"),
        "updatedAt" = CURRENT_TIMESTAMP
      WHERE "id" = ${userId}
    `;
  }

  if (
    input.avatarUrl !== undefined ||
    input.bio !== undefined ||
    input.language !== undefined ||
    input.darkMode !== undefined
  ) {
    await prisma.$executeRaw`
      UPDATE "Profile"
      SET
        "avatarUrl" = COALESCE(${input.avatarUrl}, "avatarUrl"),
        "bio" = COALESCE(${input.bio}, "bio"),
        "language" = COALESCE(${input.language}, "language"),
        "darkMode" = COALESCE(${input.darkMode}, "darkMode"),
        "updatedAt" = CURRENT_TIMESTAMP
      WHERE "userId" = ${userId}
    `;
  }

  return getUserMe(userId);
}
