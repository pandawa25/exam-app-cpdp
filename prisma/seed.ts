import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { seedQuestionBanks } from "./seed-questions";

const prisma = new PrismaClient();

async function main() {
  // Di production set SEED_PASSWORD (env) supaya akun seed tidak memakai password default yang publik di README.
  const seedPassword = process.env.SEED_PASSWORD ?? "password123";
  const passwordHash = await bcrypt.hash(seedPassword, 10);

  await prisma.user.upsert({
    where: { email: "admin@perusahaan.com" },
    update: {},
    create: {
      name: "Admin HR",
      email: "admin@perusahaan.com",
      passwordHash,
      role: "ADMIN",
    },
  });

  await prisma.user.upsert({
    where: { email: "supervisor@perusahaan.com" },
    update: {},
    create: {
      name: "Budi Supervisor",
      email: "supervisor@perusahaan.com",
      passwordHash,
      role: "SUPERVISOR",
    },
  });

  await prisma.user.upsert({
    where: { email: "teknisi.instrumentasi@perusahaan.com" },
    update: {},
    create: {
      name: "Andi (Instrument)",
      email: "teknisi.instrumentasi@perusahaan.com",
      passwordHash,
      role: "PESERTA",
      discipline: "INSTRUMENTASI",
      position: "SR_TECHNICIAN_I",
    },
  });

  await prisma.user.upsert({
    where: { email: "teknisi.electrical@perusahaan.com" },
    update: {},
    create: {
      name: "Citra (Electrical)",
      email: "teknisi.electrical@perusahaan.com",
      passwordHash,
      role: "PESERTA",
      discipline: "ELECTRICAL",
      position: "SR_TECHNICIAN_I",
    },
  });

  // 25 bank soal dummy (5 disiplin x 5 jenjang x 30 soal). Idempotent.
  const result = await seedQuestionBanks(prisma);
  console.log(`Bank soal dummy: ${result.created} dibuat, ${result.skipped} dilewati (sudah ada).`);

  // Satu exam contoh supaya alur peserta bisa langsung dicoba (hanya jika belum ada).
  const sampleBank = await prisma.questionBank.findFirst({
    where: { discipline: "INSTRUMENTASI", position: "SR_TECHNICIAN_I", name: { contains: "dummy" } },
  });
  const title = "Ujian Kompetensi Instrument - Sr. Technician I (Contoh)";
  if (sampleBank && !(await prisma.exam.findFirst({ where: { title } }))) {
    const now = new Date();
    await prisma.exam.create({
      data: {
        title,
        questionBankId: sampleBank.id,
        discipline: "INSTRUMENTASI",
        position: "SR_TECHNICIAN_I",
        questionCount: 30,
        durationMin: 45,
        passingScore: 70,
        opensAt: now,
        closesAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
        status: "PUBLISHED",
      },
    });
  }

  console.log(
    process.env.SEED_PASSWORD
      ? "Seed selesai. Login dengan password dari env SEED_PASSWORD."
      : "Seed selesai. Login dengan password: password123 (GANTI di production: set env SEED_PASSWORD)"
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
