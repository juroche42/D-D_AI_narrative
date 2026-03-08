import 'server-only';
import { customAlphabet } from 'nanoid';
import { prisma } from '@/lib/prisma';
import { RoomStatus } from '@/app/generated/prisma/enums';
import { conflict, gone, notFound, unprocessable } from '@/lib/api/errors';
import { broadcastPlayerUpdate } from '@/lib/sse/sseService';

const generateCode = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 6);

/** DTO public — jamais exposer l'objet Prisma brut */
export interface RoomPublic {
  id: string;
  code: string;
  name: string;
  status: string;
  maxPlayers: number;
  hostId: string;
  createdAt: Date;
  inviteLink: string;
}

/**
 * Génère un code unique de 6 caractères alphanumériques majuscules.
 * Réessaie jusqu'à 5 fois en cas de collision (probabilité quasi-nulle).
 */
async function generateUniqueCode(): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateCode();
    const existing = await prisma.room.findUnique({ where: { code } });
    if (!existing) return code;
  }
  throw new Error('Impossible de générer un code unique après plusieurs tentatives');
}

/**
 * Crée un salon et y ajoute le créateur comme host.
 * @throws AppError 409 si l'utilisateur est déjà dans un salon WAITING
 */
export async function createRoom(userId: string, username: string): Promise<RoomPublic> {
  const existing = await prisma.roomPlayer.findFirst({
    where: { userId, room: { status: RoomStatus.WAITING } },
  });

  if (existing) {
    throw conflict("Vous êtes déjà dans un salon en attente. Quittez-le avant d'en créer un nouveau.");
  }

  const code = await generateUniqueCode();

  const room = await prisma.$transaction(async (tx) => {
    const newRoom = await tx.room.create({
      data: { code, name: `Salon de ${username}`, hostId: userId },
    });
    await tx.roomPlayer.create({
      data: { roomId: newRoom.id, userId },
    });
    return newRoom;
  });

  return toRoomPublic(room);
}

/**
 * Récupère un salon par son code (insensible à la casse).
 * @throws AppError 404 si le salon n'existe pas
 */
export async function getRoomByCode(code: string): Promise<RoomPublic> {
  const room = await prisma.room.findUnique({
    where: { code: code.toUpperCase() },
  });
  if (!room) throw notFound('Salon introuvable ou code invalide');
  return toRoomPublic(room);
}

/**
 * Récupère les infos publiques d'un salon sans y ajouter le joueur.
 * Utilisé pour prévisualiser le salon avant de rejoindre.
 * @throws AppError 404 si le code est inconnu
 * @throws AppError 410 si le salon n'est plus en WAITING
 */
export async function getRoomPreview(code: string): Promise<RoomPublic & { playerCount: number }> {
  const room = await prisma.room.findUnique({
    where: { code: code.toUpperCase() },
    include: { _count: { select: { players: true } } },
  });

  if (!room) throw notFound('Salon introuvable ou code invalide');
  if (room.status !== RoomStatus.WAITING) {
    throw gone('Ce salon a déjà démarré ou est terminé');
  }

  return { ...toRoomPublic(room), playerCount: room._count.players };
}

/**
 * Ajoute un joueur à un salon existant (idempotent si déjà membre).
 * @throws AppError 404 si le salon n'existe pas
 * @throws AppError 409 si l'utilisateur est déjà dans un autre salon actif
 * @throws AppError 410 si le salon n'est plus en WAITING
 * @throws AppError 422 si le salon est plein
 */
export async function joinRoom(code: string, userId: string): Promise<RoomPublic> {
  const room = await prisma.room.findUnique({
    where: { code: code.toUpperCase() },
    include: { _count: { select: { players: true } } },
  });

  if (!room) throw notFound('Salon introuvable ou code invalide');
  if (room.status !== RoomStatus.WAITING) throw gone('Ce salon a déjà démarré ou est terminé');
  if (room._count.players >= room.maxPlayers) throw unprocessable('Ce salon est complet');

  const alreadyIn = await prisma.roomPlayer.findUnique({
    where: { roomId_userId: { roomId: room.id, userId } },
  });
  if (alreadyIn) return toRoomPublic(room);

  const activeElsewhere = await prisma.roomPlayer.findFirst({
    where: { userId, room: { status: RoomStatus.WAITING }, NOT: { roomId: room.id } },
  });
  if (activeElsewhere) {
    throw conflict("Vous êtes déjà dans un autre salon. Quittez-le avant d'en rejoindre un nouveau.");
  }

  await prisma.roomPlayer.create({
    data: { roomId: room.id, userId },
  });

  await broadcastPlayerUpdate(code.toUpperCase(), 'player_joined');

  return toRoomPublic(room);
}

function toRoomPublic(room: {
  id: string;
  code: string;
  name: string;
  status: string;
  maxPlayers: number;
  hostId: string;
  createdAt: Date;
}): RoomPublic {
  const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000';
  return {
    id: room.id,
    code: room.code,
    name: room.name,
    status: room.status,
    maxPlayers: room.maxPlayers,
    hostId: room.hostId,
    createdAt: room.createdAt,
    inviteLink: `${baseUrl}/room/${room.code}`,
  };
}
