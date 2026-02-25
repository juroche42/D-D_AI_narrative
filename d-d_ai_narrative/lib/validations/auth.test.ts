import { describe, it, expect } from 'vitest';
import { RegisterSchema } from './auth';

const VALID = {
  username: 'ThorinHero',
  password: 'Password1',
  confirmPassword: 'Password1',
};

describe('RegisterSchema', () => {
  // ── Cas nominal ──────────────────────────────────────────────────────────

  it('cas nominal — données valides parsées avec succès', () => {
    const result = RegisterSchema.safeParse(VALID);
    expect(result.success).toBe(true);
  });

  // ── username ──────────────────────────────────────────────────────────────

  it('username trop court (< 3) → erreur', () => {
    const result = RegisterSchema.safeParse({ ...VALID, username: 'ab' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = result.error.flatten().fieldErrors;
      expect(fields.username).toBeDefined();
    }
  });

  it('username trop long (> 20) → erreur', () => {
    const result = RegisterSchema.safeParse({ ...VALID, username: 'a'.repeat(21) });
    expect(result.success).toBe(false);
  });

  it('username avec caractère interdit (@) → erreur', () => {
    const result = RegisterSchema.safeParse({ ...VALID, username: 'hero@world' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.username).toBeDefined();
    }
  });

  it('username avec underscores et tirets → valide', () => {
    const result = RegisterSchema.safeParse({ ...VALID, username: 'the_Dark-Hero' });
    expect(result.success).toBe(true);
  });

  // ── password ──────────────────────────────────────────────────────────────

  it('password trop court (< 8) → erreur', () => {
    const result = RegisterSchema.safeParse({ ...VALID, password: 'Pass1', confirmPassword: 'Pass1' });
    expect(result.success).toBe(false);
  });

  it('password sans majuscule → erreur', () => {
    const result = RegisterSchema.safeParse({ ...VALID, password: 'password1', confirmPassword: 'password1' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.password).toBeDefined();
    }
  });

  it('password sans chiffre → erreur', () => {
    const result = RegisterSchema.safeParse({ ...VALID, password: 'PasswordA', confirmPassword: 'PasswordA' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.password).toBeDefined();
    }
  });

  it('password > 72 chars → erreur (limite bcrypt)', () => {
    const longPw = 'A1' + 'x'.repeat(71);
    const result = RegisterSchema.safeParse({ ...VALID, password: longPw, confirmPassword: longPw });
    expect(result.success).toBe(false);
  });

  // ── confirmPassword ───────────────────────────────────────────────────────

  it('mots de passe différents → erreur sur confirmPassword', () => {
    const result = RegisterSchema.safeParse({ ...VALID, confirmPassword: 'Password2' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = result.error.flatten().fieldErrors;
      expect(fields.confirmPassword).toBeDefined();
    }
  });

  it('mots de passe identiques → valide', () => {
    const result = RegisterSchema.safeParse(VALID);
    expect(result.success).toBe(true);
  });
});
