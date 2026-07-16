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

type CampaignInfo = { id: string; title: string; theme: string; difficulty: string } | null;

let hookReturn: {
  players: SSEPlayer[];
  roomStatus: string;
  status: string;
  error: string | null;
  selectedCampaign: CampaignInfo;
};

const CAMPAIGN: CampaignInfo = { id: 'camp_1', title: 'La Forêt', theme: 'FOREST', difficulty: 'NORMAL' };

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

describe('RoomLobby — démarrage conditionné par la sélection de personnage', () => {
  const HOST_USER = { id: 'user_host', username: 'Thorin' };

  function withCharacter(overrides: Partial<SSEPlayer>): SSEPlayer {
    return player({ characterId: 'char', character: { name: 'X', race: 'HUMAN', class: 'FIGHTER' }, ...overrides });
  }

  beforeEach(() => {
    vi.clearAllMocks();
    hookReturn = {
      players: [],
      roomStatus: 'WAITING',
      status: 'connected',
      error: null,
      selectedCampaign: CAMPAIGN,
    };
  });

  it('désactive le bouton Démarrer si un joueur n\'a pas de personnage', () => {
    hookReturn.players = [
      withCharacter({ userId: 'user_host', isHost: true }),
      player({ userId: 'user_2', isHost: false, isReady: true, characterId: null, character: null }),
    ];

    render(<RoomLobby room={ROOM} currentUser={HOST_USER} />);

    expect(screen.getByRole('button', { name: /démarrer l'aventure/i })).toBeDisabled();
    expect(screen.getByText('Chaque joueur doit choisir un personnage')).toBeInTheDocument();
  });

  it('active le bouton Démarrer quand tous les joueurs ont un personnage', () => {
    hookReturn.players = [
      withCharacter({ userId: 'user_host', isHost: true }),
      withCharacter({ userId: 'user_2', isHost: false, isReady: true }),
    ];

    render(<RoomLobby room={ROOM} currentUser={HOST_USER} />);

    expect(screen.getByRole('button', { name: /lancer la partie/i })).not.toBeDisabled();
    expect(screen.queryByText('Chaque joueur doit choisir un personnage')).not.toBeInTheDocument();
  });
});
