/*
  Warnings:

  - You are about to drop the column `description` on the `PersonalizedForm` table. All the data in the column will be lost.
  - You are about to drop the column `globalComments` on the `PersonalizedForm` table. All the data in the column will be lost.
  - You are about to drop the column `progress` on the `PersonalizedForm` table. All the data in the column will be lost.
  - You are about to drop the column `comment` on the `PersonalizedItem` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `PersonalizedItem` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `Role` table. All the data in the column will be lost.
  - You are about to drop the `UserFormSession` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserItemScore` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `score` on table `PersonalizedItem` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "public"."UserFormSession" DROP CONSTRAINT "UserFormSession_formId_fkey";

-- DropForeignKey
ALTER TABLE "public"."UserFormSession" DROP CONSTRAINT "UserFormSession_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."UserItemScore" DROP CONSTRAINT "UserItemScore_itemId_fkey";

-- DropForeignKey
ALTER TABLE "public"."UserItemScore" DROP CONSTRAINT "UserItemScore_sessionId_fkey";

-- DropForeignKey
ALTER TABLE "public"."UserItemScore" DROP CONSTRAINT "UserItemScore_userId_fkey";

-- AlterTable
ALTER TABLE "public"."PersonalizedForm" DROP COLUMN "description",
DROP COLUMN "globalComments",
DROP COLUMN "progress";

-- AlterTable
ALTER TABLE "public"."PersonalizedItem" DROP COLUMN "comment",
DROP COLUMN "notes",
ALTER COLUMN "score" SET NOT NULL;

-- AlterTable
ALTER TABLE "public"."Role" DROP COLUMN "description";

-- DropTable
DROP TABLE "public"."UserFormSession";

-- DropTable
DROP TABLE "public"."UserItemScore";
