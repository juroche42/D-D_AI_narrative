import { CharClass } from '@/app/generated/prisma/enums';

export interface ClassDefinition {
  id: CharClass;
  name: string;
  description: string;
  competence: string;
}

/**
 * Définitions des classes D&D disponibles dans l'application.
 * Source de vérité unique, alignée sur l'enum `CharClass` du schéma Prisma.
 */
export const CLASS_DEFINITIONS: ClassDefinition[] = [
  {
    id: CharClass.FIGHTER,
    name: 'Guerrier',
    description: 'Maître du combat martial.',
    competence: 'SECOND SOUFFLE',
  },
  {
    id: CharClass.MAGE,
    name: 'Mage',
    description: 'Lanceur de sorts arcaniques.',
    competence: 'RÉCUPÉRATION ARCANIQUE',
  },
  {
    id: CharClass.ROGUE,
    name: 'Voleur',
    description: 'Expert en discrétion.',
    competence: 'ATTAQUE FURTIVE',
  },
  {
    id: CharClass.CLERIC,
    name: 'Clerc',
    description: 'Gardien divin et soigneur.',
    competence: 'DOMAINE DIVIN',
  },
  {
    id: CharClass.BARD,
    name: 'Barde',
    description: 'Musicien et manipulateur.',
    competence: 'INSPIRATION BARDIQUE',
  },
  {
    id: CharClass.RANGER,
    name: 'Rôdeur',
    description: 'Chasseur des étendues sauvages.',
    competence: 'EXPLORATEUR NÉ',
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

