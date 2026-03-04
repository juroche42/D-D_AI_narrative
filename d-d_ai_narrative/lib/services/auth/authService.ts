import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { conflict, unauthorized } from '@/lib/api/errors';
import type { RegisterInput, LoginInput } from '@/lib/validations/auth';

/** Type de retour public — le champ `password` n'est jamais exposé. */
export type UserPublic = {
  readonly id: string;
  readonly username: string;
  readonly createdAt: Date;
};

/**
 * Inscrit un nouvel utilisateur.
 *
 * @throws {AppError} 409 CONFLICT si le pseudo est déjà pris
 */
export async function registerUser(
  input: Omit<RegisterInput, 'confirmPassword'>,
): Promise<UserPublic> {
  const existing = await prisma.user.findUnique({
    where: { username: input.username },
  });

  if (existing) {
    throw conflict('Ce pseudo est déjà utilisé');
  }

  const passwordHash = await bcrypt.hash(input.password, 12);

  const user = await prisma.user.create({
    data: {
      username: input.username,
      password: passwordHash,
    },
  });

  // Keep profile creation compatible with stale generated Prisma client typings.
  await prisma.$executeRaw`
    INSERT INTO "Profile" (
      "id",
      "userId",
      "avatarUrl",
      "bio",
      "language",
      "darkMode",
      "totalGames",
      "totalTurns",
      "monstersDefeated",
      "naturalCrits",
      "updatedAt"
    )
    VALUES (
      ${`profile_${user.id}`},
      ${user.id},
      '',
      '',
      'FR'::"ProfileLanguage",
      false,
      0,
      0,
      0,
      0,
      CURRENT_TIMESTAMP
    )
    ON CONFLICT ("userId") DO NOTHING
  `;

  return {
    id: user.id,
    username: user.username,
    createdAt: user.createdAt,
  };
}

/** Hash factice valide (format bcrypt) pour éviter les timing attacks lorsque l'utilisateur n'existe pas */
const DUMMY_HASH = '$2b$12$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';

/**
 * Authentifie un utilisateur par username + password.
 *
 * @throws {AppError} 401 UNAUTHORIZED si les identifiants sont incorrects
 */
export async function loginUser(input: LoginInput): Promise<UserPublic> {
  const user = await prisma.user.findUnique({
    where: { username: input.username },
  });

  const isValid = await bcrypt.compare(input.password, user?.password ?? DUMMY_HASH);

  if (!user || !isValid) {
    throw unauthorized();
  }

  return {
    id: user.id,
    username: user.username,
    createdAt: user.createdAt,
  };
}
