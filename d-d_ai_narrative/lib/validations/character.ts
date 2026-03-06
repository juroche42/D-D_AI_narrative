import { z } from 'zod';
import { RACE_VALUES } from '@/lib/constants/races';
import { CLASS_VALUES } from '@/lib/constants/classes';

export const DndRaceSchema = z.enum(RACE_VALUES);
export type DndRace = z.infer<typeof DndRaceSchema>;

export const DndClassSchema = z.enum(CLASS_VALUES);
export type DndClass = z.infer<typeof DndClassSchema>;

const StatSchema = z.number().int().min(1).max(20);

export const CreateCharacterSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(30, 'Name must be at most 30 characters'),
  race: DndRaceSchema,
  class: DndClassSchema,
  backstory: z.string().max(2000, 'Backstory must be at most 2000 characters').optional(),
  stats: z.object({
    strength: StatSchema,
    dexterity: StatSchema,
    constitution: StatSchema,
    intelligence: StatSchema,
    wisdom: StatSchema,
    charisma: StatSchema,
  }),
});

export type CreateCharacter = z.infer<typeof CreateCharacterSchema>;
