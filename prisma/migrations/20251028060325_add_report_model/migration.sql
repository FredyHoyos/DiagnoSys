/*
  Warnings:

  - A unique constraint covering the columns `[userId,baseFormId,auditId,reportId]` on the table `PersonalizedForm` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."PersonalizedForm_userId_baseFormId_auditId_key";

-- AlterTable
ALTER TABLE "PersonalizedForm" ADD COLUMN     "reportId" INTEGER;

-- CreateTable
CREATE TABLE "Report" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "userId" INTEGER NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Report_userId_name_version_key" ON "Report"("userId", "name", "version");

-- CreateIndex
CREATE UNIQUE INDEX "PersonalizedForm_userId_baseFormId_auditId_reportId_key" ON "PersonalizedForm"("userId", "baseFormId", "auditId", "reportId");

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonalizedForm" ADD CONSTRAINT "PersonalizedForm_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE SET NULL ON UPDATE CASCADE;
