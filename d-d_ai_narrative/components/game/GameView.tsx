'use client';

import { useState, useEffect } from 'react';
import { Loader2, Swords, ChevronRight, User, AlertTriangle, RotateCcw, Radio } from 'lucide-react';
import { useNarrativeStream } from '@/hooks/useNarrativeStream';
import { useGameEvents } from '@/hooks/useGameEvents';
import { useGameTimer } from '@/hooks/useGameTimer';
import { VoteTimer } from '@/components/game/VoteTimer';

// ─── Types ────────────────────────────────────────────────────────────────────

type GamePhase =
  | 'intro_loading'   // Intro en cours de génération
  | 'actions_loading' // Attente des actions via SSE persistant
  | 'voting'          // Joueurs votent (compteurs en direct)
  | 'scene_loading';  // Scène suivante en cours de génération

export interface CurrentPlayer {
  userId:          string;
  username:        string;
  characterName?:  string;
  characterClass?: string;
  maxHp?:          number;
  currentHp?:      number;
  armorClass?:     number;
}

export interface GameViewProps {
  roomCode:      string;
  campaign:      { title: string; theme: string; difficulty: string };
  currentPlayer: CurrentPlayer;
  isFirstTurn:   boolean;
  lastNarration?: string;
}

const THEME_GRADIENT: Record<string, string> = {
  HEROIC:        'from-yellow-950/20',
  HORROR:        'from-red-950/30',
  MYSTERY:       'from-purple-950/20',
  INVESTIGATION: 'from-blue-950/20',
};

// ─── Composant principal ──────────────────────────────────────────────────────

