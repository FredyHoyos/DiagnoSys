/*
  Warnings:

  - A unique constraint covering the columns `[name,formId]` on the table `Category` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name,categoryId]` on the table `Item` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."Category_name_key";

-- DropIndex
DROP INDEX "public"."Item_name_key";

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_formId_key" ON "public"."Category"("name", "formId");

-- CreateIndex
CREATE UNIQUE INDEX "Item_name_categoryId_key" ON "public"."Item"("name", "categoryId");
