import { describe, expect, it } from 'vitest';
import { UpdateUserMeSchema } from './user';

describe('UpdateUserMeSchema', () => {
  it('valide une mise à jour de pseudo seule', () => {
    const result = UpdateUserMeSchema.safeParse({ username: 'NouveauPseudo' });
    expect(result.success).toBe(true);
  });

  it('rejette un body vide', () => {
    const result = UpdateUserMeSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('requiert currentPassword/newPassword/confirmNewPassword si changement mot de passe', () => {
    const result = UpdateUserMeSchema.safeParse({ newPassword: 'Password1' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = result.error.flatten().fieldErrors;
      expect(fields.currentPassword).toBeDefined();
      expect(fields.confirmNewPassword).toBeDefined();
    }
  });

  it('rejette des mots de passe non identiques', () => {
    const result = UpdateUserMeSchema.safeParse({
      currentPassword: 'Password1',
      newPassword: 'Password2',
      confirmNewPassword: 'Password3',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = result.error.flatten().fieldErrors;
      expect(fields.confirmNewPassword).toBeDefined();
    }
  });

  it('valide un changement mot de passe complet', () => {
    const result = UpdateUserMeSchema.safeParse({
      currentPassword: 'Password1',
      newPassword: 'NewPassword1',
      confirmNewPassword: 'NewPassword1',
    });
    expect(result.success).toBe(true);
  });
});
