-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'SCHOOL_COORDINATOR';

-- AlterTable
ALTER TABLE "AkcPlayer" ADD COLUMN     "guardianPhone" VARCHAR(50),
ADD COLUMN     "nationality" VARCHAR(100),
ADD COLUMN     "schoolClass" VARCHAR(50),
ADD COLUMN     "studentCode" VARCHAR(100);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "akcSchoolId" INTEGER;

-- CreateIndex
CREATE INDEX "AkcPlayer_studentCode_idx" ON "AkcPlayer"("studentCode");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_akcSchoolId_fkey" FOREIGN KEY ("akcSchoolId") REFERENCES "AkcSchool"("id") ON DELETE SET NULL ON UPDATE CASCADE;

