-- Jenjang jabatan diganti dari 4 nilai generik menjadi 5 jenjang teknisi.
-- Data lama dipetakan: TEKNISI_JUNIOR -> JR_TECHNICIAN_I; TEKNISI_SENIOR, SUPERVISOR_LAPANGAN, ENGINEER -> SR_TECHNICIAN_I.
-- Setelah deploy, cek dan koreksi jabatan user yang sudah ada lewat menu User.

-- AlterEnum
BEGIN;
CREATE TYPE "Position_new" AS ENUM ('JR_TECHNICIAN_I', 'JR_TECHNICIAN_II', 'TECHNICIAN_I', 'TECHNICIAN_II', 'SR_TECHNICIAN_I');

ALTER TABLE "User" ALTER COLUMN "position" TYPE "Position_new" USING (
  CASE "position"::text
    WHEN 'TEKNISI_JUNIOR' THEN 'JR_TECHNICIAN_I'
    WHEN 'TEKNISI_SENIOR' THEN 'SR_TECHNICIAN_I'
    WHEN 'SUPERVISOR_LAPANGAN' THEN 'SR_TECHNICIAN_I'
    WHEN 'ENGINEER' THEN 'SR_TECHNICIAN_I'
  END
)::"Position_new";

ALTER TABLE "QuestionBank" ALTER COLUMN "position" TYPE "Position_new" USING (
  CASE "position"::text
    WHEN 'TEKNISI_JUNIOR' THEN 'JR_TECHNICIAN_I'
    WHEN 'TEKNISI_SENIOR' THEN 'SR_TECHNICIAN_I'
    WHEN 'SUPERVISOR_LAPANGAN' THEN 'SR_TECHNICIAN_I'
    WHEN 'ENGINEER' THEN 'SR_TECHNICIAN_I'
  END
)::"Position_new";

ALTER TABLE "Exam" ALTER COLUMN "position" TYPE "Position_new" USING (
  CASE "position"::text
    WHEN 'TEKNISI_JUNIOR' THEN 'JR_TECHNICIAN_I'
    WHEN 'TEKNISI_SENIOR' THEN 'SR_TECHNICIAN_I'
    WHEN 'SUPERVISOR_LAPANGAN' THEN 'SR_TECHNICIAN_I'
    WHEN 'ENGINEER' THEN 'SR_TECHNICIAN_I'
  END
)::"Position_new";

ALTER TYPE "Position" RENAME TO "Position_old";
ALTER TYPE "Position_new" RENAME TO "Position";
DROP TYPE "Position_old";
COMMIT;
