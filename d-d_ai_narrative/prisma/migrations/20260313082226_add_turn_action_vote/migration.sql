-- CreateEnum
CREATE TYPE "TurnActionType" AS ENUM ('SUGGESTED', 'FREE');

-- DropIndex
DROP INDEX "vector_documents_embedding_idx";

-- CreateTable
CREATE TABLE "turn_actions" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "gameStateId" TEXT NOT NULL,
    "turn" INTEGER NOT NULL,
    "type" "TurnActionType" NOT NULL DEFAULT 'SUGGESTED',
    "content" TEXT NOT NULL,
    "authorId" TEXT,

    CONSTRAINT "turn_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "votes" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "gameStateId" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "actionId" TEXT NOT NULL,
    "turn" INTEGER NOT NULL,
    "votedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "votes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "turn_actions_gameStateId_turn_idx" ON "turn_actions"("gameStateId", "turn");

-- CreateIndex
CREATE UNIQUE INDEX "votes_gameStateId_userId_turn_key" ON "votes"("gameStateId", "userId", "turn");

-- AddForeignKey
ALTER TABLE "turn_actions" ADD CONSTRAINT "turn_actions_gameStateId_fkey" FOREIGN KEY ("gameStateId") REFERENCES "game_states"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votes" ADD CONSTRAINT "votes_gameStateId_fkey" FOREIGN KEY ("gameStateId") REFERENCES "game_states"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votes" ADD CONSTRAINT "votes_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "turn_actions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votes" ADD CONSTRAINT "votes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
