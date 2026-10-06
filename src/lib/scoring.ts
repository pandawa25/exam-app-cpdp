import { prisma } from "@/lib/prisma";
import type { AttemptStatus } from "@prisma/client";

/**
 * Hitung skor attempt dan tutup attempt (submit/auto-submit).
 * Dipanggil dari endpoint submit (manual) maupun heartbeat (auto, saat waktu habis).
 * correctOption TIDAK pernah dikirim ke client sebelum fungsi ini dipanggil.
 */
export async function finalizeAttempt(attemptId: string, status: AttemptStatus) {
  const attempt = await prisma.examAttempt.findUnique({
    where: { id: attemptId },
    include: {
      exam: true,
      answers: true,
    },
  });
  if (!attempt || attempt.status !== "IN_PROGRESS") return attempt;

  const questionIds = attempt.answers.map((a) => a.questionId);
  const questions = await prisma.question.findMany({
    where: { id: { in: questionIds } },
  });
  const correctById = new Map(questions.map((q) => [q.id, q]));

  let totalPoints = 0;
  let earnedPoints = 0;
  for (const answer of attempt.answers) {
    const question = correctById.get(answer.questionId);
    if (!question) continue;
    totalPoints += question.points;
    if (answer.selectedOption && answer.selectedOption === question.correctOption) {
      earnedPoints += question.points;
    }
  }

  const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
  const passed = score >= attempt.exam.passingScore;

  return prisma.examAttempt.update({
    where: { id: attemptId },
    data: {
      status,
      submittedAt: new Date(),
      score,
      passed,
    },
  });
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
