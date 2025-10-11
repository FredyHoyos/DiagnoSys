/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `Form` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Form_name_key" ON "public"."Form"("name");
