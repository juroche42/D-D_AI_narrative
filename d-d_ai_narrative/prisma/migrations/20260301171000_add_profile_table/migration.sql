-- CreateEnum
CREATE TYPE "ProfileLanguage" AS ENUM ('FR', 'EN');

-- CreateTable
CREATE TABLE "Profile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "avatarUrl" TEXT NOT NULL DEFAULT '',
    "bio" TEXT NOT NULL DEFAULT '',
    "language" "ProfileLanguage" NOT NULL DEFAULT 'FR',
    "darkMode" BOOLEAN NOT NULL DEFAULT false,
    "totalGames" INTEGER NOT NULL DEFAULT 0,
    "totalTurns" INTEGER NOT NULL DEFAULT 0,
    "monstersDefeated" INTEGER NOT NULL DEFAULT 0,
    "naturalCrits" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- Backfill existing users with a default profile
INSERT INTO "Profile" (
    "id",
    "userId",
    "avatarUrl",
    "bio",
    "language",
    "darkMode",
    "totalGames",
    "totalTurns",
    "monstersDefeated",
    "naturalCrits",
    "updatedAt"
)
SELECT
    'profile_' || "id",
    "id",
    '',
    '',
    'FR'::"ProfileLanguage",
    false,
    0,
    0,
    0,
    0,
    CURRENT_TIMESTAMP
FROM "User";

-- CreateIndex
CREATE UNIQUE INDEX "Profile_userId_key" ON "Profile"("userId");

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
