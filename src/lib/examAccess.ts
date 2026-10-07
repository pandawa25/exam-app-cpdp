import type { Prisma } from "@prisma/client";

type Profile = { discipline: string | null | undefined; position: string | null | undefined };

/**
 * Filter Prisma untuk exam yang BOLEH dilihat/dikerjakan peserta: PUBLISHED, dalam jendela waktu,
 * dan disiplin + jabatan sama persis dengan profilnya. Mengembalikan null kalau profil peserta
 * belum lengkap - pemanggil harus menampilkan daftar kosong. Ini penting: nilai undefined di
 * filter Prisma berarti "abaikan filter" dan akan membocorkan semua exam.
 */
export function visibleExamsWhere(profile: Profile, now: Date): Prisma.ExamWhereInput | null {
  if (!profile.discipline || !profile.position) return null;
  return {
    status: "PUBLISHED",
    discipline: profile.discipline as Prisma.ExamWhereInput["discipline"],
    position: profile.position as Prisma.ExamWhereInput["position"],
    opensAt: { lte: now },
    closesAt: { gte: now },
  };
}

/** Exam ini memang untuk disiplin + jabatan peserta (dipakai saat mulai/lanjut ujian). */
export function matchesProfile(exam: { discipline: string; position: string }, profile: Profile): boolean {
  return !!profile.discipline && !!profile.position && exam.discipline === profile.discipline && exam.position === profile.position;
}
