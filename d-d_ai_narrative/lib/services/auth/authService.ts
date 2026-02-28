import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { conflict } from '@/lib/api/errors';
import type { RegisterInput } from '@/lib/validations/auth';

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

  return {
    id: user.id,
    username: user.username,
    createdAt: user.createdAt,
  };
}
