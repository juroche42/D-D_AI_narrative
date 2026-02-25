import { PrismaClient } from "@/app/generated/prisma/client";
import bcrypt from "bcrypt";
import crypto from "crypto";

const SALT_ROUNDS = 12;

const USERNAMES = ["dungeon_master", "thorin_oakenshield", "aragorn_strider"];

function generateRandomPassword(length = 16): string {
  const charset =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  return Array.from(crypto.randomBytes(length))
    .map((byte) => charset[byte % charset.length])
    .join("");
}

export async function seedUsers(prisma: PrismaClient) {
  console.log("🌱 Seeding users...");

  for (const username of USERNAMES) {
    const plainPassword = generateRandomPassword();
    const hashedPassword = await bcrypt.hash(plainPassword, SALT_ROUNDS);

    await prisma.user.upsert({
      where: { username },
      update: {},
      create: {
        username,
        password: hashedPassword,
      },
    });

    console.log(`  ✔ User "${username}" created/skipped (password: ${plainPassword})`);
  }

  console.log(`✅ ${USERNAMES.length} users seeded`);
}

