import { describe, it, expect, beforeEach, vi } from 'vitest';
import { registerClient, unregisterClient, broadcastToRoom, getClientCount } from './sseManager';

beforeEach(() => {
  globalThis.__sseClients = new Map();
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

    broadcastToRoom('ABC123', { type: 'player_joined', roomCode: 'ABC123', players: [], timestamp: 0 });

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

    broadcastToRoom('ABC123', { type: 'player_joined', roomCode: 'ABC123', players: [], timestamp: 0 });

    expect(getClientCount('ABC123')).toBe(1);
  });

  it('getClientCount retourne 0 pour un salon sans clients', () => {
    expect(getClientCount('XXXXXX')).toBe(0);
  });
});
