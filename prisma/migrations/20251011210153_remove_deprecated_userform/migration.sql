/*
  Warnings:

  - You are about to drop the `UserForm` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."UserForm" DROP CONSTRAINT "UserForm_formId_fkey";

-- DropForeignKey
ALTER TABLE "public"."UserForm" DROP CONSTRAINT "UserForm_userId_fkey";

-- DropTable
DROP TABLE "public"."UserForm";
