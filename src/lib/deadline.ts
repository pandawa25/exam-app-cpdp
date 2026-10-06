import type { ExamAttempt, Exam } from "@prisma/client";

/** Deadline absolut attempt = startedAt (server) + durasi exam. */
export function getAttemptDeadline(attempt: ExamAttempt, exam: Exam): Date {
  return new Date(attempt.startedAt.getTime() + exam.durationMin * 60_000);
}

export const GRACE_PERIOD_MS = 5000;
export const VIOLATION_THRESHOLD = Number(process.env.VIOLATION_THRESHOLD ?? 3);
