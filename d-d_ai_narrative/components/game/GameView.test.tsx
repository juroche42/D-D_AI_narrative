import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GameView, type GameViewProps } from './GameView';

vi.mock('@/hooks/useNarrativeStream', () => ({
  useNarrativeStream: () => ({
    text: '',
    status: 'idle',
    error: null,
    actions: [],
    currentTurn: 1,
    startStream: vi.fn(),
    reset: vi.fn(),
  }),
}));

vi.mock('@/hooks/useGameEvents', () => ({
  useGameEvents: () => ({
    actions: [],
    votes: [],
    myVote: null,
    currentTurn: 1,
    ready: false,
    error: null,
    castVote: vi.fn(),
    reconnect: vi.fn(),
  }),
}));

const baseProps: GameViewProps = {
  roomCode: 'ABC123',
  campaign: { title: 'La Forêt Maudite', theme: 'HORROR', difficulty: 'NORMAL' },
  currentPlayer: {
    userId: 'user_1',
    username: 'Moi',
    characterName: 'Aragorn',
    characterClass: 'RANGER',
    maxHp: 20,
    currentHp: 15,
    armorClass: 14,
  },
  isFirstTurn: false,
};

const OTHERS = [
  {
    userId: 'user_2',
    username: 'Bob',
    characterName: 'Gimli',
    characterClass: 'FIGHTER',
    maxHp: 30,
    currentHp: 30,
    armorClass: 16,
  },
  {
    userId: 'user_3',
    username: 'Alice',
    characterName: 'Elaria',
    characterClass: 'MAGE',
    maxHp: 8,
    currentHp: 4,
    armorClass: 12,
  },
];

describe('GameView — sidebar des compagnons', () => {
  it('affiche les stats des autres joueurs (nom, classe, PV, armure)', () => {
    render(<GameView {...baseProps} otherPlayers={OTHERS} />);

    expect(screen.getByText('Compagnons (2)')).toBeInTheDocument();

    // Personnage 1
    expect(screen.getByText('Gimli')).toBeInTheDocument();
    expect(screen.getByText('FIGHTER')).toBeInTheDocument();
    expect(screen.getByText('30/30')).toBeInTheDocument();
    expect(screen.getByText('16')).toBeInTheDocument();

    // Personnage 2
    expect(screen.getByText('Elaria')).toBeInTheDocument();
    expect(screen.getByText('MAGE')).toBeInTheDocument();
    expect(screen.getByText('4/8')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
  });

  it("n'affiche pas la section quand il n'y a aucun autre joueur", () => {
    render(<GameView {...baseProps} otherPlayers={[]} />);

    expect(screen.queryByText(/Compagnons/)).not.toBeInTheDocument();
  });

  it("n'affiche pas la section quand otherPlayers est absent", () => {
    render(<GameView {...baseProps} />);

    expect(screen.queryByText(/Compagnons/)).not.toBeInTheDocument();
  });

  it('retombe sur le pseudo si le compagnon n\'a pas de personnage', () => {
    render(
      <GameView
        {...baseProps}
        otherPlayers={[{ userId: 'user_9', username: 'SansPerso' }]}
      />,
    );

    expect(screen.getByText('Compagnons (1)')).toBeInTheDocument();
    expect(screen.getByText('SansPerso')).toBeInTheDocument();
  });
});
