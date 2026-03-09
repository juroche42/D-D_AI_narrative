import { z } from 'zod';

export const CampaignFiltersSchema = z.object({
  theme:      z.enum(['HORROR', 'HEROIC', 'MYSTERY', 'INVESTIGATION']).optional(),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).optional(),
  search:     z.string().max(100).optional(),
  isPremium:  z.coerce.boolean().optional(),
  page:       z.coerce.number().int().min(1).default(1),
  limit:      z.coerce.number().int().min(1).max(50).default(12),
});

export type CampaignFiltersInput = z.infer<typeof CampaignFiltersSchema>;
