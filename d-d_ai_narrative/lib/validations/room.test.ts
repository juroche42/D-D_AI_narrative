import { describe, it, expect } from 'vitest';
import { CreateRoomSchema, UpdateRoomSchema } from './room';

const VALID_ROOM = {
  name: 'Donjon des Ombres',
  description: 'Un lieu mystérieux et dangereux.',
  maxPlayers: 4,
  isPrivate: false,
};

describe('CreateRoomSchema', () => {
  it('room valide passe', () => {
    const result = CreateRoomSchema.safeParse(VALID_ROOM);
    expect(result.success).toBe(true);
  });

  it('description optionnelle — absent → valide', () => {
    const { description: _, ...withoutDesc } = VALID_ROOM;
    const result = CreateRoomSchema.safeParse(withoutDesc);
    expect(result.success).toBe(true);
  });

  it('name trop court (< 3) → erreur', () => {
    const result = CreateRoomSchema.safeParse({ ...VALID_ROOM, name: 'ab' });
    expect(result.success).toBe(false);
  });

  it('name trop long (> 50) → erreur', () => {
    const result = CreateRoomSchema.safeParse({ ...VALID_ROOM, name: 'A'.repeat(51) });
    expect(result.success).toBe(false);
  });

  it('maxPlayers < 2 → erreur', () => {
    const result = CreateRoomSchema.safeParse({ ...VALID_ROOM, maxPlayers: 1 });
    expect(result.success).toBe(false);
  });

  it('maxPlayers > 8 → erreur', () => {
    const result = CreateRoomSchema.safeParse({ ...VALID_ROOM, maxPlayers: 9 });
    expect(result.success).toBe(false);
  });

  it('isPrivate true → valide', () => {
    const result = CreateRoomSchema.safeParse({ ...VALID_ROOM, isPrivate: true });
    expect(result.success).toBe(true);
  });
});

describe('UpdateRoomSchema', () => {
  it('objet vide → valide (tous les champs sont optionnels)', () => {
    const result = UpdateRoomSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('partial update (name seul) → valide', () => {
    const result = UpdateRoomSchema.safeParse({ name: 'Nouveau nom' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('Nouveau nom');
    }
  });

  it('partial update invalide (name trop court) → erreur', () => {
    const result = UpdateRoomSchema.safeParse({ name: 'ab' });
    expect(result.success).toBe(false);
  });
});
