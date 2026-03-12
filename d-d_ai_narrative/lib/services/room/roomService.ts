import 'server-only';
import { customAlphabet } from 'nanoid';
import { prisma } from '@/lib/prisma';
import { RoomStatus } from '@/app/generated/prisma/enums';
import { conflict, forbidden, gone, notFound, unprocessable } from '@/lib/api/errors';
import { broadcastPlayerUpdate } from '@/lib/sse/sseService';
import { broadcastToRoom } from '@/lib/sse/sseManager';

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
  campaign?: { id: string; title: string; theme: string; difficulty: string } | null;
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
export async function createRoom(userId: string, username: string, campaignId?: string): Promise<RoomPublic> {
  const existing = await prisma.roomPlayer.findFirst({
    where: { userId, room: { status: RoomStatus.WAITING } },
  });

  if (existing) {
    throw conflict("Vous êtes déjà dans un salon en attente. Quittez-le avant d'en créer un nouveau.");
  }

  const code = await generateUniqueCode();

  const room = await prisma.$transaction(async (tx) => {
    const newRoom = await tx.room.create({
      data: { code, name: `Salon de ${username}`, hostId: userId, ...(campaignId && { campaignId }) },
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
    include: {
      campaign: { select: { id: true, title: true, theme: true, difficulty: true } },
    },
  });
  if (!room) throw notFound('Salon');
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

  if (!room) throw notFound('Salon');
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

  if (!room) throw notFound('Salon');
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

/**
 * Quitte un salon. Transfère le host si nécessaire, supprime le salon si le host était seul.
 * @throws AppError 404 si le salon ou la membership est introuvable
 */
export async function leaveRoom(roomCode: string, userId: string): Promise<void> {
  const code = roomCode.toUpperCase();

  const room = await prisma.room.findUnique({
    where: { code },
    include: {
      players: { orderBy: { joinedAt: 'asc' } },
    },
  });

  if (!room) throw notFound('Salon');

  const membership = room.players.find((p) => p.userId === userId);
  if (!membership) throw notFound('Membership');

  const isHost = room.hostId === userId;
  const otherPlayers = room.players.filter((p) => p.userId !== userId);

  if (isHost && otherPlayers.length === 0) {
    await prisma.room.delete({ where: { id: room.id } });
    broadcastToRoom(code, { type: 'room_closed', roomCode: code, players: [], status: '', timestamp: Date.now() });
    return;
  }

  if (isHost) {
    const newHost = otherPlayers[0];
    await prisma.$transaction([
      prisma.roomPlayer.delete({ where: { id: membership.id } }),
      prisma.room.update({ where: { id: room.id }, data: { hostId: newHost.userId } }),
    ]);
    await broadcastPlayerUpdate(code, 'player_left');
    return;
  }

  await prisma.roomPlayer.delete({ where: { id: membership.id } });
  await broadcastPlayerUpdate(code, 'player_left');
}

/**
 * Met à jour le statut d'un salon. Seul le host peut déclencher la transition.
 * Transitions autorisées : WAITING → IN_PROGRESS, IN_PROGRESS → FINISHED
 * @throws AppError 404 si le salon n'existe pas
 * @throws AppError 403 si l'utilisateur n'est pas le host
 * @throws AppError 409 si la transition est invalide
 * @throws AppError 422 si moins de 2 joueurs pour passer en IN_PROGRESS
 */
export async function updateRoomStatus(
  roomCode: string,
  userId: string,
  newStatus: Exclude<RoomStatus, 'WAITING'>,
): Promise<RoomPublic> {
  const code = roomCode.toUpperCase();

  const room = await prisma.room.findUnique({
    where: { code },
    include: { _count: { select: { players: true } } },
  });

  if (!room) throw notFound('Salon');
  if (room.hostId !== userId) throw forbidden("Seul le host peut modifier l'état du salon");

  const validTransitions: Record<RoomStatus, RoomStatus[]> = {
    WAITING: [RoomStatus.IN_PROGRESS],
    IN_PROGRESS: [RoomStatus.FINISHED],
    FINISHED: [],
  };

  if (!validTransitions[room.status]?.includes(newStatus)) {
    throw conflict(`Transition invalide : ${room.status} → ${newStatus}`);
  }

  if (newStatus === 'IN_PROGRESS' && room._count.players < 2) {
    throw unprocessable('Il faut au moins 2 joueurs pour démarrer la partie');
  }

  const updated = await prisma.room.update({
    where: { id: room.id },
    data: { status: newStatus },
  });

  await broadcastPlayerUpdate(code, 'room_status_changed');

  return toRoomPublic(updated);
}

/**
 * Bascule l'état "prêt" d'un joueur non-host.
 * @throws AppError 404 si le salon ou la membership est introuvable
 * @throws AppError 403 si l'appelant est le host (le host ne se marque pas prêt)
 * @throws AppError 409 si le salon n'est pas en WAITING
 */
export async function togglePlayerReady(
  roomCode: string,
  userId: string,
): Promise<boolean> {
  const code = roomCode.toUpperCase();

  const room = await prisma.room.findUnique({
    where: { code },
    include: { players: { where: { userId } } },
  });

  if (!room) throw notFound('Salon');

  const membership = room.players[0];
  if (!membership) throw notFound('Membership');
  if (room.hostId === userId) throw forbidden("Le host n'a pas besoin de se marquer prêt");
  if (room.status !== RoomStatus.WAITING) throw conflict('Impossible de changer son état hors de la phase de préparation');

  const updated = await prisma.roomPlayer.update({
    where: { id: membership.id },
    data: { isReady: !membership.isReady },
  });

  await broadcastPlayerUpdate(code, 'player_updated');

  return updated.isReady;
}

/**
 * Sélectionne (ou désélectionne) une campagne pour un salon.
 * Seul le host peut modifier la campagne.
 * Diffuse campaign_selected via SSE à tous les joueurs connectés.
 *
 * @throws 403 si non-host
 * @throws 404 si salon ou campagne introuvable
 * @throws 409 si le salon n'est plus en WAITING
 */
export async function selectCampaign(
  roomCode: string,
  userId: string,
  campaignId: string | null,
): Promise<RoomPublic> {
  const code = roomCode.toUpperCase();

  const room = await prisma.room.findUnique({
    where: { code },
    include: {
      campaign: { select: { id: true, title: true, theme: true, difficulty: true } },
    },
  });

  if (!room) throw notFound('Salon');
  if (room.hostId !== userId) throw forbidden('Seul le host peut choisir la campagne');
  if (room.status !== RoomStatus.WAITING) throw conflict('Impossible de changer la campagne après le démarrage');

  if (campaignId !== null) {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { id: true, isPublic: true, creatorId: true },
    });
    if (!campaign) throw notFound('Campagne');
    if (!campaign.isPublic && campaign.creatorId !== userId) {
      throw forbidden('Accès à cette campagne refusé');
    }
  }

  const updateResult = await prisma.room.updateMany({
    where: { code, status: RoomStatus.WAITING },
    data: { campaignId },
  });

  if (updateResult.count === 0) {
    throw conflict('Impossible de changer la campagne après le démarrage');
  }

  const updatedRoom = await prisma.room.findUnique({
    where: { code },
    include: {
      campaign: { select: { id: true, title: true, theme: true, difficulty: true } },
    },
  });

  if (!updatedRoom) throw notFound('Salon');

  broadcastToRoom(code, {
    type:      'campaign_selected',
    roomCode:  code,
    players:   [],
    status:    room.status,
    timestamp: Date.now(),
    campaign:  updatedRoom.campaign
      ? {
          id:         updatedRoom.campaign.id,
          title:      updatedRoom.campaign.title,
          theme:      updatedRoom.campaign.theme as string,
          difficulty: updatedRoom.campaign.difficulty as string,
        }
      : null,
  });

  return toRoomPublic(updatedRoom);
}

function toRoomPublic(room: {
  id: string;
  code: string;
  name: string;
  status: string;
  maxPlayers: number;
  hostId: string;
  createdAt: Date;
  campaign?: { id: string; title: string; theme: string; difficulty: string } | null;
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
    campaign: room.campaign ?? null,
  };
}
