export type SSEEventType = 'player_joined' | 'player_left' | 'player_updated' | 'room_closed' | 'room_status_changed' | 'campaign_selected';

export interface SSEPlayer {
  userId: string;
  username: string;
  characterId: string | null;
  isReady: boolean;
  isHost: boolean;
  joinedAt: Date;
}

export interface SSEEvent {
  type: SSEEventType;
  roomCode: string;
  players: SSEPlayer[];
  status: string;
  timestamp: number;
  campaign?: { id: string; title: string; theme: string; difficulty: string } | null;
}

type SSEClient = {
  id: string;
  roomCode: string;
  controller: ReadableStreamDefaultController;
};

declare global {
  // eslint-disable-next-line no-var
  var __sseClients: Map<string, SSEClient> | undefined;
}

function getClients(): Map<string, SSEClient> {
  if (!globalThis.__sseClients) {
    globalThis.__sseClients = new Map();
  }
  return globalThis.__sseClients;
}

export function registerClient(
  roomCode: string,
  controller: ReadableStreamDefaultController,
): string {
  const clients = getClients();
  const clientId = `${roomCode}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  clients.set(clientId, { id: clientId, roomCode, controller });
  return clientId;
}

export function unregisterClient(clientId: string): void {
  getClients().delete(clientId);
}

export function broadcastToRoom(roomCode: string, event: SSEEvent): void {
  const clients = getClients();
  const data = `data: ${JSON.stringify(event)}\n\n`;
  const encoded = new TextEncoder().encode(data);

  for (const client of clients.values()) {
    if (client.roomCode !== roomCode) continue;
    try {
      client.controller.enqueue(encoded);
    } catch {
      // Client déconnecté — nettoyage silencieux
      clients.delete(client.id);
    }
  }
}

export function getClientCount(roomCode: string): number {
  let count = 0;
  for (const client of getClients().values()) {
    if (client.roomCode === roomCode) count++;
  }
  return count;
}
