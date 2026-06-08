import { z } from 'zod';

export const CampaignFiltersSchema = z.object({
  theme:      z.enum(['HORROR', 'HEROIC', 'MYSTERY', 'INVESTIGATION']).optional(),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).optional(),
  search:     z.string().max(100).optional(),
  isPremium:  z.preprocess(
    (v) => v === 'true' ? true : v === 'false' ? false : v,
    z.boolean().optional()
  ),
  page:       z.coerce.number().int().min(1).default(1),
  limit:      z.coerce.number().int().min(1).max(50).default(12),
});

export type CampaignFiltersInput = z.infer<typeof CampaignFiltersSchema>;

export const CreateCampaignSchema = z.object({
  title:             z.string().min(3, 'Titre trop court').max(100, 'Titre trop long'),
  synopsis:          z.string().min(20, 'Synopsis trop court').max(1000, 'Synopsis trop long'),
  startLocation:     z.string().min(3, 'Lieu trop court').max(200, 'Lieu trop long'),
  mainQuest:         z.string().min(20, 'Quête trop courte').max(500, 'Quête trop longue'),
  theme:             z.enum(['HORROR', 'HEROIC', 'MYSTERY', 'INVESTIGATION']),
  difficulty:        z.enum(['EASY', 'MEDIUM', 'HARD']),
  minPlayers:        z.coerce.number().int().min(1).max(6).default(2),
  maxPlayers:        z.coerce.number().int().min(1).max(6).default(6),
  estimatedDuration: z.coerce.number().int().min(30).max(3600).default(120),
  isPublic:          z.boolean().default(false),
  isPremium:         z.boolean().default(false),
}).refine(
  (d) => d.minPlayers <= d.maxPlayers,
  { message: 'Le nombre min de joueurs ne peut pas dépasser le max', path: ['minPlayers'] },
).refine(
  (d) => !(d.isPremium && !d.isPublic),
  { message: 'Une campagne premium doit être publique', path: ['isPremium'] },
);

export type CreateCampaignInput = z.infer<typeof CreateCampaignSchema>;
