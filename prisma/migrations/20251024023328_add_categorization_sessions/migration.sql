-- CreateEnum
CREATE TYPE "CategorizationType" AS ENUM ('OPPORTUNITY', 'NEED', 'PROBLEM');

-- CreateTable
CREATE TABLE "CategorizationSession" (
    "id" SERIAL NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CategorizationSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CategorizationEntry" (
    "id" SERIAL NOT NULL,
    "sessionId" INTEGER NOT NULL,
    "type" "CategorizationType" NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CategorizationEntry_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CategorizationSession" ADD CONSTRAINT "CategorizationSession_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategorizationEntry" ADD CONSTRAINT "CategorizationEntry_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "CategorizationSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
