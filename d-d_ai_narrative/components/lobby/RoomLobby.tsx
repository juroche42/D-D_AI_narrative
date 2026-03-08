'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Copy, Check, Layout, User,
  AlertCircle, ExternalLink, LogOut, Loader2, Swords,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { RoomPublic } from '@/lib/services/room';
import { PlayerList } from '@/components/lobby/PlayerList';
import { RoomStatusBadge } from '@/components/lobby/RoomStatusBadge';
import { leaveRoomAction, startGameAction } from '@/app/(lobby)/lobby/actions';
import { useRoomPlayers } from '@/hooks/useRoomPlayers';

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
  const [isPendingLeave, startLeaveTransition] = useTransition();
  const [isStarting, startStartTransition] = useTransition();
  const [startError, setStartError] = useState<string | null>(null);

  const { players, roomStatus } = useRoomPlayers(room.code);
  const isHost = currentUser.id === room.hostId;
  const canStart = isHost && roomStatus === 'WAITING' && players.length >= 2;

  function handleLeave() {
    startLeaveTransition(async () => {
      const result = await leaveRoomAction(room.code);
      if (result.success) {
        router.push('/lobby');
      }
    });
  }

  function handleStart() {
    setStartError(null);
    startStartTransition(async () => {
      const result = await startGameAction(room.code);
      if (!result.success) {
        setStartError(result.error ?? 'Impossible de démarrer');
      }
    });
  }

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
                <div className="space-y-2">
                  <h3 className="text-3xl font-black text-white uppercase italic tracking-tight">
                    {room.name}
                  </h3>
                  <RoomStatusBadge status={roomStatus} size="sm" />
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
                <div className="flex gap-4 items-center">
                  <Button
                    variant="outline"
                    onClick={handleLeave}
                    disabled={isPendingLeave}
                    className="border-white/20 text-gray-500 font-black uppercase tracking-widest text-xs hover:border-red-900/50 hover:text-red-500 transition-colors"
                  >
                    {isPendingLeave ? <Loader2 size={14} className="animate-spin" /> : <LogOut size={14} />}
                    Quitter
                  </Button>

                  {isHost ? (
                    <Button
                      onClick={handleStart}
                      disabled={!canStart || isStarting}
                      className={`font-black uppercase tracking-widest text-xs px-10 transition-all ${
                        canStart
                          ? 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/20'
                          : 'bg-red-600/20 text-red-900 cursor-not-allowed'
                      }`}
                    >
                      {isStarting
                        ? <><Loader2 size={14} className="animate-spin" /> Démarrage...</>
                        : <><Swords size={14} /> {"Démarrer l'Aventure"}</>
                      }
                    </Button>
                  ) : null}
                </div>

                {/* Message host : attente joueurs */}
                {isHost && !canStart && roomStatus === 'WAITING' && (
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-600">
                    {players.length < 2 ? "En attente d'un 2ème joueur" : 'La partie peut démarrer'}
                  </p>
                )}

                {/* Erreur démarrage */}
                {startError && (
                  <p className="text-[10px] font-black uppercase tracking-widest text-red-500 animate-in fade-in">
                    {startError}
                  </p>
                )}

                {/* Message non-host */}
                {!isHost && (
                  <div className="bg-red-950/20 border border-red-900/30 px-4 py-2 rounded-lg">
                    <p className="text-[10px] text-red-500 font-black uppercase tracking-widest flex items-center gap-2">
                      <AlertCircle size={12} />
                      {roomStatus === 'WAITING'
                        ? 'En attente du host pour démarrer'
                        : 'La partie est en cours...'}
                    </p>
                  </div>
                )}
              </div>

            </CardContent>
          </Card>
        </div>

        {/* ── Liste des joueurs (temps réel via SSE) ── */}
        <Card className="bg-[#16161a] border-white/5 rounded-2xl shadow-xl">
          <CardContent className="p-8">
            <PlayerList
              roomCode={room.code}
              currentUserId={currentUser.id}
              maxPlayers={room.maxPlayers}
            />
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
