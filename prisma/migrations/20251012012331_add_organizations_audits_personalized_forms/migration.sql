-- AlterTable
ALTER TABLE "public"."Form" ADD COLUMN     "isPublished" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "organizationId" INTEGER;

-- CreateTable
CREATE TABLE "public"."Organization" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Audit" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "consultantId" INTEGER NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Audit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PersonalizedForm" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "baseFormId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "auditId" INTEGER,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PersonalizedForm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PersonalizedCategory" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "baseCategoryId" INTEGER NOT NULL,
    "personalizedFormId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PersonalizedCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PersonalizedItem" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "isCustom" BOOLEAN NOT NULL DEFAULT false,
    "baseItemId" INTEGER,
    "personalizedCategoryId" INTEGER NOT NULL,
    "score" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PersonalizedItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Audit_consultantId_organizationId_name_key" ON "public"."Audit"("consultantId", "organizationId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "PersonalizedForm_userId_baseFormId_auditId_key" ON "public"."PersonalizedForm"("userId", "baseFormId", "auditId");

-- CreateIndex
CREATE UNIQUE INDEX "PersonalizedCategory_personalizedFormId_baseCategoryId_key" ON "public"."PersonalizedCategory"("personalizedFormId", "baseCategoryId");

-- CreateIndex
CREATE UNIQUE INDEX "PersonalizedItem_personalizedCategoryId_baseItemId_key" ON "public"."PersonalizedItem"("personalizedCategoryId", "baseItemId");

-- CreateIndex
CREATE UNIQUE INDEX "PersonalizedItem_personalizedCategoryId_name_key" ON "public"."PersonalizedItem"("personalizedCategoryId", "name");

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "User_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Audit" ADD CONSTRAINT "Audit_consultantId_fkey" FOREIGN KEY ("consultantId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Audit" ADD CONSTRAINT "Audit_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PersonalizedForm" ADD CONSTRAINT "PersonalizedForm_baseFormId_fkey" FOREIGN KEY ("baseFormId") REFERENCES "public"."Form"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PersonalizedForm" ADD CONSTRAINT "PersonalizedForm_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PersonalizedForm" ADD CONSTRAINT "PersonalizedForm_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "public"."Audit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PersonalizedCategory" ADD CONSTRAINT "PersonalizedCategory_baseCategoryId_fkey" FOREIGN KEY ("baseCategoryId") REFERENCES "public"."Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PersonalizedCategory" ADD CONSTRAINT "PersonalizedCategory_personalizedFormId_fkey" FOREIGN KEY ("personalizedFormId") REFERENCES "public"."PersonalizedForm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PersonalizedItem" ADD CONSTRAINT "PersonalizedItem_baseItemId_fkey" FOREIGN KEY ("baseItemId") REFERENCES "public"."Item"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PersonalizedItem" ADD CONSTRAINT "PersonalizedItem_personalizedCategoryId_fkey" FOREIGN KEY ("personalizedCategoryId") REFERENCES "public"."PersonalizedCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
