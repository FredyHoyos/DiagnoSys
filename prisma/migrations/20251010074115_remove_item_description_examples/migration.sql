/*
  Warnings:

  - You are about to drop the column `description` on the `Item` table. All the data in the column will be lost.
  - You are about to drop the column `examples` on the `Item` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Item" DROP COLUMN "description",
DROP COLUMN "examples";
