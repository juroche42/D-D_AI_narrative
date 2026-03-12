/**
 * Verrou + buffer de tokens en mémoire par roomCode.
 * Garantit qu'une seule génération OpenAI se produit par salon.
 * Les appelants concurrents sondent le buffer toutes les 50ms et reçoivent
 * les tokens en temps réel → même effet typewriter pour tous les joueurs.
 */

type RoomGenerationState = {
  tokens: string[]; // tokens accumulés au fur et à mesure
  done:   boolean;  // génération terminée
};

declare global {
   
  var __generatingRooms: Set<string>                    | undefined;
   
  var __tokenBuffers:    Map<string, RoomGenerationState> | undefined;
}

function getLocks(): Set<string> {
  if (!globalThis.__generatingRooms) globalThis.__generatingRooms = new Set();
  return globalThis.__generatingRooms;
}

function getBuffers(): Map<string, RoomGenerationState> {
  if (!globalThis.__tokenBuffers) globalThis.__tokenBuffers = new Map();
  return globalThis.__tokenBuffers;
}

// ── Verrou ──────────────────────────────────────────────────────────────────────

export function acquireLock(roomCode: string): boolean {
  const locks = getLocks();
  if (locks.has(roomCode)) return false;
  locks.add(roomCode);
  return true;
}

export function releaseLock(roomCode: string): void {
  getLocks().delete(roomCode);
}

// ── Buffer de tokens ────────────────────────────────────────────────────────────

export function initBuffer(roomCode: string): void {
  getBuffers().set(roomCode, { tokens: [], done: false });
}

export function pushToken(roomCode: string, token: string): void {
  getBuffers().get(roomCode)?.tokens.push(token);
}

export function markGenerationDone(roomCode: string): void {
  const state = getBuffers().get(roomCode);
  if (state) state.done = true;
  setTimeout(() => getBuffers().delete(roomCode), 60_000);
}

export function getTokensFrom(
  roomCode: string,
  offset: number,
): { tokens: string[]; done: boolean } {
  const state = getBuffers().get(roomCode);
  if (!state) return { tokens: [], done: true };
  return { tokens: state.tokens.slice(offset), done: state.done };
}

export function isBuffered(roomCode: string): boolean {
  return getBuffers().has(roomCode);
}
