/*
  Warnings:

  - You are about to drop the column `salaryRange` on the `IndustryInsight` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "IndustryInsight" DROP COLUMN "salaryRange",
ADD COLUMN     "salaryRanges" JSONB[];
