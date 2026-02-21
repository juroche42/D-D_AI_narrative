import { PrismaClient } from "@/app/generated/prisma/client";
import bcrypt from "bcrypt";

const SALT_ROUNDS = 12;

const users = [
  {
    username: "dungeon_master",
    password: "Password123!",
  },
  {
    username: "thorin_oakenshield",
    password: "Password123!",
  },
  {
    username: "aragorn_strider",
    password: "Password123!",
  },
];

export async function seedUsers(prisma: PrismaClient) {
  console.log("🌱 Seeding users...");

  for (const user of users) {
    const hashedPassword = await bcrypt.hash(user.password, SALT_ROUNDS);

    await prisma.user.upsert({
      where: { username: user.username },
      update: {},
      create: {
        username: user.username,
        password: hashedPassword,
      },
    });

    console.log(`  ✔ User "${user.username}" created/skipped`);
  }

  console.log(`✅ ${users.length} users seeded`);
}

