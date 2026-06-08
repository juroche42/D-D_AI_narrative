'use client';

import { useState, useCallback, useRef } from 'react';

export type StreamStatus = 'idle' | 'streaming' | 'done' | 'error';

export interface TurnActionItem {
  id:      string;
  content: string;
  type:    string;
}

interface NarrativeStreamState {
  text:        string;
  status:      StreamStatus;
  error:       string | null;
  actions:     TurnActionItem[];
  currentTurn: number;
}

export interface UseNarrativeStreamResult extends NarrativeStreamState {
  startStream: (customUrl?: string) => void;
  reset:       () => void;
}

const INITIAL_STATE: NarrativeStreamState = {
  text:        '',
  status:      'idle',
  error:       null,
  actions:     [],
  currentTurn: 1,
};

/**
 * Hook SSE pour recevoir la narration et les actions du jeu token par token.
 *
 * @param roomCode  Code du salon (ex: "ABC123")
 * @param type      Type de stream : 'intro' | 'actions' | 'scene'
 */
export function useNarrativeStream(
  roomCode: string,
  type: 'intro' | 'actions' | 'scene',
): UseNarrativeStreamResult {
  const [state, setState]  = useState<NarrativeStreamState>(INITIAL_STATE);
  const abortControllerRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setState(INITIAL_STATE);
  }, []);

  const startStream = useCallback((customUrl?: string) => {
    // Avorter tout fetch en vol — React 18 Strict Mode double-invoke
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setState((prev) => ({ ...prev, text: '', status: 'streaming', error: null }));

    const url = customUrl ?? `/api/game/${roomCode}/stream?type=${type}`;

    (async () => {
      try {
        const response = await fetch(url, { signal: controller.signal });

        if (!response.ok || !response.body) {
          const body = await response.text().catch(() => '');
          throw new Error(body || `HTTP ${response.status}`);
        }

        const decoder = new TextDecoder();
        const reader  = response.body.getReader();
        let buffer    = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const raw = line.slice(6).trim();
            if (!raw) continue;

            let event: {
              type: string;
              token?: string;
              error?: string;
              actions?: TurnActionItem[];
              turn?: number;
            };
            try {
              event = JSON.parse(raw);
            } catch {
              continue;
            }

            if (event.type === 'token' && event.token) {
              setState((prev) => ({ ...prev, text: prev.text + event.token }));
            } else if (event.type === 'actions') {
              setState((prev) => ({
                ...prev,
                actions:     event.actions ?? [],
                currentTurn: event.turn ?? prev.currentTurn,
              }));
            } else if (event.type === 'start' && event.turn) {
              setState((prev) => ({ ...prev, currentTurn: event.turn! }));
            } else if (event.type === 'done') {
              setState((prev) => ({ ...prev, status: 'done' }));
              return;
            } else if (event.type === 'error') {
              setState((prev) => ({
                ...prev,
                status: 'error',
                error:  event.error ?? 'Erreur inconnue',
              }));
              return;
            }
          }
        }

        setState((prev) => ({ ...prev, status: 'done' }));
      } catch (err) {
        // Ignorer silencieusement l'abort (Strict Mode cleanup)
        if (err instanceof Error && err.name === 'AbortError') return;
        setState((prev) => ({
          ...prev,
          status: 'error',
          error:  err instanceof Error ? err.message : 'Erreur de connexion',
        }));
      }
    })();
  // roomCode et type sont stables (params du hook) — pas de re-création nécessaire
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomCode, type]);

  return { ...state, startStream, reset };
}
