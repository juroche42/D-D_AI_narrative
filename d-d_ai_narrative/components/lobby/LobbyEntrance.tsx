'use client';

import { useState, useTransition } from 'react';
import { Loader2, Plus, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createRoomAction } from '@/app/(lobby)/lobby/actions';

interface LobbyEntranceProps {
  username: string;
}

export function LobbyEntrance({ username }: LobbyEntranceProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleCreate = () => {
    setError(null);
    startTransition(async () => {
      const result = await createRoomAction();
      if (!result.success || !result.room) {
        setError(result.error ?? 'Une erreur est survenue');
        return;
      }
      router.push(`/lobby/${result.room.code}`);
    });
  };

  return (
    <div className="max-w-xl mx-auto mt-20 text-center space-y-8 animate-in fade-in duration-700">
      <div className="space-y-3">
        <h2 className="text-5xl font-black text-white uppercase italic tracking-tighter">
          {"Salon d'attente"}
        </h2>
        <p className="text-gray-400 font-sans text-sm leading-relaxed">
          {"Préparez votre groupe avant de plonger dans l'abysse."}
        </p>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-900/40 rounded-xl px-4 py-3 animate-in fade-in">
          <p className="text-xs font-black uppercase tracking-widest text-red-400">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {/* Créer un salon */}
        <button
          onClick={handleCreate}
          disabled={isPending}
          className="flex flex-col items-center justify-center gap-3 py-10 px-6 bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl font-black uppercase tracking-widest text-sm transition-all shadow-lg shadow-red-600/20 active:scale-95"
        >
          {isPending ? <Loader2 size={28} className="animate-spin" /> : <Plus size={28} />}
          {isPending ? 'Création...' : 'Créer un Salon'}
        </button>

        {/* Rejoindre — US-03-02, désactivé pour ce sprint */}
        <button
          disabled
          title="Disponible avec l'US-03-02"
          className="flex flex-col items-center justify-center gap-3 py-10 px-6 bg-transparent border border-white/20 text-gray-500 rounded-2xl font-black uppercase tracking-widest text-sm cursor-not-allowed opacity-50"
        >
          <Users size={28} />
          Rejoindre
        </button>
      </div>

      <p className="text-[10px] font-black uppercase tracking-widest text-gray-600">
        Connecté en tant que <span className="text-red-700">{username}</span>
      </p>
    </div>
  );
}
