import { Race } from '@/app/generated/prisma/client';

export interface RaceDefinition {
  id: Race;
  name: string;
  description: string;
}

export const RACE_DEFINITIONS: RaceDefinition[] = [
  {
    id: Race.HUMAN,
    name: 'Humain',
    description: `Polyvalents et ambitieux.`,
  },
  {
    id: Race.ELF,
    name: 'Elfe',
    description: `Gracieux et magiques.`,
  },
  {
    id: Race.DWARF,
    name: 'Nain',
    description: `Robustes et endurants.`,
  },
  {
    id: Race.HALF_ORC,
    name: 'Demi-Orc',
    description: `Puissants et féroces.`,
  },
  {
    id: Race.TIEFLING,
    name: 'Tieffelin',
    description: `Héritage infernal.`,
  },
  {
    id: Race.HALFLING,
    name: 'Halfelin',
    description: `Agiles et chanceux.`,
  },
];

export const RACE_MAP: Record<Race, RaceDefinition> = Object.fromEntries(
  RACE_DEFINITIONS.map((r) => [r.id, r]),
) as Record<Race, RaceDefinition>;

export const RACE_VALUES = Object.values(Race) as [Race, ...Race[]];
