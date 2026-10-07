import { PrismaClient, Discipline, Position } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const SAMPLE_QUESTIONS: Record<Discipline, { text: string; options: [string, string, string, string]; correct: string }[]> = {
  INSTRUMENTASI: [
    {
      text: "Pada transmitter tekanan dengan output 4-20 mA, apa penyebab paling mungkin jika output stuck di 4 mA terus-menerus walau tekanan proses berubah?",
      options: ["Loop power supply mati/putus", "Range transmitter terlalu lebar", "Tag number salah di DCS", "Orifice plate kotor"],
      correct: "A",
    },
    {
      text: "Protokol komunikasi digital yang memungkinkan multiple instrument dalam satu segmen kabel (multidrop) dan banyak dipakai di smart transmitter adalah?",
      options: ["4-20 mA analog", "HART / Foundation Fieldbus", "RS-232 point to point", "Pneumatic 3-15 psi"],
      correct: "B",
    },
    {
      text: "Saat kalibrasi control valve positioner, langkah pertama yang umum dilakukan sebelum zero & span adjustment adalah?",
      options: ["Langsung ganti diafragma", "Cek supply air instrument & linkage bebas macet", "Ganti positioner baru", "Set langsung ke 100% travel"],
      correct: "B",
    },
  ],
  ELECTRICAL: [
    {
      text: "Relay proteksi yang berfungsi mendeteksi arus lebih akibat gangguan/short circuit pada motor listrik disebut?",
      options: ["Overload relay (49/51)", "Undervoltage relay (27)", "Reverse power relay (32)", "Differential relay saja"],
      correct: "A",
    },
    {
      text: "Pada sistem grounding, fungsi utama earthing/grounding di peralatan listrik industri adalah?",
      options: ["Menaikkan efisiensi motor", "Mengurangi konsumsi daya", "Melindungi personel dari sengatan listrik akibat fault", "Menstabilkan frekuensi"],
      correct: "C",
    },
    {
      text: "Apa yang dimaksud dengan LOTO (Lock Out Tag Out) dalam pekerjaan kelistrikan?",
      options: ["Prosedur isolasi energi sebelum maintenance", "Jenis circuit breaker", "Metode pengukuran tahanan isolasi", "Standar warna kabel"],
      correct: "A",
    },
  ],
  STATIONARY: [
    {
      text: "Pada pressure vessel, PSV (Pressure Safety Valve) berfungsi untuk?",
      options: ["Mengatur level cairan", "Melepas tekanan berlebih agar vessel tidak pecah", "Mendinginkan proses", "Mengukur suhu vessel"],
      correct: "B",
    },
    {
      text: "Inspeksi ketebalan dinding tangki/vessel untuk mendeteksi korosi biasanya menggunakan metode?",
      options: ["Visual saja", "Ultrasonic Thickness (UT) gauge", "Pengukuran berat jenis", "Hydrotest tanpa alat ukur"],
      correct: "B",
    },
    {
      text: "Apa fungsi utama heat exchanger pada sistem stationary equipment?",
      options: ["Memompa fluida", "Memindahkan panas antara dua fluida tanpa bercampur", "Menyaring partikel padat", "Mengukur laju alir"],
      correct: "B",
    },
  ],
  ROTATING: [
    {
      text: "Getaran (vibration) tinggi yang tiba-tiba muncul pada centrifugal pump paling sering disebabkan oleh?",
      options: ["Kabel listrik kendor", "Misalignment atau unbalance pada rotor", "Tekanan suction terlalu rendah stabil", "Warna cat pump pudar"],
      correct: "B",
    },
    {
      text: "Kondisi di mana tekanan di sisi suction pompa turun di bawah tekanan uap fluida sehingga terbentuk gelembung uap yang kemudian pecah disebut?",
      options: ["Surge", "Cavitation", "Resonance", "Thermal expansion"],
      correct: "B",
    },
    {
      text: "Pada predictive maintenance rotating equipment, parameter yang paling umum dipantau secara rutin untuk deteksi dini kerusakan bearing adalah?",
      options: ["Warna oli", "Vibration analysis (spectrum & trend)", "Jumlah putaran per hari", "Berat equipment"],
      correct: "B",
    },
  ],
};

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
      name: "Andi (Teknisi Instrumentasi)",
      email: "teknisi.instrumentasi@perusahaan.com",
      passwordHash,
      role: "PESERTA",
      discipline: "INSTRUMENTASI",
      position: "TEKNISI_SENIOR",
    },
  });

  await prisma.user.upsert({
    where: { email: "teknisi.electrical@perusahaan.com" },
    update: {},
    create: {
      name: "Citra (Teknisi Electrical)",
      email: "teknisi.electrical@perusahaan.com",
      passwordHash,
      role: "PESERTA",
      discipline: "ELECTRICAL",
      position: "TEKNISI_SENIOR",
    },
  });

  for (const discipline of Object.keys(SAMPLE_QUESTIONS) as Discipline[]) {
    // Idempotent: seed boleh dijalankan ulang tanpa menggandakan bank soal contoh.
    const bankName = `${discipline} - Teknisi Senior (contoh)`;
    const existingBank = await prisma.questionBank.findFirst({ where: { name: bankName } });
    if (existingBank) continue;

    const bank = await prisma.questionBank.create({
      data: {
        name: bankName,
        discipline,
        position: Position.TEKNISI_SENIOR,
      },
    });

    for (const q of SAMPLE_QUESTIONS[discipline]) {
      await prisma.question.create({
        data: {
          questionBankId: bank.id,
          text: q.text,
          optionA: q.options[0],
          optionB: q.options[1],
          optionC: q.options[2],
          optionD: q.options[3],
          correctOption: q.correct,
          points: 1,
        },
      });
    }

    if (discipline === "INSTRUMENTASI") {
      const now = new Date();
      await prisma.exam.create({
        data: {
          title: `Ujian Kompetensi ${discipline} - Teknisi Senior (Contoh)`,
          questionBankId: bank.id,
          discipline,
          position: Position.TEKNISI_SENIOR,
          questionCount: SAMPLE_QUESTIONS[discipline].length,
          durationMin: 30,
          passingScore: 70,
          opensAt: now,
          closesAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
          status: "PUBLISHED",
        },
      });
    }
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
