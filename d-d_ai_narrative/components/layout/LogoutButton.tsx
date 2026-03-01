'use client';

import { useTransition } from 'react';
import { LogOut, Loader2 } from 'lucide-react';
import { logoutAction } from '@/app/(auth)/logout/actions';

interface LogoutButtonProps {
  /** Variante visuelle selon le contexte d'affichage */
  variant?: 'header' | 'menu-item';
}

export function LogoutButton({ variant = 'header' }: LogoutButtonProps) {
  const [isPending, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(async () => {
      try {
        await logoutAction();
      } catch (error) {
        console.error('Erreur lors de la déconnexion:', error);
      }
    });
  };

  if (variant === 'menu-item') {
    return (
      <button
        onClick={handleLogout}
        disabled={isPending}
        className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-black uppercase tracking-widest text-red-500 hover:bg-red-900/20 rounded-lg transition-all disabled:opacity-50"
      >
        {isPending ? <Loader2 size={14} className="animate-spin" /> : <LogOut size={14} />}
        {isPending ? 'Déconnexion...' : 'Se déconnecter'}
      </button>
    );
  }

  // variant === 'header' — bouton compact pour la navbar
  return (
    <button
      onClick={handleLogout}
      disabled={isPending}
      aria-label="Se déconnecter"
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-red-900/30 bg-red-900/10 hover:bg-red-900/20 text-red-500 text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
    >
      {isPending ? (
        <Loader2 size={12} className="animate-spin" />
      ) : (
        <LogOut size={12} />
      )}
      {!isPending && <span className="hidden sm:inline">Quitter</span>}
    </button>
  );
}
