/*
  Warnings:

  - You are about to drop the `CategorizationEntry` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CategorizationSession` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."CategorizationEntry" DROP CONSTRAINT "CategorizationEntry_sessionId_fkey";

-- DropForeignKey
ALTER TABLE "public"."CategorizationSession" DROP CONSTRAINT "CategorizationSession_organizationId_fkey";

-- DropTable
DROP TABLE "public"."CategorizationEntry";

-- DropTable
DROP TABLE "public"."CategorizationSession";

-- DropEnum
DROP TYPE "public"."CategorizationType";

-- CreateTable
CREATE TABLE "Opportunity" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Opportunity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Need" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Need_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Problem" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Problem_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Need" ADD CONSTRAINT "Need_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Problem" ADD CONSTRAINT "Problem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
