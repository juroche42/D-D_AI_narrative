import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { LogoutButton } from './LogoutButton';

vi.mock('@/app/(auth)/logout/actions', () => ({
  logoutAction: vi.fn().mockResolvedValue(undefined),
}));

import { logoutAction } from '@/app/(auth)/logout/actions';

describe('LogoutButton', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('variant header (défaut)', () => {
    it('rend un bouton avec aria-label accessible', () => {
      render(<LogoutButton variant="header" />);
      expect(screen.getByRole('button', { name: /se déconnecter/i })).toBeInTheDocument();
    });

    it('appelle logoutAction au clic', () => {
      render(<LogoutButton variant="header" />);
      fireEvent.click(screen.getByRole('button', { name: /se déconnecter/i }));
      expect(logoutAction).toHaveBeenCalledTimes(1);
    });

    it('désactive le bouton pendant la déconnexion', () => {
      vi.mocked(logoutAction).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100)),
      );
      render(<LogoutButton variant="header" />);
      act(() => {
        fireEvent.click(screen.getByRole('button', { name: /se déconnecter/i }));
      });
      expect(screen.getByRole('button')).toBeDisabled();
    });
  });

  describe('variant menu-item', () => {
    it('affiche le texte "Se déconnecter"', () => {
      render(<LogoutButton variant="menu-item" />);
      expect(screen.getByText(/se déconnecter/i)).toBeInTheDocument();
    });

    it('appelle logoutAction au clic', () => {
      render(<LogoutButton variant="menu-item" />);
      fireEvent.click(screen.getByRole('button'));
      expect(logoutAction).toHaveBeenCalledTimes(1);
    });
  });
});
