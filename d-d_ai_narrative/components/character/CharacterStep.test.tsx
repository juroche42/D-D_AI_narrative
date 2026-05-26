import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CharacterStep } from './CharacterStep';
import { RACE_DEFINITIONS } from '@/lib/constants/races';
import { CLASS_DEFINITIONS } from '@/lib/constants/classes';

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

const defaultProps = {
  races: RACE_DEFINITIONS,
  classes: CLASS_DEFINITIONS,
};

describe('CharacterStep', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  describe('étape 0 — Lignée', () => {
    it('affiche toutes les races', () => {
      render(<CharacterStep {...defaultProps} />);
      expect(screen.getByText('Humain')).toBeInTheDocument();
      expect(screen.getByText('Elfe')).toBeInTheDocument();
      expect(screen.getByText('Nain')).toBeInTheDocument();
      expect(screen.getByText('Demi-Orc')).toBeInTheDocument();
      expect(screen.getByText('Tieffelin')).toBeInTheDocument();
      expect(screen.getByText('Halfelin')).toBeInTheDocument();
    });

    it('affiche les bonus des races', () => {
      render(<CharacterStep {...defaultProps} />);
      expect(screen.getAllByText('+1 À DEXTÉRITÉ').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('+1 À CONSTITUTION')).toBeInTheDocument();
    });

    it('le bouton Suivant est désactivé sans sélection', () => {
      render(<CharacterStep {...defaultProps} />);
      expect(screen.getByRole('button', { name: /suivant/i })).toBeDisabled();
    });

    it('le bouton Précédent est désactivé à l\'étape 0', () => {
      render(<CharacterStep {...defaultProps} />);
      expect(screen.getByRole('button', { name: /précédent/i })).toBeDisabled();
    });

    it('le bouton Suivant est activé après sélection d\'une race', () => {
      render(<CharacterStep {...defaultProps} />);
      fireEvent.click(screen.getByText('Elfe'));
      expect(screen.getByRole('button', { name: /suivant/i })).not.toBeDisabled();
    });
  });

  describe('navigation vers étape 1 — Vocation', () => {
    it('affiche toutes les classes après sélection d\'une race', () => {
      render(<CharacterStep {...defaultProps} />);
      fireEvent.click(screen.getByText('Elfe'));
      fireEvent.click(screen.getByRole('button', { name: /suivant/i }));

      expect(screen.getByText('Guerrier')).toBeInTheDocument();
      expect(screen.getByText('Mage')).toBeInTheDocument();
      expect(screen.getByText('Voleur')).toBeInTheDocument();
      expect(screen.getByText('Clerc')).toBeInTheDocument();
      expect(screen.getByText('Barde')).toBeInTheDocument();
      expect(screen.getByText('Rôdeur')).toBeInTheDocument();
    });

    it('affiche la compétence de chaque classe', () => {
      render(<CharacterStep {...defaultProps} />);
      fireEvent.click(screen.getByText('Elfe'));
      fireEvent.click(screen.getByRole('button', { name: /suivant/i }));

      expect(screen.getByText('COMPÉTENCE : SECOND SOUFFLE')).toBeInTheDocument();
    });

    it('le bouton Suivant est désactivé sans sélection de classe', () => {
      render(<CharacterStep {...defaultProps} />);
      fireEvent.click(screen.getByText('Elfe'));
      fireEvent.click(screen.getByRole('button', { name: /suivant/i }));

      expect(screen.getByRole('button', { name: /suivant/i })).toBeDisabled();
    });

    it('le bouton Précédent ramène à l\'étape 0', () => {
      render(<CharacterStep {...defaultProps} />);
      fireEvent.click(screen.getByText('Elfe'));
      fireEvent.click(screen.getByRole('button', { name: /suivant/i }));
      fireEvent.click(screen.getByRole('button', { name: /précédent/i }));

      expect(screen.getByText('Humain')).toBeInTheDocument();
    });

    it('la sélection de race est conservée au retour étape 0', () => {
      render(<CharacterStep {...defaultProps} />);
      fireEvent.click(screen.getByText('Elfe'));
      fireEvent.click(screen.getByRole('button', { name: /suivant/i }));
      fireEvent.click(screen.getByRole('button', { name: /précédent/i }));
      fireEvent.click(screen.getByRole('button', { name: /suivant/i }));

      expect(screen.getByText('Guerrier')).toBeInTheDocument();
    });
  });

  describe('navigation vers étape 2 — Identité', () => {
    function goToStep2() {
      render(<CharacterStep {...defaultProps} />);
      fireEvent.click(screen.getByText('Elfe'));
      fireEvent.click(screen.getByRole('button', { name: /suivant/i }));
      fireEvent.click(screen.getByText('Mage'));
      fireEvent.click(screen.getByRole('button', { name: /suivant/i }));
    }

    it('affiche le champ de saisie du nom', () => {
      goToStep2();
      expect(screen.getByPlaceholderText(/entrez un nom/i)).toBeInTheDocument();
    });

    it('affiche le bouton Finaliser', () => {
      goToStep2();
      expect(screen.getByRole('button', { name: /finaliser/i })).toBeInTheDocument();
    });

    it('Finaliser est désactivé si le nom est vide', () => {
      goToStep2();
      expect(screen.getByRole('button', { name: /finaliser/i })).toBeDisabled();
    });

    it('Finaliser est désactivé si le nom a moins de 2 caractères', () => {
      goToStep2();
      fireEvent.change(screen.getByPlaceholderText(/entrez un nom/i), {
        target: { value: 'A' },
      });
      expect(screen.getByRole('button', { name: /finaliser/i })).toBeDisabled();
    });

    it('Finaliser est activé avec un nom valide (>= 2 chars)', () => {
      goToStep2();
      fireEvent.change(screen.getByPlaceholderText(/entrez un nom/i), {
        target: { value: 'Nangaim' },
      });
      expect(screen.getByRole('button', { name: /finaliser/i })).not.toBeDisabled();
    });

    it('affiche l\'aperçu du personnage avec la race et la classe', () => {
      goToStep2();
      expect(screen.getByText(/elfe/i)).toBeInTheDocument();
      expect(screen.getByText(/mage/i)).toBeInTheDocument();
    });

    it('le nom saisi apparaît dans l\'aperçu', () => {
      goToStep2();
      fireEvent.change(screen.getByPlaceholderText(/entrez un nom/i), {
        target: { value: 'Nangaim' },
      });
      expect(screen.getAllByText('Nangaim').length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('soumission du formulaire', () => {
    function goToStep2AndFill(name = 'Nangaim') {
      render(<CharacterStep {...defaultProps} />);
      fireEvent.click(screen.getByText('Elfe'));
      fireEvent.click(screen.getByRole('button', { name: /suivant/i }));
      fireEvent.click(screen.getByText('Mage'));
      fireEvent.click(screen.getByRole('button', { name: /suivant/i }));
      fireEvent.change(screen.getByPlaceholderText(/entrez un nom/i), {
        target: { value: name },
      });
    }

    it('appelle POST /api/characters avec les bonnes données', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: {} }),
      } as Response);

      goToStep2AndFill('Nangaim');
      fireEvent.click(screen.getByRole('button', { name: /finaliser/i }));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/characters',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: 'Nangaim',
              race: 'ELF',
              class: 'MAGE',
              stats: {
                strength: 10,
                dexterity: 10,
                constitution: 10,
                intelligence: 10,
                wisdom: 10,
                charisma: 10,
              },
            }),
          }),
        );
      });
    });

    it('redirige vers "/" après création réussie', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: {} }),
      } as Response);

      goToStep2AndFill('Nangaim');
      fireEvent.click(screen.getByRole('button', { name: /finaliser/i }));

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/');
      });
    });

    it('affiche le message d\'erreur API en cas d\'échec', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: false,
        json: async () => ({ success: false, message: 'Un personnage nommé "Nangaim" existe déjà.' }),
      } as Response);

      goToStep2AndFill('Nangaim');
      fireEvent.click(screen.getByRole('button', { name: /finaliser/i }));

      await waitFor(() => {
        expect(
          screen.getByText('Un personnage nommé "Nangaim" existe déjà.'),
        ).toBeInTheDocument();
      });
    });

    it('affiche une erreur réseau si fetch échoue', async () => {
      vi.mocked(global.fetch).mockRejectedValue(new Error('Network error'));

      goToStep2AndFill('Nangaim');
      fireEvent.click(screen.getByRole('button', { name: /finaliser/i }));

      await waitFor(() => {
        expect(screen.getByText('Une erreur réseau est survenue.')).toBeInTheDocument();
      });
    });
  });
});
