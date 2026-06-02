/*
  Warnings:

  - A unique constraint covering the columns `[userId,weekStart]` on the table `WeeklyPlan` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "WeeklyPlan_userId_weekStart_key" ON "WeeklyPlan"("userId", "weekStart");
