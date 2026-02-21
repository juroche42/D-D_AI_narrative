import { z } from 'zod';

export const DndRaceSchema = z.enum([
  'Human',
  'Elf',
  'Dwarf',
  'Halfling',
  'Gnome',
  'Half-Elf',
  'Half-Orc',
  'Tiefling',
  'Dragonborn',
]);

export type DndRace = z.infer<typeof DndRaceSchema>;

export const DndClassSchema = z.enum([
  'Barbarian',
  'Bard',
  'Cleric',
  'Druid',
  'Fighter',
  'Monk',
  'Paladin',
  'Ranger',
  'Rogue',
  'Sorcerer',
  'Warlock',
  'Wizard',
]);

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
