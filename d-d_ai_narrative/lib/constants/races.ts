import { Race } from '@/app/generated/prisma/enums';

export interface RaceDefinition {
  id: Race;
  name: string;
  description: string;
  bonus: string;
}

export const RACE_DEFINITIONS: RaceDefinition[] = [
  {
    id: Race.HUMAN,
    name: 'Humain',
    description: 'Polyvalents et ambitieux.',
    bonus: '+1 À TOUTES LES STATS',
  },
  {
    id: Race.ELF,
    name: 'Elfe',
    description: 'Gracieux et magiques.',
    bonus: '+1 À DEXTÉRITÉ',
  },
  {
    id: Race.DWARF,
    name: 'Nain',
    description: 'Robustes et endurants.',
    bonus: '+1 À CONSTITUTION',
  },
  {
    id: Race.HALF_ORC,
    name: 'Demi-Orc',
    description: 'Puissants et féroces.',
    bonus: '+1 À FORCE',
  },
  {
    id: Race.TIEFLING,
    name: 'Tieffelin',
    description: 'Héritage infernal.',
    bonus: '+1 À CHARISME',
  },
  {
    id: Race.HALFLING,
    name: 'Halfelin',
    description: 'Agiles et chanceux.',
    bonus: '+1 À DEXTÉRITÉ',
  },
];

export const RACE_MAP: Record<Race, RaceDefinition> = Object.fromEntries(
  RACE_DEFINITIONS.map((r) => [r.id, r]),
) as Record<Race, RaceDefinition>;

export const RACE_VALUES = Object.values(Race) as [Race, ...Race[]];
