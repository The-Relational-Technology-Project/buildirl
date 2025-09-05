-- CreateTable
CREATE TABLE "rhythm" (
    "id" SERIAL NOT NULL,
    "frequency" TEXT NOT NULL,
    "day_of_week" TEXT NOT NULL,
    "clubId" INTEGER NOT NULL,

    CONSTRAINT "rhythm_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "rhythm_clubId_key" ON "rhythm"("clubId");

-- AddForeignKey
ALTER TABLE "rhythm" ADD CONSTRAINT "rhythm_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "club"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
