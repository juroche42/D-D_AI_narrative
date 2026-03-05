'use server';

import { auth } from '@/lib/auth';
import { createRoom } from '@/lib/services/room';
import type { RoomPublic } from '@/lib/services/room';
import { redirect } from 'next/navigation';

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
