-- CreateEnum
CREATE TYPE "CampaignTheme" AS ENUM ('HORROR', 'HEROIC', 'MYSTERY', 'INVESTIGATION');

-- CreateEnum
CREATE TYPE "CampaignDifficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- AlterTable
ALTER TABLE "rooms" ADD COLUMN     "campaignId" TEXT;

-- CreateTable
CREATE TABLE "campaigns" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "creatorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "synopsis" TEXT NOT NULL,
    "startLocation" TEXT NOT NULL,
    "mainQuest" TEXT NOT NULL,
    "systemPrompt" TEXT NOT NULL,
    "theme" "CampaignTheme" NOT NULL,
    "difficulty" "CampaignDifficulty" NOT NULL,
    "minPlayers" INTEGER NOT NULL DEFAULT 2,
    "maxPlayers" INTEGER NOT NULL DEFAULT 6,
    "estimatedDuration" INTEGER NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "isPremium" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "campaigns_isPublic_isPremium_idx" ON "campaigns"("isPublic", "isPremium");

-- AddForeignKey
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
