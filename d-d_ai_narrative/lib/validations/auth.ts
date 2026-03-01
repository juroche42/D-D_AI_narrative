import { z } from 'zod';

export const RegisterSchema = z
  .object({
    username: z
      .string()
      .min(3, 'Minimum 3 caractères')
      .max(20, 'Maximum 20 caractères')
      .regex(/^[a-zA-Z0-9_-]+$/, 'Lettres, chiffres, _ et - uniquement'),

    password: z
      .string()
      .min(8, 'Minimum 8 caractères')
      .max(72, 'Maximum 72 caractères (limite bcrypt)')
      .regex(/[A-Z]/, 'Au moins une majuscule')
      .regex(/[0-9]/, 'Au moins un chiffre'),

    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  });

export type RegisterInput = z.infer<typeof RegisterSchema>;

export const LoginSchema = z.object({
  username: z.string().min(1, 'Pseudo requis'),
  password: z.string().min(1, 'Mot de passe requis'),
});

export type LoginInput = z.infer<typeof LoginSchema>;
