import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { SSEPlayer } from '@/lib/sse/sseManager';
import { RoomLobby } from './RoomLobby';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('@/app/(lobby)/lobby/actions', () => ({
  leaveRoomAction: vi.fn(),
  startGameAction: vi.fn(),
  toggleReadyAction: vi.fn(),
}));

// Stubs des modals pour isoler le RoomLobby (évite fetch/SSE réels).
vi.mock('./CampaignSelectModal', () => ({
  CampaignSelectModal: () => <div data-testid="campaign-modal" />,
}));
vi.mock('./CharacterSelectModal', () => ({
  CharacterSelectModal: () => <div data-testid="character-modal" />,
}));

let hookReturn: {
  players: SSEPlayer[];
  roomStatus: string;
  status: string;
  error: string | null;
  selectedCampaign: null;
};

vi.mock('@/hooks/useRoomPlayers', () => ({
  useRoomPlayers: () => hookReturn,
}));

const ROOM = {
  id: 'room_1',
  code: 'ABC123',
  name: 'Salon Test',
  status: 'WAITING',
  maxPlayers: 6,
  hostId: 'user_host',
  createdAt: new Date('2026-03-03'),
  inviteLink: 'http://localhost:3000/room/ABC123',
  campaign: null,
};

const CURRENT_USER = { id: 'user_1', username: 'Legolas' };

function player(overrides: Partial<SSEPlayer> = {}): SSEPlayer {
  return {
    userId: 'user_1',
    username: 'Legolas',
    characterId: null,
    character: null,
    isReady: false,
    isHost: false,
    joinedAt: new Date('2026-03-03T10:00:00'),
    ...overrides,
  };
}

describe('RoomLobby — card personnage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hookReturn = {
      players: [player()],
      roomStatus: 'WAITING',
      status: 'connected',
      error: null,
      selectedCampaign: null,
    };
  });

  it('affiche le nom, la race et la classe du personnage sélectionné', () => {
    hookReturn.players = [
      player({
        characterId: 'char_1',
        character: { name: 'Grommash', race: 'HALF_ORC', class: 'FIGHTER' },
      }),
    ];

    render(<RoomLobby room={ROOM} currentUser={CURRENT_USER} />);

    expect(screen.getByText('Héros sélectionné')).toBeInTheDocument();
    expect(screen.getByText('Grommash')).toBeInTheDocument();
    // Libellés FR de race et classe
    expect(screen.getByText(/Demi-Orc · Guerrier/)).toBeInTheDocument();
  });

  it('affiche le bouton "Choisir un héros" quand aucun personnage n\'est sélectionné', () => {
    render(<RoomLobby room={ROOM} currentUser={CURRENT_USER} />);

    expect(screen.getByText('Choisir un héros')).toBeInTheDocument();
    expect(screen.queryByText('Héros sélectionné')).not.toBeInTheDocument();
  });

  it('ouvre la modal de sélection au clic sur "Choisir un héros"', () => {
    render(<RoomLobby room={ROOM} currentUser={CURRENT_USER} />);

    expect(screen.queryByTestId('character-modal')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('Choisir un héros'));

    expect(screen.getByTestId('character-modal')).toBeInTheDocument();
  });

  it('retombe sur les valeurs brutes si race/classe sont inconnues', () => {
    hookReturn.players = [
      player({
        characterId: 'char_x',
        character: { name: 'Inconnu', race: 'DRAGON', class: 'NECROMANCER' },
      }),
    ];

    render(<RoomLobby room={ROOM} currentUser={CURRENT_USER} />);

    expect(screen.getByText(/DRAGON · NECROMANCER/)).toBeInTheDocument();
  });
});
