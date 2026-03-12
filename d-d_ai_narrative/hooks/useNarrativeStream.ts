'use client';

import { useState, useCallback, useRef } from 'react';

export type StreamStatus = 'idle' | 'streaming' | 'done' | 'error';

interface NarrativeStreamState {
  text:   string;
  status: StreamStatus;
  error:  string | null;
}

interface UseNarrativeStreamResult extends NarrativeStreamState {
  startStream: (roomCode: string) => void;
  reset:       () => void;
}

const INITIAL_STATE: NarrativeStreamState = {
  text:   '',
  status: 'idle',
  error:  null,
};

export function useNarrativeStream(): UseNarrativeStreamResult {
  const [state, setState]       = useState<NarrativeStreamState>(INITIAL_STATE);
  const abortControllerRef      = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setState(INITIAL_STATE);
  }, []);

  const startStream = useCallback((roomCode: string) => {
    // Avorter tout fetch en vol — React 18 Strict Mode double-invoke
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setState({ text: '', status: 'streaming', error: null });

    (async () => {
      try {
        const response = await fetch(`/api/game/${roomCode}/stream?type=intro`, {
          signal: controller.signal,
        });

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

            let event: { type: string; token?: string; error?: string };
            try {
              event = JSON.parse(raw);
            } catch {
              continue;
            }

            if (event.type === 'token' && event.token) {
              setState((prev) => ({ ...prev, text: prev.text + event.token }));
            } else if (event.type === 'done') {
              setState((prev) => ({ ...prev, status: 'done' }));
              return;
            } else if (event.type === 'error') {
              setState((prev) => ({
                ...prev,
                status: 'error',
                error: event.error ?? 'Erreur inconnue',
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
  }, []);

  return { ...state, startStream, reset };
}
