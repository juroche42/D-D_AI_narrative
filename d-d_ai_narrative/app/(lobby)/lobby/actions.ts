'use server';

import { auth } from '@/lib/auth';
import { createRoom, joinRoom, leaveRoom, updateRoomStatus, togglePlayerReady } from '@/lib/services/room';
import type { RoomPublic } from '@/lib/services/room';
import { JoinRoomSchema } from '@/lib/validations/room';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';

export interface CreateRoomResult {
  success: boolean;
  room?: RoomPublic;
  error?: string;
}

export async function createRoomAction(): Promise<CreateRoomResult> {
  const session = await auth();
  if (!session?.user) redirect('/login');

  try {
    const room = await createRoom(session.user.id, session.user.username);
    return { success: true, room };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur lors de la création du salon',
    };
  }
}

export interface JoinRoomResult {
  success: boolean;
  room?: RoomPublic;
  error?: string;
}

export async function joinRoomAction(code: string): Promise<JoinRoomResult> {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const parsed = JoinRoomSchema.safeParse({ code });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  try {
    const room = await joinRoom(parsed.data.code, session.user.id);
    return { success: true, room };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Impossible de rejoindre ce salon',
    };
  }
}

export interface StartGameResult {
  success: boolean;
  error?: string;
}

export async function startGameAction(roomCode: string): Promise<StartGameResult> {
  const session = await auth();
  if (!session?.user) redirect('/login');

  try {
    await updateRoomStatus(roomCode, session.user.id, 'IN_PROGRESS');
    return { success: true };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Impossible de démarrer la partie',
    };
  }
}

export interface ToggleReadyResult {
  success: boolean;
  isReady?: boolean;
  error?: string;
}

export async function toggleReadyAction(roomCode: string): Promise<ToggleReadyResult> {
  const session = await auth();
  if (!session?.user) redirect('/login');

  try {
    const isReady = await togglePlayerReady(roomCode, session.user.id);
    return { success: true, isReady };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Impossible de changer votre statut',
    };
  }
}

export interface LeaveRoomResult {
  success: boolean;
  error?: string;
}

export async function leaveRoomAction(roomCode: string): Promise<LeaveRoomResult> {
  const session = await auth();
  if (!session?.user) redirect('/login');

  try {
    await leaveRoom(roomCode, session.user.id);
    return { success: true };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Impossible de quitter ce salon',
    };
  }
}

export interface PlayCampaignResult {
  success: boolean;
  roomCode?: string;
  error?: string;
}

export async function playCampaignAction(campaignId: string): Promise<PlayCampaignResult> {
  const session = await auth();
  if (!session?.user) redirect('/login');

  try {
    const room = await createRoom(session.user.id, session.user.username);
    await prisma.room.update({
      where: { code: room.code },
      data: { campaignId },
    });
    return { success: true, roomCode: room.code };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Impossible de créer le salon',
    };
  }
}
