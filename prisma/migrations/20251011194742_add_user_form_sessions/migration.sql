/*
  Warnings:

  - A unique constraint covering the columns `[userId,itemId,sessionId]` on the table `UserItemScore` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `sessionId` to the `UserItemScore` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."UserItemScore_userId_itemId_key";

-- AlterTable
ALTER TABLE "public"."UserItemScore" ADD COLUMN     "isSelected" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "sessionId" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "public"."UserFormSession" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "formId" INTEGER NOT NULL,
    "sessionName" TEXT,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "isCurrent" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserFormSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserFormSession_userId_formId_isCurrent_key" ON "public"."UserFormSession"("userId", "formId", "isCurrent");

-- CreateIndex
CREATE UNIQUE INDEX "UserItemScore_userId_itemId_sessionId_key" ON "public"."UserItemScore"("userId", "itemId", "sessionId");

-- AddForeignKey
ALTER TABLE "public"."UserFormSession" ADD CONSTRAINT "UserFormSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserFormSession" ADD CONSTRAINT "UserFormSession_formId_fkey" FOREIGN KEY ("formId") REFERENCES "public"."Form"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserItemScore" ADD CONSTRAINT "UserItemScore_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."UserFormSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
