import { PrismaClient, Race, CharClass } from "@/app/generated/prisma/client";

type CharacterSeedData = {
  name: string;
  race: Race;
  class: CharClass;
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
  maxHp: number;
  currentHp: number;
  armorClass: number;
  xp: number;
  level: number;
};

// Associe chaque personnage à un username existant
const CHARACTERS: { username: string; character: CharacterSeedData }[] = [
  {
    username: "thorin_oakenshield",
    character: {
      name: "Thorin",
      race: Race.DWARF,
      class: CharClass.FIGHTER,
      strength: 18,
      dexterity: 12,
      constitution: 16,
      intelligence: 10,
      wisdom: 11,
      charisma: 9,
      maxHp: 45,
      currentHp: 45,
      armorClass: 16,
      xp: 0,
      level: 1,
    },
  },
  {
    username: "aragorn_strider",
    character: {
      name: "Aragorn",
      race: Race.HUMAN,
      class: CharClass.RANGER,
      strength: 16,
      dexterity: 17,
      constitution: 14,
      intelligence: 12,
      wisdom: 14,
      charisma: 15,
      maxHp: 38,
      currentHp: 38,
      armorClass: 15,
      xp: 0,
      level: 1,
    },
  },
  {
    username: "dungeon_master",
    character: {
      name: "Zyx le Tiefling",
      race: Race.TIEFLING,
      class: CharClass.MAGE,
      strength: 8,
      dexterity: 14,
      constitution: 12,
      intelligence: 18,
      wisdom: 13,
      charisma: 16,
      maxHp: 28,
      currentHp: 28,
      armorClass: 12,
      xp: 0,
      level: 1,
    },
  },
];

export async function seedCharacters(prisma: PrismaClient) {
  console.log("🌱 Seeding characters...");

  for (const { username, character } of CHARACTERS) {
    const user = await prisma.user.findUnique({ where: { username } });

    if (!user) {
      console.warn(`  ⚠ User "${username}" not found, skipping character "${character.name}"`);
      continue;
    }

    await prisma.character.upsert({
      where: {
        // upsert basé sur userId + name (combinaison unique métier)
        userId_name: {
          userId: user.id,
          name: character.name,
        },
      },
      update: {},
      create: {
        ...character,
        userId: user.id,
      },
    });

    console.log(`  ✔ Character "${character.name}" (${character.race} ${character.class}) for user "${username}"`);
  }

  console.log(`✅ ${CHARACTERS.length} characters seeded`);
}