export function GameView({ roomCode, campaign, currentPlayer, isFirstTurn, lastNarration }: GameViewProps) {
  const [phase, setPhase]               = useState<GamePhase>('intro_loading');
  const [narrativeHistory, setHistory]  = useState<string[]>(lastNarration ? [lastNarration] : []);
  const [selectedActionId, setSelected] = useState<string | null>(null);
  const [freeAction, setFreeAction]     = useState('');

  const intro      = useNarrativeStream(roomCode, 'intro');
  const scene      = useNarrativeStream(roomCode, 'scene');
  const gameEvents = useGameEvents(roomCode);
  const timer      = useGameTimer({ roomCode, durationMs: 90_000, active: phase === 'voting' });

  // ── Flow automatique ─────────────────────────────────────────────────────────

  // 1. Démarrer l'intro au montage (ou passer directement en actions si tour > 1)
  useEffect(() => {
    if (isFirstTurn) {
      intro.startStream();
    } else {
      setPhase('actions_loading');
    }
    return () => {
      intro.reset();
      scene.reset();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2. Intro terminée → passer en actions_loading + reconnect SSE pour le snapshot
  useEffect(() => {
    if (intro.status === 'done' && phase === 'intro_loading') {
      if (intro.text) setHistory((h) => [...h, intro.text]);
      setPhase('actions_loading');
      gameEvents.reconnect();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intro.status]);

  // 3. Actions reçues via SSE persistant → passer en voting
  useEffect(() => {
    if (gameEvents.ready && phase === 'actions_loading') {
      setPhase('voting');
    }
  }, [gameEvents.ready, phase]);

  // 4. Tour résolu via SSE → lancer la scène
  useEffect(() => {
    if (gameEvents.isResolved && gameEvents.winningAction && phase === 'voting') {
      setPhase('scene_loading');
      scene.reset();
      scene.startStream(`/api/game/${roomCode}/stream?type=scene&actionId=${gameEvents.winningAction.id}`);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameEvents.isResolved]);

  // 5. Scène terminée → recharger les actions pour le tour suivant
  useEffect(() => {
    if (scene.status === 'done' && phase === 'scene_loading') {
      if (scene.text) setHistory((h) => [...h, scene.text]);
      setPhase('actions_loading');
      setSelected(null);
      setFreeAction('');
      scene.reset();
      gameEvents.reconnect();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene.status]);

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleVote = async () => {
    if (!selectedActionId) return;
    await gameEvents.castVote(selectedActionId);
  };

  const handleVoteFree = async () => {
    const text = freeAction.trim();
    if (!text) return;
    await gameEvents.voteFree(text);
    setFreeAction('');
  };

  // ── Texte courant ─────────────────────────────────────────────────────────────

  const currentNarration =
    phase === 'scene_loading' ? scene.text
    : phase === 'intro_loading' ? intro.text
    : narrativeHistory[narrativeHistory.length - 1] ?? '';

  const isStreaming =
    (phase === 'intro_loading' && intro.status === 'streaming') ||
    (phase === 'scene_loading' && scene.status === 'streaming');

  const currentError   = intro.error ?? scene.error ?? gameEvents.error;
  const turnDisplay    = gameEvents.currentTurn > 1 ? gameEvents.currentTurn : 1;
  const myVotedId      = gameEvents.myVote;
  const isResolved     = gameEvents.isResolved;
  const winningId      = gameEvents.winningAction?.id;

  // ── Rendu ─────────────────────────────────────────────────────────────────────

  return (
    <div className={`min-h-screen bg-[#0d0d0f] bg-gradient-to-b ${THEME_GRADIENT[campaign.theme] ?? 'from-gray-950/20'} via-transparent to-transparent`}>
      <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">

        {/* ── Colonne principale ── */}
        <div className="flex flex-col gap-6">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-600">
                Tour {turnDisplay}
              </p>
              <h1 className="text-xl font-black uppercase italic text-white leading-tight">
                {campaign.title}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <Swords size={14} className="text-red-700" />
              <span className="text-[9px] font-black uppercase tracking-widest text-green-500 border border-green-900/40 bg-green-950/20 px-2 py-0.5 rounded">
                En cours
              </span>
            </div>
          </div>

          {/* Zone de narration */}
          <div className="bg-black/30 border border-white/5 rounded-3xl p-8 min-h-48">
            {phase === 'intro_loading' && intro.status === 'idle' && (
              <div className="flex flex-col items-center justify-center h-32 gap-3 text-gray-700">
                <Loader2 size={24} className="animate-spin" />
                <p className="text-xs font-black uppercase tracking-widest">L&apos;aventure commence...</p>
              </div>
            )}

            {phase === 'actions_loading' && !currentNarration && (
              <div className="flex items-center justify-center h-32 gap-3 text-gray-600">
                <Loader2 size={18} className="animate-spin" />
                <p className="text-xs font-black uppercase tracking-widest">Le Maître prépare les choix...</p>
              </div>
            )}

            {currentNarration && (
              <p className="text-gray-200 font-serif text-base leading-relaxed tracking-wide whitespace-pre-wrap">
                {currentNarration}
                {isStreaming && (
                  <span className="inline-block w-0.5 h-4 bg-red-500 ml-0.5 animate-pulse align-middle" />
                )}
              </p>
            )}

            {currentError && (
              <div className="flex items-center gap-3 text-red-700 mt-4">
                <AlertTriangle size={16} />
                <p className="text-xs">{currentError}</p>
                <button
                  onClick={() => { intro.reset(); intro.startStream(); }}
                  className="ml-auto"
                  aria-label="Réessayer"
                >
                  <RotateCcw size={14} className="text-gray-600 hover:text-white transition-colors" />
                </button>
              </div>
            )}
          </div>

          {/* Zone d'actions — visible en phase voting */}
          {phase === 'voting' && (
            <div className="bg-black/20 border border-white/5 rounded-3xl p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-black uppercase tracking-widest text-white">
                  {isResolved ? 'Action choisie' : 'Quelle est votre réponse ?'}
                </p>
                <div className="flex items-center gap-2">
                  {!isResolved && (
                    <div className="flex items-center gap-1 text-green-500 border border-green-900/40 bg-green-950/20 px-2 py-0.5 rounded">
                      <Radio size={9} className="animate-pulse" />
                      <span className="text-[9px] font-black uppercase tracking-widest">En direct</span>
                    </div>
                  )}
                  <VoteTimer
                    secondsLeft={timer.secondsLeft}
                    progress={timer.progress}
                    isExpired={timer.isExpired || isResolved}
                  />
                </div>
              </div>

              {/* Actions suggérées */}
              <div className="flex flex-col gap-2">
                {gameEvents.actions.map((action) => {
                  const voteCount  = gameEvents.votes.find((v) => v.actionId === action.id)?.count ?? 0;
                  const isSelected = selectedActionId === action.id;
                  const isMyVote   = myVotedId === action.id;
                  const isWinner   = isResolved && winningId === action.id;
                  const isLoser    = isResolved && winningId !== action.id;

                  return (
                    <button
                      key={action.id}
                      onClick={() => {
                        if (isResolved) return;
                        setSelected(action.id);
                        setFreeAction('');
                      }}
                      disabled={isResolved}
                      className={`group flex items-center justify-between p-4 rounded-xl border text-left transition-all ${
                        isWinner
                          ? 'border-green-700 bg-green-950/20'
                          : isLoser
                          ? 'border-white/5 bg-black/10 opacity-40'
                          : isSelected
                          ? 'border-red-700 bg-red-950/20'
                          : 'border-white/5 bg-black/20 hover:border-white/15'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <ChevronRight
                          size={14}
                          className={`flex-shrink-0 transition-colors ${
                            isWinner  ? 'text-green-500'
                            : isSelected ? 'text-red-500'
                            : 'text-gray-700 group-hover:text-gray-500'
                          }`}
                        />
                        <p className={`text-sm font-bold ${
                          isWinner   ? 'text-green-300'
                          : isSelected ? 'text-white'
                          : 'text-gray-300'
                        }`}>
                          {action.content}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                        {isMyVote && (
                          <span className="text-[8px] font-black uppercase tracking-widest text-red-500 border border-red-900/40 bg-red-950/20 px-1.5 py-0.5 rounded">
                            Mon vote
                          </span>
                        )}
                        {isWinner && (
                          <span className="text-[8px] font-black uppercase tracking-widest text-green-500 border border-green-900/40 bg-green-950/20 px-1.5 py-0.5 rounded">
                            Gagnant
                          </span>
                        )}
                        <span className={`text-[9px] font-black uppercase tracking-widest ${voteCount > 0 ? 'text-gray-400' : 'text-gray-700'}`}>
                          {voteCount} vote{voteCount > 1 ? 's' : ''}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Action libre — masquée si résolu */}
              {!isResolved && (
                <div className="flex gap-2 pt-2 border-t border-white/5">
                  <input
                    type="text"
                    value={freeAction}
                    onChange={(e) => {
                      setFreeAction(e.target.value);
                      if (e.target.value) setSelected(null);
                    }}
                    placeholder="Action libre..."
                    maxLength={200}
                    className="flex-1 bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-700 focus:outline-none focus:border-red-800 transition-colors"
                  />
                  <button
                    onClick={selectedActionId ? handleVote : handleVoteFree}
                    disabled={!selectedActionId && !freeAction.trim()}
                    className="px-6 py-2.5 bg-red-700 hover:bg-red-600 disabled:bg-gray-800 disabled:text-gray-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-colors"
                  >
                    {selectedActionId ? 'Voter' : 'Jouer'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Chargement de la scène suivante */}
          {phase === 'scene_loading' && !scene.text && (
            <div className="flex items-center gap-3 text-gray-600 px-2">
              <Loader2 size={16} className="animate-spin" />
              <p className="text-xs font-black uppercase tracking-widest">Le Maître du Donjon réagit...</p>
            </div>
          )}
        </div>

        {/* ── Sidebar fiche personnage ── */}
        <aside className="hidden lg:flex flex-col gap-4">
          <div className="bg-black/30 border border-white/5 rounded-2xl p-5 flex flex-col gap-4 sticky top-6">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-600">
              Fiche perso
            </p>

            <div className="flex flex-col items-center gap-2 py-2">
              <div className="w-14 h-14 rounded-full bg-black/40 border border-white/10 flex items-center justify-center">
                <User size={24} className="text-gray-600" />
              </div>
              <p className="text-sm font-black uppercase italic text-white">
                {currentPlayer.characterName ?? currentPlayer.username}
              </p>
              {currentPlayer.characterClass && (
                <p className="text-[9px] font-black uppercase tracking-widest text-gray-600">
                  {currentPlayer.characterClass}
                </p>
              )}
            </div>

            {currentPlayer.maxHp && (
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] text-gray-600 font-black uppercase tracking-widest">
                  <span>Vitalité</span>
                  <span>{currentPlayer.currentHp ?? currentPlayer.maxHp}/{currentPlayer.maxHp}</span>
                </div>
                <div className="h-1.5 bg-black/40 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-700 rounded-full transition-all"
                    style={{
                      width: `${((currentPlayer.currentHp ?? currentPlayer.maxHp) / currentPlayer.maxHp) * 100}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {currentPlayer.armorClass && (
              <div className="flex justify-between text-[10px]">
                <span className="text-gray-600 font-black uppercase tracking-widest">Armure</span>
                <span className="text-white font-black">{currentPlayer.armorClass}</span>
              </div>
            )}

            <div className="flex justify-between text-[10px]">
              <span className="text-gray-600 font-black uppercase tracking-widest">Maîtrise</span>
              <span className="text-white font-black">+2</span>
            </div>
          </div>
        </aside>

      </div>
    </div>
  );
}
