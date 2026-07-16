'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export interface GameTimerOptions {
  roomCode:   string;
  durationMs: number;
  active:     boolean;
}

export interface GameTimerState {
  secondsLeft: number;
  progress:    number;  // 1.0 → 0.0
  isExpired:   boolean;
}

/**
 * Timer côté client basé sur requestAnimationFrame.
 * Quand `active` passe à true, démarre le compte à rebours.
 * À l'expiration, appelle POST /api/game/:code/resolve (idempotent).
 * Reset automatique quand `active` repasse à false.
 */
export function useGameTimer({ roomCode, durationMs, active }: GameTimerOptions): GameTimerState {
  const [state, setState] = useState<GameTimerState>({
    secondsLeft: Math.ceil(durationMs / 1000),
    progress:    1,
    isExpired:   false,
  });

  const rafRef       = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const firedRef     = useRef(false);

  const callResolve = useCallback(() => {
    if (firedRef.current) return;
    firedRef.current = true;
    fetch(`/api/game/${roomCode}/resolve`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ triggeredBy: 'timer' }),
    }).catch((err) => console.error('[useGameTimer] resolve error:', err));
  }, [roomCode]);

  useEffect(() => {
    if (!active) {
      // Arrêter et reset
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      startTimeRef.current = null;
      firedRef.current     = false;
      setState({
        secondsLeft: Math.ceil(durationMs / 1000),
        progress:    1,
        isExpired:   false,
      });
      return;
    }

    startTimeRef.current = performance.now();
    firedRef.current     = false;

    const tick = (now: number) => {
      const elapsed  = now - (startTimeRef.current ?? now);
      const remaining = Math.max(0, durationMs - elapsed);
      const progress  = remaining / durationMs;
      const secondsLeft = Math.ceil(remaining / 1000);

      setState({ secondsLeft, progress, isExpired: remaining === 0 });

      if (remaining === 0) {
        callResolve();
        return;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  return state;
}
