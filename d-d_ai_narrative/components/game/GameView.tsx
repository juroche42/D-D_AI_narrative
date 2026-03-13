'use client';

import { useState, useEffect, useTransition } from 'react';
import { Loader2, Swords, ChevronRight, Clock, User, AlertTriangle, RotateCcw } from 'lucide-react';
import { useNarrativeStream } from '@/hooks/useNarrativeStream';

// ─── Types ────────────────────────────────────────────────────────────────────

type GamePhase =
  | 'intro_loading'   // Intro en cours de génération
  | 'actions_loading' // Actions en cours de génération
  | 'voting'          // Joueurs votent (timer visible)
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
}

const THEME_GRADIENT: Record<string, string> = {
  HEROIC:        'from-yellow-950/20',
  HORROR:        'from-red-950/30',
  MYSTERY:       'from-purple-950/20',
  INVESTIGATION: 'from-blue-950/20',
};

// ─── Composant principal ──────────────────────────────────────────────────────

export function GameView({ roomCode, campaign, currentPlayer, isFirstTurn }: GameViewProps) {
  const [phase, setPhase]               = useState<GamePhase>('intro_loading');
  const [narrativeHistory, setHistory]  = useState<string[]>([]);
  const [selectedActionId, setSelected] = useState<string | null>(null);
  const [freeAction, setFreeAction]     = useState('');
  const [, startTransition]             = useTransition();

  const intro   = useNarrativeStream(roomCode, 'intro');
  const actStrm = useNarrativeStream(roomCode, 'actions');
  const scene   = useNarrativeStream(roomCode, 'scene');

  // ── Flow automatique ─────────────────────────────────────────────────────────

  // 1. Démarrer l'intro au montage (ou actions si tour > 1)
  useEffect(() => {
    if (isFirstTurn) {
      intro.startStream();
    } else {
      setPhase('actions_loading');
      actStrm.startStream();
    }
    return () => {
      intro.reset();
      actStrm.reset();
      scene.reset();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2. Intro terminée → charger les actions
  useEffect(() => {
    if (intro.status === 'done' && phase === 'intro_loading') {
      if (intro.text) setHistory((h) => [...h, intro.text]);
      setPhase('actions_loading');
      setTimeout(() => actStrm.startStream(), 600);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intro.status]);

  // 3. Actions chargées → passer en mode vote
  useEffect(() => {
    if (actStrm.status === 'done' && phase === 'actions_loading') {
      setPhase('voting');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actStrm.status]);

  // 4. Scène terminée → recharger les actions pour le tour suivant
  useEffect(() => {
    if (scene.status === 'done' && phase === 'scene_loading') {
      if (scene.text) setHistory((h) => [...h, scene.text]);
      setPhase('actions_loading');
      setSelected(null);
      setFreeAction('');
      scene.reset();
      actStrm.reset();
      setTimeout(() => actStrm.startStream(), 600);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene.status]);

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleConfirm = () => {
    if (!selectedActionId && !freeAction.trim()) return;

    startTransition(() => {
      setPhase('scene_loading');
      const url = selectedActionId
        ? `/api/game/${roomCode}/stream?type=scene&actionId=${selectedActionId}`
        : `/api/game/${roomCode}/stream?type=scene&action=${encodeURIComponent(freeAction.trim())}`;
      scene.reset();
      scene.startStream(url);
    });
  };

  // ── Texte courant ─────────────────────────────────────────────────────────────

  const currentNarration =
    phase === 'scene_loading' ? scene.text
    : phase === 'intro_loading' ? intro.text
    : narrativeHistory[narrativeHistory.length - 1] ?? '';

  const isStreaming =
    (phase === 'intro_loading' && intro.status === 'streaming') ||
    (phase === 'scene_loading' && scene.status === 'streaming');

  const currentError = intro.error ?? scene.error ?? actStrm.error;
  const turnDisplay  = actStrm.currentTurn > 1 ? actStrm.currentTurn : 1;

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
                  Quelle est votre réponse ?
                </p>
                {/* Timer statique — placeholder US-07 */}
                <div className="flex items-center gap-1.5 text-gray-500">
                  <Clock size={12} />
                  <span className="text-[10px] font-black uppercase tracking-widest font-mono">1:30</span>
                </div>
              </div>

              {/* Actions suggérées */}
              <div className="flex flex-col gap-2">
                {actStrm.actions.map((action) => (
                  <button
                    key={action.id}
                    onClick={() => { setSelected(action.id); setFreeAction(''); }}
                    className={`group flex items-center justify-between p-4 rounded-xl border text-left transition-all ${
                      selectedActionId === action.id
                        ? 'border-red-700 bg-red-950/20'
                        : 'border-white/5 bg-black/20 hover:border-white/15'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <ChevronRight
                        size={14}
                        className={`flex-shrink-0 transition-colors ${
                          selectedActionId === action.id ? 'text-red-500' : 'text-gray-700 group-hover:text-gray-500'
                        }`}
                      />
                      <p className={`text-sm font-bold ${
                        selectedActionId === action.id ? 'text-white' : 'text-gray-300'
                      }`}>
                        {action.content}
                      </p>
                    </div>
                    {/* Compteur de votes — placeholder US-07 */}
                    <span className="text-[9px] font-black uppercase tracking-widest text-gray-700 flex-shrink-0 ml-4">
                      0 votes
                    </span>
                  </button>
                ))}
              </div>

              {/* Action libre */}
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
                  onClick={handleConfirm}
                  disabled={!selectedActionId && !freeAction.trim()}
                  className="px-6 py-2.5 bg-red-700 hover:bg-red-600 disabled:bg-gray-800 disabled:text-gray-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-colors"
                >
                  Voter
                </button>
              </div>
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
