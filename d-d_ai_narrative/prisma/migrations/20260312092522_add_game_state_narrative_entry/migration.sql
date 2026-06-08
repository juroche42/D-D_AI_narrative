-- CreateEnum
CREATE TYPE "NarrativeEntryType" AS ENUM ('NARRATION', 'ACTION', 'DICE_ROLL', 'SYSTEM');

-- DropIndex
DROP INDEX "vector_documents_embedding_idx";

-- CreateTable
CREATE TABLE "game_states" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "roomId" TEXT NOT NULL,
    "currentTurn" INTEGER NOT NULL DEFAULT 1,
    "worldState" JSONB NOT NULL DEFAULT '{}',
    "narrativeContext" TEXT NOT NULL DEFAULT '',
    "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "game_states_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "narrative_entries" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "gameStateId" TEXT NOT NULL,
    "turn" INTEGER NOT NULL,
    "type" "NarrativeEntryType" NOT NULL,
    "content" TEXT NOT NULL,
    "authorId" TEXT,

    CONSTRAINT "narrative_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "game_states_roomId_key" ON "game_states"("roomId");

-- CreateIndex
CREATE INDEX "narrative_entries_gameStateId_turn_idx" ON "narrative_entries"("gameStateId", "turn");

-- AddForeignKey
ALTER TABLE "game_states" ADD CONSTRAINT "game_states_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "narrative_entries" ADD CONSTRAINT "narrative_entries_gameStateId_fkey" FOREIGN KEY ("gameStateId") REFERENCES "game_states"("id") ON DELETE CASCADE ON UPDATE CASCADE;
