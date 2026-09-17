/*
  Warnings:

  - A unique constraint covering the columns `[requestId,reviewerId]` on the table `Review` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `Review` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "SolverProfile" ADD COLUMN     "completedJobs" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "reputationScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0;

-- CreateIndex
CREATE INDEX "Review_reviewerId_idx" ON "Review"("reviewerId");

-- CreateIndex
CREATE INDEX "Review_requestId_idx" ON "Review"("requestId");

-- CreateIndex
CREATE INDEX "Review_createdAt_idx" ON "Review"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Review_requestId_reviewerId_key" ON "Review"("requestId", "reviewerId");

-- CreateIndex
CREATE INDEX "SolverProfile_rating_idx" ON "SolverProfile"("rating");

-- CreateIndex
CREATE INDEX "SolverProfile_reputationScore_idx" ON "SolverProfile"("reputationScore");
