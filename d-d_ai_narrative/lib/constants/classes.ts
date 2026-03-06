import { CharClass } from '@/app/generated/prisma/client';

export interface ClassDefinition {
  id: CharClass;
  name: string;
  description: string;
}

/**
 * Définitions des classes D&D disponibles dans l'application.
 * Source de vérité unique, alignée sur l'enum `CharClass` du schéma Prisma.
 */
export const CLASS_DEFINITIONS: ClassDefinition[] = [
  {
    id: CharClass.FIGHTER,
    name: 'Guerrier',
    description: `Maître du combat martial.`,
  },
  {
    id: CharClass.MAGE,
    name: 'Mage',
    description: `Lanceur de sortis arcaniques.`,
  },
  {
    id: CharClass.ROGUE,
    name: 'Voleur',
    description: `Expert en discrétion.`,
  },
  {
    id: CharClass.CLERIC,
    name: 'Clerc',
    description: `Gardien divin et soigneur.`,
  },
  {
    id: CharClass.BARD,
    name: 'Barde',
    description: `Musicien et manipulateur.`,
  },
  {
    id: CharClass.RANGER,
    name: 'Rôdeur',
    description: `Chasseur des étendues sauvages.`,
  },
];

/**
 * Map CharClass → ClassDefinition pour un accès O(1) par clé.
 */
export const CLASS_MAP: Record<CharClass, ClassDefinition> = Object.fromEntries(
  CLASS_DEFINITIONS.map((c) => [c.id, c]),
) as Record<CharClass, ClassDefinition>;

/**
 * Tableau des valeurs de l'enum CharClass (utile pour Zod .enum()).
 */
export const CLASS_VALUES = Object.values(CharClass) as [CharClass, ...CharClass[]];

