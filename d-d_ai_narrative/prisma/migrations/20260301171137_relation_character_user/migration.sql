/*
  Warnings:

  - A unique constraint covering the columns `[userId,name]` on the table `Character` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Character_userId_name_key" ON "Character"("userId", "name");
