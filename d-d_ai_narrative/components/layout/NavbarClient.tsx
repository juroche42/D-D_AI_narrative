'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { UserMenu } from './UserMenu';
import { LogoutButton } from './LogoutButton';

interface NavbarClientProps {
  user: {
    id: string;
    username: string;
  } | null;
}

const NAV_LINKS = [
  { href: '/campaigns', label: 'Catalogue' },
  { href: '/', label: 'Aventures' },
] as const;

export function NavbarClient({ user }: NavbarClientProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex items-center gap-4 md:gap-8">
      {/* Liens de navigation desktop */}
      <div className="hidden md:flex items-center gap-6 text-xs uppercase tracking-widest font-black">
        {NAV_LINKS.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className="text-gray-400 hover:text-red-500 transition-colors"
          >
            {label}
          </Link>
        ))}
      </div>

      {/* Zone droite — conditionnelle selon auth */}
      {user ? (
        <UserMenu username={user.username} />
      ) : (
        <Link
          href="/login"
          className="flex items-center justify-center px-6 py-2 rounded-lg border border-white/20 hover:bg-white/5 text-gray-200 text-xs font-black uppercase tracking-widest transition-all"
        >
          Connexion
        </Link>
      )}

      {/* Burger mobile */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="md:hidden text-gray-400 hover:text-white transition-colors"
        aria-label={mobileOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
      >
        {mobileOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Menu mobile */}
      {mobileOpen && (
        <div className="absolute top-full left-0 right-0 bg-[#16161a] border-b border-red-900/30 p-6 space-y-4 md:hidden z-40 animate-in slide-in-from-top-2">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className="block text-sm font-black uppercase tracking-widest text-gray-400 hover:text-red-500 transition-colors py-2"
            >
              {label}
            </Link>
          ))}
          {user && (
            <div className="border-t border-white/5 pt-4">
              <LogoutButton variant="menu-item" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
