import { prisma } from "@/lib/prisma";
import { shuffle } from "@/lib/scoring";
import { matchesProfile } from "@/lib/examAccess";

export type StartAttemptResult =
  | { ok: true; attemptId: string }
  | { ok: false; error: string };

/**
 * Logic inti "mulai ujian" - dipakai baik dari API route (POST /api/exams/[id]/start,
 * untuk client-side navigation) maupun langsung dari server component halaman attempt
 * (supaya tidak perlu fetch-ke-diri-sendiri saat render pertama).
 */
export async function startOrResumeAttempt(
  examId: string,
  userId: string,
  userDiscipline: string | null,
  userPosition: string | null
): Promise<StartAttemptResult> {
  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    include: { questionBank: { include: { questions: true } } },
  });
  if (!exam) return { ok: false, error: "Exam tidak tersedia" };
  if (!matchesProfile(exam, { discipline: userDiscipline, position: userPosition })) {
    return { ok: false, error: "Exam ini bukan untuk disiplin/jabatan Anda" };
  }

  // Attempt yang sedang berjalan SELALU boleh dilanjutkan (misal setelah refresh/koneksi putus),
  // walau exam sudah lewat closesAt atau di-CLOSE admin. Sisa waktunya tetap dibatasi deadline
  // attempt dan di-finalize oleh heartbeat - kalau dicek setelah window, peserta yang mulai
  // 5 menit sebelum closesAt tidak bisa kembali dan attempt-nya menggantung IN_PROGRESS selamanya.
  const existing = await prisma.examAttempt.findFirst({
    where: { examId, userId, status: "IN_PROGRESS" },
  });
  if (existing) return { ok: true, attemptId: existing.id };

  if (exam.status !== "PUBLISHED") return { ok: false, error: "Exam tidak tersedia" };
  const now = new Date();
  if (now < exam.opensAt || now > exam.closesAt) {
    return { ok: false, error: "Exam belum/tidak lagi dibuka" };
  }

  // Kalau sudah pernah attempt (submitted) dan exam tidak mengizinkan retake,
  // jangan buat attempt baru.
  const previous = await prisma.examAttempt.findFirst({ where: { examId, userId } });
  if (previous) return { ok: false, error: "Anda sudah mengerjakan exam ini" };

  const selectedQuestions = shuffle(exam.questionBank.questions).slice(0, exam.questionCount);
  const attempt = await prisma.examAttempt.create({
    data: {
      examId: exam.id,
      userId,
      questionOrder: selectedQuestions.map((q) => q.id),
      answers: {
        create: selectedQuestions.map((q) => ({
          questionId: q.id,
          optionOrder: shuffle(["A", "B", "C", "D"]),
        })),
      },
    },
  });

  return { ok: true, attemptId: attempt.id };
}
