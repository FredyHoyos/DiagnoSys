/*
  Warnings:

  - You are about to drop the column `color` on the `HighPriority` table. All the data in the column will be lost.
  - You are about to drop the column `color` on the `LowPriority` table. All the data in the column will be lost.
  - You are about to drop the column `color` on the `MediumPriority` table. All the data in the column will be lost.
  - You are about to drop the column `color` on the `MediumPriority2` table. All the data in the column will be lost.
  - You are about to drop the column `color` on the `Need` table. All the data in the column will be lost.
  - You are about to drop the column `color` on the `Opportunity` table. All the data in the column will be lost.
  - You are about to drop the column `color` on the `Problem` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "HighPriority" DROP COLUMN "color";

-- AlterTable
ALTER TABLE "LowPriority" DROP COLUMN "color";

-- AlterTable
ALTER TABLE "MediumPriority" DROP COLUMN "color";

-- AlterTable
ALTER TABLE "MediumPriority2" DROP COLUMN "color";

-- AlterTable
ALTER TABLE "Need" DROP COLUMN "color";

-- AlterTable
ALTER TABLE "Opportunity" DROP COLUMN "color";

-- AlterTable
ALTER TABLE "Problem" DROP COLUMN "color";
