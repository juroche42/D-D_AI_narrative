'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export interface VoteCount { actionId: string; count: number }
export interface GameActionItem { id: string; content: string; type: string }

export interface GameEventsState {
  actions:       GameActionItem[];
  votes:         VoteCount[];
  myVote:        string | null;
  currentTurn:   number;
  ready:         boolean;   // true dès qu'on a reçu actions_ready
  isResolved:    boolean;   // true dès que turn_resolved reçu
  winningAction: { id: string; content: string } | null;
  error:         string | null;
}

export type UseGameEventsResult = GameEventsState & {
  castVote:  (actionId: string) => Promise<void>;
  voteFree:  (freeAction: string) => Promise<void>;
  reconnect: () => void;
};

const INITIAL_STATE: GameEventsState = {
  actions:       [],
  votes:         [],
  myVote:        null,
  currentTurn:   1,
  ready:         false,
  isResolved:    false,
  winningAction: null,
  error:         null,
};

/**
 * Hook SSE persistant pour recevoir les événements de jeu en temps réel.
 * - `actions_ready` : actions du tour + compteurs de votes + myVote (snapshot initial)
 * - `vote_cast`     : mise à jour des compteurs après chaque vote
 * - `turn_resolved` : action gagnante du tour → déclenche la scène côté client
 *
 * Reconnexion automatique avec backoff exponentiel (2s → 4s → 8s → 16s → 30s max).
 */
export function useGameEvents(roomCode: string): UseGameEventsResult {
  const [state, setState] = useState<GameEventsState>(INITIAL_STATE);
  const retryRef          = useRef(0);
  const esRef             = useRef<EventSource | null>(null);
  const mountedRef        = useRef(true);

  const connect = useCallback(() => {
    if (esRef.current) esRef.current.close();

    const es = new EventSource(`/api/game/${roomCode}/events`);
    esRef.current = es;

    es.onmessage = (e: MessageEvent) => {
      try {
        const event = JSON.parse(e.data as string) as {
          type:           string;
          turn:           number;
          actions?:       GameActionItem[];
          votes?:         VoteCount[];
          myVote?:        string | null;
          winningAction?: { id: string; content: string };
        };

        if (event.type === 'actions_ready') {
          retryRef.current = 0;
          setState((s) => ({
            ...s,
            actions:       event.actions  ?? s.actions,
            votes:         event.votes    ?? s.votes,
            myVote:        event.myVote   !== undefined ? (event.myVote ?? null) : s.myVote,
            currentTurn:   event.turn,
            ready:         true,
            isResolved:    false,
            winningAction: null,
            error:         null,
          }));
        } else if (event.type === 'vote_cast') {
          setState((s) => ({
            ...s,
            votes:  event.votes  ?? s.votes,
            myVote: event.myVote !== undefined ? (event.myVote ?? null) : s.myVote,
          }));
        } else if (event.type === 'turn_resolved') {
          setState((s) => ({
            ...s,
            winningAction: event.winningAction ?? null,
            votes:         event.votes         ?? s.votes,
            isResolved:    true,
          }));
        }
      } catch {
        // Ignorer les événements non-JSON (ex: keepalive)
      }
    };

    es.onerror = () => {
      es.close();
      if (!mountedRef.current) return;
      const delay = Math.min(2000 * 2 ** retryRef.current, 30_000);
      retryRef.current = Math.min(retryRef.current + 1, 5);
      setTimeout(connect, delay);
    };
  }, [roomCode]);

  useEffect(() => {
    mountedRef.current = true;
    connect();
    return () => {
      mountedRef.current = false;
      esRef.current?.close();
    };
  // roomCode est stable (param du composant parent) — pas de re-connexion nécessaire
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomCode]);

  const castVote = useCallback(async (actionId: string) => {
    await fetch(`/api/game/${roomCode}/vote`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ actionId }),
    });
    // Les compteurs sont mis à jour via le broadcast SSE `vote_cast`
  }, [roomCode]);

  const voteFree = useCallback(async (freeAction: string) => {
    await fetch(`/api/game/${roomCode}/vote`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ freeAction }),
    });
  }, [roomCode]);

  const reconnect = useCallback(() => {
    retryRef.current = 0;
    setState(INITIAL_STATE);
    connect();
  }, [connect]);

  return { ...state, castVote, voteFree, reconnect };
}
