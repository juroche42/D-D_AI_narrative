import { describe, it, expect } from 'vitest';
import { PaginationSchema, CuidSchema } from './common';

describe('PaginationSchema', () => {
  it('valeurs par défaut page=1, limit=20', () => {
    const result = PaginationSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(20);
    }
  });

  it('coerce les strings en nombres', () => {
    const result = PaginationSchema.safeParse({ page: '3', limit: '50' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(3);
      expect(result.data.limit).toBe(50);
    }
  });

  it('page < 1 → erreur', () => {
    const result = PaginationSchema.safeParse({ page: 0 });
    expect(result.success).toBe(false);
  });

  it('limit > 100 → erreur', () => {
    const result = PaginationSchema.safeParse({ limit: 101 });
    expect(result.success).toBe(false);
  });

  it('valeurs explicites valides', () => {
    const result = PaginationSchema.safeParse({ page: 5, limit: 100 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ page: 5, limit: 100 });
    }
  });
});

describe('CuidSchema', () => {
  it('accepte une string valide au format CUID', () => {
    // Format CUID v1 : commence par 'c', 25 chars alphanumériques
    const result = CuidSchema.safeParse('cjld2cjxh0000qzrmn831i7rn');
    expect(result.success).toBe(true);
  });

  it('rejette une string arbitraire non-CUID', () => {
    const result = CuidSchema.safeParse('not-a-cuid');
    expect(result.success).toBe(false);
  });

  it('rejette un UUID (ce n\'est pas un CUID)', () => {
    const result = CuidSchema.safeParse('550e8400-e29b-41d4-a716-446655440000');
    expect(result.success).toBe(false);
  });
});
