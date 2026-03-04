import { z } from 'zod';

const UsernameSchema = z
  .string()
  .min(3, 'Minimum 3 caractères')
  .max(20, 'Maximum 20 caractères')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Lettres, chiffres, _ et - uniquement');

const PasswordSchema = z
  .string()
  .min(8, 'Minimum 8 caractères')
  .max(72, 'Maximum 72 caractères (limite bcrypt)')
  .regex(/[A-Z]/, 'Au moins une majuscule')
  .regex(/[0-9]/, 'Au moins un chiffre');

export const UpdateUserMeSchema = z
  .object({
    username: UsernameSchema.optional(),
    avatarUrl: z.string().max(500, 'Maximum 500 caractères').optional(),
    bio: z.string().max(1000, 'Maximum 1000 caractères').optional(),
    language: z.enum(['FR', 'EN']).optional(),
    darkMode: z.boolean().optional(),
    currentPassword: z.string().optional(),
    newPassword: PasswordSchema.optional(),
    confirmNewPassword: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const hasProfileUpdate =
      data.username !== undefined ||
      data.avatarUrl !== undefined ||
      data.bio !== undefined ||
      data.language !== undefined ||
      data.darkMode !== undefined;

    const hasPasswordUpdate =
      data.currentPassword !== undefined ||
      data.newPassword !== undefined ||
      data.confirmNewPassword !== undefined;

    if (!hasProfileUpdate && !hasPasswordUpdate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Aucun champ à mettre à jour',
      });
    }

    if (hasPasswordUpdate) {
      if (!data.currentPassword) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Le mot de passe actuel est requis',
          path: ['currentPassword'],
        });
      }
      if (!data.newPassword) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Le nouveau mot de passe est requis',
          path: ['newPassword'],
        });
      }
      if (!data.confirmNewPassword) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'La confirmation du nouveau mot de passe est requise',
          path: ['confirmNewPassword'],
        });
      }
      if (data.newPassword && data.confirmNewPassword && data.newPassword !== data.confirmNewPassword) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Les mots de passe ne correspondent pas',
          path: ['confirmNewPassword'],
        });
      }
    }
  });

export type UpdateUserMeInput = z.infer<typeof UpdateUserMeSchema>;
