import { conflict } from '@/lib/api/errors';
import { prisma } from '@/lib/prisma';
import type { CreateCharacter } from '@/lib/validations/character';
import type { Character } from '@/app/generated/prisma/client';

export type CharacterResponse = Omit<Character, 'userId'> & { userId: string };

/**
 * Calcule les HP max en fonction de la classe et de la constitution.
 * Formule D&D 5e simplifiée : dé de vie max + modificateur de constitution.
 */
function computeMaxHp(charClass: string, constitution: number): number {
  const hitDice: Record<string, number> = {
    FIGHTER: 10,
    MAGE: 6,
    ROGUE: 8,
    CLERIC: 8,
    BARD: 8,
    RANGER: 10,
  };

  const conModifier = Math.floor((constitution - 10) / 2);
  const hd = hitDice[charClass] ?? 8;

  return hd + conModifier;
}

/**
 * Calcule la classe d'armure de base (sans armure) en fonction de la dextérité.
 * Formule D&D 5e : 10 + modificateur de dextérité.
 */
function computeArmorClass(dexterity: number): number {
  return 10 + Math.floor((dexterity - 10) / 2);
}

export async function createCharacter(
  userId: string,
  data: CreateCharacter,
): Promise<CharacterResponse> {
  // Vérifier qu'un personnage avec ce nom n'existe pas déjà pour cet utilisateur
  const existing = await prisma.character.findUnique({
    where: { userId_name: { userId, name: data.name } },
  });

  if (existing) {
    throw conflict(`Un personnage nommé "${data.name}" existe déjà.`);
  }

  const maxHp = computeMaxHp(data.class, data.stats.constitution);
  const armorClass = computeArmorClass(data.stats.dexterity);

  const character = await prisma.character.create({
    data: {
      userId,
      name: data.name,
      race: data.race,
      class: data.class,
      strength: data.stats.strength,
      dexterity: data.stats.dexterity,
      constitution: data.stats.constitution,
      intelligence: data.stats.intelligence,
      wisdom: data.stats.wisdom,
      charisma: data.stats.charisma,
      maxHp,
      currentHp: maxHp,
      armorClass,
      xp: 0,
      level: 1,
    },
  });

  return character;
}

