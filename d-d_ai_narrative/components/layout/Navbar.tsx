import Link from 'next/link';
import { Dice5 } from 'lucide-react';
import { auth } from '@/lib/auth';
import { NavbarClient } from './NavbarClient';

export async function Navbar() {
  const session = await auth();
  const user = session?.user ?? null;

  return (
    <nav className="border-b border-red-900/30 bg-[#16161a] px-6 py-4 flex justify-between items-center sticky top-0 z-50">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-3 group">
        <div className="bg-red-600 p-2 rounded-lg group-hover:rotate-12 transition-transform shadow-lg">
          <Dice5 className="text-white" size={24} />
        </div>
        <h1 className="text-xl md:text-2xl font-black tracking-tighter text-red-500 uppercase italic">
          D&amp;D AI-Narrative
        </h1>
      </Link>

      {/* Partie droite déléguée au Client Component */}
      <NavbarClient user={user ? { id: user.id, username: user.username } : null} />
    </nav>
  );
}
