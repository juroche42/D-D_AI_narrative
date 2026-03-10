'use client';

import { User, Scroll } from 'lucide-react';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogoutButton } from './LogoutButton';

interface UserMenuProps {
  username: string;
}

export function UserMenu({ username }: UserMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-3 bg-red-900/10 border border-red-900/30 border-dashed py-1.5 px-4 rounded-full cursor-pointer hover:bg-red-900/20 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600">
          <span className="text-xs font-bold hidden sm:inline text-red-500">
            {username}
          </span>
          <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center shadow-md border border-red-400/50">
            <User size={16} className="text-white" />
          </div>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-52 bg-[#16161a] border border-white/5 rounded-xl shadow-xl shadow-black/50 p-2"
      >
        <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-gray-500 px-2 py-1.5">
          {username}
        </DropdownMenuLabel>

        <DropdownMenuSeparator className="bg-white/5 my-1" />

        <DropdownMenuItem asChild>
          <Link
            href="/profile"
            className="flex items-center gap-3 px-2 py-2 text-xs font-black uppercase tracking-widest text-gray-300 hover:text-white hover:bg-white/5 rounded-lg cursor-pointer transition-all"
          >
            <User size={14} />
            Mon Profil
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link
            href="/campaigns/mine"
            className="flex items-center gap-3 px-2 py-2 text-xs font-black uppercase tracking-widest text-gray-300 hover:text-white hover:bg-white/5 rounded-lg cursor-pointer transition-all"
          >
            <Scroll size={14} />
            Mes Campagnes
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-white/5 my-1" />

        {/*
          NOTE future : quand la ProfilePage sera livrée, déplacer
          ce LogoutButton dans /profile et le supprimer ici.
          Ce composant est conçu pour être retiré sans refactoring (SRP).
        */}
        <div className="px-1">
          <LogoutButton variant="menu-item" />
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
