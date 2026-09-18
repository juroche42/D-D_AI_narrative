import { z } from 'zod';

export const AlphaGateSchema = z.object({
  code: z.string().min(1, 'Code requis'),
});

export type AlphaGateInput = z.infer<typeof AlphaGateSchema>;
