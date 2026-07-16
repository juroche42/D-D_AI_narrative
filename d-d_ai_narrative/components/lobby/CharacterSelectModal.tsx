'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, Plus, User, Heart, Shield, Loader2 } from 'lucide-react';
import { RACE_MAP } from '@/lib/constants/races';
import { CLASS_MAP } from '@/lib/constants/classes';
import type { Race, CharClass } from '@/app/generated/prisma/enums';

interface CharacterSummary {
  id: string;
  name: string;
  race: Race;
  class: CharClass;
  level: number;
  maxHp: number;
  currentHp: number;
  armorClass: number;
}

interface CharacterSelectModalProps {
  onClose: () => void;
}

export function CharacterSelectModal({ onClose }: CharacterSelectModalProps) {
  const router = useRouter();
  const [characters, setCharacters] = useState<CharacterSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    fetch('/api/characters?limit=50')
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        if (!Array.isArray(data?.data)) {
          throw new Error(data?.message ?? 'Format de réponse inattendu');
        }
        setError(null);
        setCharacters(data.data);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Impossible de charger les personnages');
        setCharacters([]);
      })
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-[#16161a] border border-white/10 rounded-3xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <div>
            <h2 className="text-xl font-black text-white uppercase italic">
              Vos Héros
            </h2>
            <p className="text-[10px] text-gray-600 font-black uppercase tracking-widest mt-1">
              {characters.length} personnage{characters.length > 1 ? 's' : ''} disponible{characters.length > 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-600 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Liste */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-gray-600">
              <Loader2 size={20} className="animate-spin mr-2" />
              <span className="text-xs font-black uppercase tracking-widest">Chargement...</span>
            </div>
          ) : characters.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-gray-700">
              <User size={28} />
              <p className="text-sm font-black uppercase">Aucun héros</p>
              <p className="text-[10px] uppercase tracking-widest opacity-60">
                Créez votre premier personnage
              </p>
            </div>
          ) : (
            characters.map((character) => {
              const race = RACE_MAP[character.race];
              const charClass = CLASS_MAP[character.class];

              return (
                <div
                  key={character.id}
                  className="w-full p-4 rounded-xl border border-white/10 bg-black/20 flex items-center gap-4"
                >
                  <div className="w-12 h-12 flex-shrink-0 bg-red-900/40 rounded-xl flex items-center justify-center border border-red-900/30">
                    <User className="text-red-500" size={22} />
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="text-sm font-black text-white uppercase italic leading-tight truncate">
                      {character.name}
                    </p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest">
                      {race?.name ?? character.race} · {charClass?.name ?? character.class} · Nv. {character.level}
                    </p>
                  </div>

                  <div className="flex gap-3 flex-shrink-0">
                    <span className="text-[10px] font-bold text-gray-500 flex items-center gap-1">
                      <Heart size={11} className="text-red-500" />
                      {character.currentHp}/{character.maxHp}
                    </span>
                    <span className="text-[10px] font-bold text-gray-500 flex items-center gap-1">
                      <Shield size={11} className="text-sky-500" />
                      {character.armorClass}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Erreur */}
        {error && (
          <div className="px-6 py-3 border-t border-white/5">
            <p className="text-[10px] font-black uppercase tracking-widest text-red-500">{error}</p>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/5 flex justify-end">
          <button
            onClick={() => router.push('/characters/create')}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white font-black uppercase tracking-widest text-xs px-6 py-3 rounded-xl transition-colors shadow-lg shadow-red-600/20"
          >
            <Plus size={14} />
            Créer votre héros
          </button>
        </div>
      </div>
    </div>
  );
}
