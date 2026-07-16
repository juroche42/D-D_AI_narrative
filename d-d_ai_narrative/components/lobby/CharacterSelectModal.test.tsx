import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CharacterSelectModal } from './CharacterSelectModal';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

const mockSelectCharacterAction = vi.fn();
vi.mock('@/app/(lobby)/lobby/actions', () => ({
  selectCharacterAction: (...args: unknown[]) => mockSelectCharacterAction(...args),
}));

const CHARACTERS = [
  {
    id: 'char_1',
    name: 'Grommash',
    race: 'HALF_ORC',
    class: 'FIGHTER',
    level: 3,
    maxHp: 30,
    currentHp: 25,
    armorClass: 15,
  },
  {
    id: 'char_2',
    name: 'Elaria',
    race: 'ELF',
    class: 'MAGE',
    level: 1,
    maxHp: 8,
    currentHp: 8,
    armorClass: 12,
  },
];

function mockFetchResolve(data: unknown, ok = true) {
  vi.mocked(global.fetch).mockResolvedValue({
    ok,
    status: ok ? 200 : 500,
    json: async () => data,
  } as Response);
}

describe('CharacterSelectModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('charge et affiche la liste des personnages (nom, race, classe, PV, CA)', async () => {
    mockFetchResolve({ success: true, data: CHARACTERS });

    render(<CharacterSelectModal roomCode="ABC123" onClose={vi.fn()} />);

    expect(await screen.findByText('Grommash')).toBeInTheDocument();
    expect(screen.getByText('Elaria')).toBeInTheDocument();
    // Libellés FR de race + classe
    expect(screen.getByText(/Demi-Orc · Guerrier · Nv\. 3/)).toBeInTheDocument();
    expect(screen.getByText(/Elfe · Mage · Nv\. 1/)).toBeInTheDocument();
    // PV / CA
    expect(screen.getByText('25/30')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();
  });

  it('appelle /api/characters au montage', async () => {
    mockFetchResolve({ success: true, data: CHARACTERS });

    render(<CharacterSelectModal roomCode="ABC123" onClose={vi.fn()} />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/characters?limit=50');
    });
  });

  it('sélectionne un personnage puis ferme la modal', async () => {
    mockFetchResolve({ success: true, data: CHARACTERS });
    mockSelectCharacterAction.mockResolvedValue({ success: true });
    const onClose = vi.fn();

    render(<CharacterSelectModal roomCode="ABC123" onClose={onClose} />);

    fireEvent.click(await screen.findByText('Grommash'));

    await waitFor(() => {
      expect(mockSelectCharacterAction).toHaveBeenCalledWith('ABC123', 'char_1');
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('affiche une erreur si la sélection échoue et ne ferme pas', async () => {
    mockFetchResolve({ success: true, data: CHARACTERS });
    mockSelectCharacterAction.mockResolvedValue({ success: false, error: 'Salon introuvable' });
    const onClose = vi.fn();

    render(<CharacterSelectModal roomCode="ABC123" onClose={onClose} />);

    fireEvent.click(await screen.findByText('Elaria'));

    expect(await screen.findByText('Salon introuvable')).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('désactive le personnage déjà sélectionné (currentCharacterId)', async () => {
    mockFetchResolve({ success: true, data: CHARACTERS });

    render(
      <CharacterSelectModal roomCode="ABC123" currentCharacterId="char_1" onClose={vi.fn()} />,
    );

    const selected = (await screen.findByText('Grommash')).closest('button');
    expect(selected).toBeDisabled();
  });

  it('affiche un état vide quand le joueur n\'a aucun personnage', async () => {
    mockFetchResolve({ success: true, data: [] });

    render(<CharacterSelectModal roomCode="ABC123" onClose={vi.fn()} />);

    expect(await screen.findByText('Aucun héros')).toBeInTheDocument();
  });

  it('affiche une erreur si le chargement échoue', async () => {
    mockFetchResolve({ message: 'Boom' }, false);

    render(<CharacterSelectModal roomCode="ABC123" onClose={vi.fn()} />);

    expect(await screen.findByText(/HTTP 500/)).toBeInTheDocument();
  });

  it('redirige vers la création avec le code du salon', async () => {
    mockFetchResolve({ success: true, data: CHARACTERS });

    render(<CharacterSelectModal roomCode="ABC123" onClose={vi.fn()} />);
    await screen.findByText('Grommash');

    fireEvent.click(screen.getByRole('button', { name: /créer votre héros/i }));

    expect(mockPush).toHaveBeenCalledWith('/characters/create?room=ABC123');
  });

  it('ferme la modal via le bouton de fermeture', async () => {
    mockFetchResolve({ success: true, data: CHARACTERS });
    const onClose = vi.fn();

    render(<CharacterSelectModal roomCode="ABC123" onClose={onClose} />);
    await screen.findByText('Grommash');

    fireEvent.click(screen.getByRole('button', { name: /fermer/i }));

    expect(onClose).toHaveBeenCalled();
  });
});
