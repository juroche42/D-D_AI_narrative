import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  registerClient,
  unregisterClient,
  broadcastToRoom,
  getClientCount,
  registerGameClient,
  unregisterGameClient,
  getOnlineUserIds,
  broadcastPresence,
} from './sseManager';

beforeEach(() => {
  globalThis.__sseClients = new Map();
  globalThis.__gameClients = new Map();
});

describe('sseManager', () => {
  it('registerClient enregistre un client et retourne un id unique', () => {
    const ctrl = { enqueue: vi.fn() } as unknown as ReadableStreamDefaultController;
    const id1 = registerClient('ABC123', ctrl);
    const id2 = registerClient('ABC123', ctrl);
    expect(id1).not.toBe(id2);
    expect(getClientCount('ABC123')).toBe(2);
  });

  it('unregisterClient supprime le client', () => {
    const ctrl = { enqueue: vi.fn() } as unknown as ReadableStreamDefaultController;
    const id = registerClient('ABC123', ctrl);
    unregisterClient(id);
    expect(getClientCount('ABC123')).toBe(0);
  });

  it('broadcastToRoom envoie uniquement aux clients du bon salon', () => {
    const ctrl1 = { enqueue: vi.fn() } as unknown as ReadableStreamDefaultController;
    const ctrl2 = { enqueue: vi.fn() } as unknown as ReadableStreamDefaultController;
    registerClient('ABC123', ctrl1);
    registerClient('XYZ999', ctrl2);

    broadcastToRoom('ABC123', { type: 'player_joined', roomCode: 'ABC123', players: [], status: 'WAITING', timestamp: 0 });

    expect(ctrl1.enqueue).toHaveBeenCalledOnce();
    expect(ctrl2.enqueue).not.toHaveBeenCalled();
  });

  it("supprime automatiquement les clients dont l'enqueue échoue", () => {
    const ctrlOk = { enqueue: vi.fn() } as unknown as ReadableStreamDefaultController;
    const ctrlDead = {
      enqueue: vi.fn().mockImplementation(() => { throw new Error('closed'); }),
    } as unknown as ReadableStreamDefaultController;

    registerClient('ABC123', ctrlOk);
    registerClient('ABC123', ctrlDead);

    broadcastToRoom('ABC123', { type: 'player_joined', roomCode: 'ABC123', players: [], status: 'WAITING', timestamp: 0 });

    expect(getClientCount('ABC123')).toBe(1);
  });

  it('getClientCount retourne 0 pour un salon sans clients', () => {
    expect(getClientCount('XXXXXX')).toBe(0);
  });
});

describe('présence des joueurs (game clients)', () => {
  const ctrl = () => ({ enqueue: vi.fn() } as unknown as ReadableStreamDefaultController);

  it('getOnlineUserIds retourne les userId distincts connectés à la room', () => {
    registerGameClient('ABC123', 'user_1', ctrl());
    registerGameClient('ABC123', 'user_2', ctrl());
    registerGameClient('ABC123', 'user_1', ctrl()); // 2e onglet du même joueur
    registerGameClient('XYZ999', 'user_3', ctrl());

    const online = getOnlineUserIds('ABC123');
    expect(online).toHaveLength(2);
    expect(online).toEqual(expect.arrayContaining(['user_1', 'user_2']));
    expect(online).not.toContain('user_3');
  });

  it("retire un joueur de la présence après unregister de sa dernière connexion", () => {
    const id1 = registerGameClient('ABC123', 'user_1', ctrl());
    registerGameClient('ABC123', 'user_2', ctrl());

    unregisterGameClient(id1);

    expect(getOnlineUserIds('ABC123')).toEqual(['user_2']);
  });

  it('broadcastPresence envoie la liste des joueurs en ligne aux clients de la room', () => {
    const c1 = ctrl();
    const c2 = ctrl();
    registerGameClient('ABC123', 'user_1', c1);
    registerGameClient('ABC123', 'user_2', c2);

    broadcastPresence('ABC123');

    expect(c1.enqueue).toHaveBeenCalledOnce();
    const payload = JSON.parse(
      new TextDecoder().decode(vi.mocked(c1.enqueue).mock.calls[0][0] as Uint8Array).replace(/^data: /, ''),
    );
    expect(payload.type).toBe('presence');
    expect(payload.onlineUserIds).toEqual(expect.arrayContaining(['user_1', 'user_2']));
  });
});
