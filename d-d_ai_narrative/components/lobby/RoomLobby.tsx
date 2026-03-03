'use client';

import { useState } from 'react';
import {
  Copy, Check, Users, Crown, Layout, User,
  AlertCircle, ExternalLink, LogOut,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import type { RoomPublic } from '@/lib/services/room';

interface CurrentUser {
  id: string;
  username: string;
}

interface RoomLobbyProps {
  room: RoomPublic;
  currentUser: CurrentUser;
}

export function RoomLobby({ room, currentUser }: RoomLobbyProps) {
  const router = useRouter();
  const [codeCopied, setCodeCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const copy = async (text: string, type: 'code' | 'link') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'code') {
        setCodeCopied(true);
        setTimeout(() => setCodeCopied(false), 2000);
      } else {
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2000);
      }
    } catch {
      // Clipboard API non disponible — silencieux
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="grid lg:grid-cols-3 gap-8">

        {/* ── Colonne principale ── */}
        <div className="lg:col-span-2">
          <Card className="bg-[#16161a] border-white/5 rounded-2xl shadow-xl">
            <CardContent className="p-8 space-y-10">

              {/* Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1">
                  <h3 className="text-3xl font-black text-white uppercase italic tracking-tight">
                    {room.name}
                  </h3>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                    État : En préparation
                  </p>
                </div>

                {/* Code d'invitation */}
                <div className="flex items-center gap-3 bg-black/40 px-5 py-3 border border-red-900/30 rounded-xl shadow-inner">
                  <span className="text-2xl font-mono font-black text-red-600 tracking-widest select-all">
                    {room.code}
                  </span>
                  <button
                    onClick={() => copy(room.code, 'code')}
                    aria-label="Copier le code"
                    className="text-gray-500 hover:text-white transition-colors"
                  >
                    {codeCopied
                      ? <Check size={16} className="text-green-500" />
                      : <Copy size={16} />
                    }
                  </button>
                </div>
              </div>

              {/* Lien d'invitation */}
              <div className="bg-black/20 rounded-xl border border-white/5 p-4 flex items-center gap-3">
                <ExternalLink size={14} className="text-gray-600 flex-shrink-0" />
                <p className="text-xs font-mono text-gray-500 truncate flex-grow">
                  {room.inviteLink}
                </p>
                <button
                  onClick={() => copy(room.inviteLink, 'link')}
                  className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                >
                  {linkCopied
                    ? <><Check size={12} className="text-green-500" /> Copié !</>
                    : <><Copy size={12} /> Copier le lien</>
                  }
                </button>
              </div>

              {/* Slots campagne + personnage — placeholders pour US suivantes */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* US-06-03 — Sélection campagne */}
                <div className="bg-black/20 p-6 rounded-2xl border border-dashed border-white/10 flex flex-col items-center justify-center gap-2 min-h-[120px] text-gray-700 cursor-not-allowed">
                  <Layout size={28} />
                  <p className="text-xs font-bold uppercase tracking-wide">Choisir un scénario</p>
                  <p className="text-[10px] uppercase tracking-widest opacity-60">US-06-03</p>
                </div>

                {/* US-04-04 — Sélection personnage */}
                <div className="bg-black/20 p-6 rounded-2xl border border-dashed border-white/10 flex flex-col items-center justify-center gap-2 min-h-[120px] text-gray-700 cursor-not-allowed">
                  <User size={28} />
                  <p className="text-xs font-bold uppercase tracking-wide">Créer votre héros</p>
                  <p className="text-[10px] uppercase tracking-widest opacity-60">US-04-04</p>
                </div>
              </div>

              {/* Footer actions */}
              <div className="pt-6 border-t border-white/5 flex flex-col items-end gap-3">
                <div className="flex gap-4">
                  <Button
                    variant="outline"
                    className="border-white/20 hover:bg-white/5 text-gray-300 font-black uppercase tracking-widest text-xs"
                    onClick={() => router.push('/lobby')}
                  >
                    <LogOut size={14} />
                    Quitter
                  </Button>

                  <Button
                    disabled
                    className="bg-red-600 text-white font-black uppercase tracking-widest text-xs px-10 opacity-40 cursor-not-allowed"
                  >
                    {"Démarrer l'Aventure"}
                  </Button>
                </div>

                <div className="bg-red-950/20 border border-red-900/30 px-4 py-2 rounded-lg">
                  <p className="text-[10px] text-red-500 font-black uppercase tracking-widest flex items-center gap-2">
                    <AlertCircle size={12} />
                    En attente des autres joueurs
                  </p>
                </div>
              </div>

            </CardContent>
          </Card>
        </div>

        {/* ── Liste des joueurs ── */}
        <Card className="bg-[#16161a] border-white/5 rounded-2xl shadow-xl">
          <CardContent className="p-8">
            <div className="flex justify-between items-center mb-8 pb-4 border-b border-white/5">
              <h3 className="text-xl font-black text-white uppercase italic tracking-tight">
                Confrérie (1/{room.maxPlayers})
              </h3>
              <Users size={18} className="text-red-600" />
            </div>

            <div className="space-y-4">
              {/* Host = utilisateur actuel */}
              <div className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-red-900/40 flex items-center justify-center border border-red-900/20 shadow-lg">
                      <Crown size={18} className="text-red-500" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">
                        {currentUser.username}
                        <span className="text-gray-500 font-normal text-xs ml-1">(Vous)</span>
                      </p>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Host</p>
                    </div>
                  </div>
                  <Badge className="text-[9px] font-black uppercase bg-white/5 text-gray-500 border border-white/10 hover:bg-white/5">
                    En ligne
                  </Badge>
                </div>

                <div className="flex items-center gap-3 p-3 bg-black/20 rounded-lg border border-dashed border-white/10 text-gray-600">
                  <AlertCircle size={14} />
                  <p className="text-[10px] font-bold uppercase tracking-wide italic">Destin non scellé</p>
                </div>
              </div>

              {/* Slots vides */}
              {Array.from({ length: Math.min(room.maxPlayers - 1, 4) }).map((_, i) => (
                <div
                  key={i}
                  className="p-4 bg-black/10 rounded-xl border border-dashed border-white/5 flex items-center gap-3 text-gray-800"
                >
                  <div className="w-10 h-10 rounded-lg border border-dashed border-white/5 flex items-center justify-center">
                    <User size={16} />
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-widest italic">
                    {"En attente d'un héros..."}
                  </p>
                </div>
              ))}
            </div>

            {/* Instructions */}
            <div className="mt-8 pt-6 border-t border-white/5 space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-600">
                Invitez vos alliés
              </p>
              <p className="text-[10px] text-gray-700 font-sans leading-relaxed">
                Partagez le code{' '}
                <span className="font-mono text-red-700 font-bold">{room.code}</span>
                {' '}ou le lien pour rejoindre.
              </p>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
