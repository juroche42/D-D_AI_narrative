import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {},
}));

vi.mock('@/lib/services/room', () => ({
  createRoom: vi.fn(),
  joinRoom: vi.fn(),
  leaveRoom: vi.fn(),
  updateRoomStatus: vi.fn(),
  togglePlayerReady: vi.fn(),
  selectCampaign: vi.fn(),
  selectCharacter: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

import { selectCharacterAction } from './actions';
import { auth } from '@/lib/auth';
import { selectCharacter } from '@/lib/services/room';

const SESSION = { user: { id: 'user_1', username: 'Thorin' } };

describe('selectCharacterAction', () => {
  beforeEach(() => vi.clearAllMocks());

  it('sélectionne le personnage pour le joueur courant et retourne success', async () => {
    vi.mocked(auth).mockResolvedValue(SESSION as never);
    vi.mocked(selectCharacter).mockResolvedValue(undefined as never);

    const result = await selectCharacterAction('ABC123', 'char_1');

    expect(selectCharacter).toHaveBeenCalledWith('ABC123', 'user_1', 'char_1');
    expect(result).toEqual({ success: true });
  });

  it('transmet null pour une désélection', async () => {
    vi.mocked(auth).mockResolvedValue(SESSION as never);
    vi.mocked(selectCharacter).mockResolvedValue(undefined as never);

    await selectCharacterAction('ABC123', null);

    expect(selectCharacter).toHaveBeenCalledWith('ABC123', 'user_1', null);
  });

  it('retourne le message d\'erreur du service en cas d\'échec', async () => {
    vi.mocked(auth).mockResolvedValue(SESSION as never);
    vi.mocked(selectCharacter).mockRejectedValue(new Error('Ce personnage ne vous appartient pas'));

    const result = await selectCharacterAction('ABC123', 'char_1');

    expect(result).toEqual({
      success: false,
      error: 'Ce personnage ne vous appartient pas',
    });
  });

  it('retourne un message générique si l\'erreur n\'est pas une Error', async () => {
    vi.mocked(auth).mockResolvedValue(SESSION as never);
    vi.mocked(selectCharacter).mockRejectedValue('boom');

    const result = await selectCharacterAction('ABC123', 'char_1');

    expect(result).toEqual({
      success: false,
      error: 'Erreur lors de la sélection du personnage',
    });
  });

  it('redirige vers /login si non authentifié', async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    await expect(selectCharacterAction('ABC123', 'char_1')).rejects.toThrow('REDIRECT:/login');
    expect(selectCharacter).not.toHaveBeenCalled();
  });
});
