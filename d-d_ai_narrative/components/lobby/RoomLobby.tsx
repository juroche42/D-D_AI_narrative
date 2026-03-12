'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Copy, Check, Layout, User,
  AlertCircle, ExternalLink, LogOut, Loader2, Swords, Pencil,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { RoomPublic } from '@/lib/services/room';
import { PlayerList } from '@/components/lobby/PlayerList';
import { RoomStatusBadge } from '@/components/lobby/RoomStatusBadge';
import { leaveRoomAction, startGameAction, toggleReadyAction } from '@/app/(lobby)/lobby/actions';
import { useRoomPlayers } from '@/hooks/useRoomPlayers';
import { THEME_CONFIG, DIFFICULTY_CONFIG, type CampaignThemeKey, type CampaignDifficultyKey } from '@/lib/constants/campaign';
import { CampaignSelectModal } from '@/components/lobby/CampaignSelectModal';

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
  const [isPendingReady, startReadyTransition] = useTransition();
  const [startError, setStartError] = useState<string | null>(null);
  const [readyError, setReadyError] = useState<string | null>(null);
  const [showCampaignModal, setShowCampaignModal] = useState(false);

  const { players, roomStatus, status: sseStatus, error: sseError, selectedCampaign } = useRoomPlayers(room.code, room.campaign ?? undefined);
  const myPlayer = players.find(p => p.userId === currentUser.id);
  const isHost = myPlayer?.isHost ?? (currentUser.id === room.hostId);
  const iAmReady = myPlayer?.isReady ?? false;
  const canStart = isHost && roomStatus === 'WAITING' && players.length >= 2 && selectedCampaign !== null;

  const nonHostPlayers = players.filter(p => !p.isHost);
  const readyCount = nonHostPlayers.filter(p => p.isReady).length;
  const allReady = nonHostPlayers.length > 0 && nonHostPlayers.every(p => p.isReady);

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

  function handleToggleReady() {
    setReadyError(null);
    startReadyTransition(async () => {
      const result = await toggleReadyAction(room.code);
      if (!result.success) {
        setReadyError(result.error ?? 'Impossible de mettre à jour votre statut');
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

              {/* Slots campagne + personnage */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Sélection campagne */}
                {selectedCampaign ? (
                  <div className="bg-black/20 p-6 rounded-2xl border border-white/10 flex flex-col gap-3 min-h-30 relative overflow-hidden group">
                    <div className={`absolute top-0 left-0 right-0 h-0.5 ${THEME_CONFIG[selectedCampaign.theme as CampaignThemeKey]?.bar ?? 'bg-gray-600/60'}`} />
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-600">Scénario sélectionné</p>
                    <p className="text-sm font-black text-white uppercase italic leading-tight line-clamp-2">
                      {selectedCampaign.title}
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      <span className={`text-[9px] font-black uppercase tracking-widest ${THEME_CONFIG[selectedCampaign.theme as CampaignThemeKey]?.color ?? 'text-gray-400'}`}>
                        {THEME_CONFIG[selectedCampaign.theme as CampaignThemeKey]?.label ?? selectedCampaign.theme}
                      </span>
                      <span className="text-gray-700">·</span>
                      <span className={`text-[9px] font-black uppercase tracking-widest ${DIFFICULTY_CONFIG[selectedCampaign.difficulty as CampaignDifficultyKey]?.color ?? 'text-gray-400'}`}>
                        {DIFFICULTY_CONFIG[selectedCampaign.difficulty as CampaignDifficultyKey]?.label ?? selectedCampaign.difficulty}
                      </span>
                    </div>
                    {isHost && roomStatus === 'WAITING' && (
                      <button
                        onClick={() => setShowCampaignModal(true)}
                        className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"
                      >
                        <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white">
                          <Pencil size={12} /> Changer
                        </span>
                      </button>
                    )}
                  </div>
                ) : isHost && roomStatus === 'WAITING' ? (
                  <button
                    onClick={() => setShowCampaignModal(true)}
                    className="bg-black/20 p-6 rounded-2xl border border-dashed border-red-900/40 flex flex-col items-center justify-center gap-2 min-h-30 text-gray-600 hover:border-red-600/60 hover:text-red-500 transition-colors"
                  >
                    <Layout size={28} />
                    <p className="text-xs font-bold uppercase tracking-wide">Choisir un scénario</p>
                  </button>
                ) : (
                  <div className="bg-black/20 p-6 rounded-2xl border border-dashed border-white/10 flex flex-col items-center justify-center gap-2 min-h-30 text-gray-700">
                    <Layout size={28} />
                    <p className="text-xs font-bold uppercase tracking-wide">Aucun scénario</p>
                    <p className="text-[10px] uppercase tracking-widest opacity-60">En attente du host</p>
                  </div>
                )}

                {/* US-04-04 — Sélection personnage */}
                <div className="bg-black/20 p-6 rounded-2xl border border-dashed border-white/10 flex flex-col items-center justify-center gap-2 min-h-30 text-gray-700 cursor-not-allowed">
                  <User size={28} />
                  <p className="text-xs font-bold uppercase tracking-wide">Créer votre héros</p>
                  <p className="text-[10px] uppercase tracking-widest opacity-60">US-04-04</p>
                </div>
              </div>

              {/* Footer actions */}
              <div className="pt-6 border-t border-white/5 flex flex-col items-end gap-3">
                <div className="flex gap-4 items-center flex-wrap justify-end">

                  {/* Bouton Quitter — tous les joueurs */}
                  <Button
                    variant="outline"
                    onClick={handleLeave}
                    disabled={isPendingLeave}
                    className="border-white/20 text-gray-500 font-black uppercase tracking-widest text-xs hover:border-red-900/50 hover:text-red-500 transition-colors"
                  >
                    {isPendingLeave ? <Loader2 size={14} className="animate-spin" /> : <LogOut size={14} />}
                    Quitter
                  </Button>

                  {/* Bouton Prêt — non-host uniquement, en phase WAITING */}
                  {!isHost && roomStatus === 'WAITING' && (
                    <Button
                      variant="outline"
                      onClick={handleToggleReady}
                      disabled={isPendingReady}
                      className={`font-black uppercase tracking-widest text-xs transition-colors ${
                        iAmReady
                          ? 'border-green-700 text-green-500 bg-green-950/20 hover:border-red-900/50 hover:text-red-500'
                          : 'border-white/20 text-gray-400 hover:border-green-700 hover:text-green-400'
                      }`}
                    >
                      {isPendingReady
                        ? <Loader2 size={14} className="animate-spin" />
                        : iAmReady
                        ? <><Check size={14} /> Prêt</>
                        : 'Je suis prêt'
                      }
                    </Button>
                  )}

                  {/* Bouton Démarrer — host uniquement */}
                  {isHost && (
                    <Button
                      onClick={handleStart}
                      disabled={!canStart || isStarting}
                      className={`font-black uppercase tracking-widest text-xs px-10 transition-all ${
                        canStart && allReady
                          ? 'bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-600/20'
                          : canStart
                          ? 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/20'
                          : 'bg-red-600/20 text-red-900 cursor-not-allowed'
                      }`}
                    >
                      {isStarting
                        ? <><Loader2 size={14} className="animate-spin" /> Démarrage...</>
                        : canStart && allReady
                        ? <><Swords size={14} /> Lancer la Partie !</>
                        : <><Swords size={14} /> {"Démarrer l'Aventure"}</>
                      }
                    </Button>
                  )}
                </div>

                {/* Message host : campagne manquante */}
                {isHost && roomStatus === 'WAITING' && !selectedCampaign && (
                  <p className="text-[10px] font-black uppercase tracking-widest text-red-700">
                    Sélectionnez d&apos;abord une campagne
                  </p>
                )}

                {/* Message host : compteur prêts */}
                {isHost && roomStatus === 'WAITING' && selectedCampaign && (
                  <p className={`text-[10px] font-black uppercase tracking-widest ${
                    allReady ? 'text-green-500' : 'text-gray-500'
                  }`}>
                    {players.length < 2
                      ? "En attente d'un 2ème joueur"
                      : allReady
                      ? '✓ Tous les joueurs sont prêts !'
                      : `${readyCount}/${nonHostPlayers.length} joueur${nonHostPlayers.length > 1 ? 's' : ''} prêt${readyCount > 1 ? 's' : ''}`
                    }
                  </p>
                )}

                {/* Erreur démarrage */}
                {startError && (
                  <p className="text-[10px] font-black uppercase tracking-widest text-red-500 animate-in fade-in">
                    {startError}
                  </p>
                )}

                {/* Erreur toggle prêt */}
                {readyError && (
                  <p className="text-[10px] font-black uppercase tracking-widest text-red-500 animate-in fade-in">
                    {readyError}
                  </p>
                )}
        
                {/* Message non-host */}
                {!isHost && (
                  <div className={`border px-4 py-2 rounded-lg ${
                    iAmReady
                      ? 'bg-green-950/20 border-green-900/30'
                      : 'bg-red-950/20 border-red-900/30'
                  }`}>
                    <p className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${
                      iAmReady ? 'text-green-500' : 'text-red-500'
                    }`}>
                      <AlertCircle size={12} />
                      {roomStatus === 'WAITING'
                        ? iAmReady
                          ? 'Vous êtes prêt — en attente du host'
                          : 'Marquez-vous prêt ou attendez le host'
                        : 'La partie est en cours...'
                      }
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
              players={players}
              status={sseStatus}
              error={sseError}
            />
          </CardContent>
        </Card>

      </div>

      {showCampaignModal && (
        <CampaignSelectModal
          roomCode={room.code}
          currentCampaignId={selectedCampaign?.id ?? null}
          onClose={() => setShowCampaignModal(false)}
        />
      )}
    </div>
  );
}
