import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAttemptDeadline } from "@/lib/deadline";

// GET: detail attempt untuk halaman pengerjaan ujian.
// Kalau masih IN_PROGRESS: correctOption SENGAJA tidak disertakan di response.
// Kalau sudah SUBMITTED/REVIEWED: correctOption disertakan untuk halaman hasil.
export async function GET(_req: Request, { params }: { params: { attemptId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const attempt = await prisma.examAttempt.findUnique({
    where: { id: params.attemptId },
    include: { exam: true, answers: true, violations: true },
  });
  if (!attempt) return NextResponse.json({ error: "Attempt tidak ditemukan" }, { status: 404 });

  const isOwner = attempt.userId === session.user.id;
  const isReviewer = session.user.role === "SUPERVISOR" || session.user.role === "ADMIN";
  if (!isOwner && !isReviewer) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const questionIds = attempt.answers.map((a) => a.questionId);
  const questions = await prisma.question.findMany({ where: { id: { in: questionIds } } });
  const byId = new Map(questions.map((q) => [q.id, q]));

  const showAnswerKey = attempt.status !== "IN_PROGRESS";

  // Susun soal sesuai questionOrder (urutan unik per attempt), opsi sesuai optionOrder.
  const orderedQuestions = (attempt.questionOrder as string[]).map((qid) => {
    const q = byId.get(qid)!;
    const answer = attempt.answers.find((a) => a.questionId === qid)!;
    const optionOrder = answer.optionOrder as string[];
    const optionTextByKey: Record<string, string> = {
      A: q.optionA,
      B: q.optionB,
      C: q.optionC,
      D: q.optionD,
    };
    return {
      questionId: q.id,
      text: q.text,
      imageUrl: q.imageUrl,
      options: optionOrder.map((key) => ({ key, text: optionTextByKey[key] })),
      selectedOption: answer.selectedOption,
      correctOption: showAnswerKey ? q.correctOption : undefined,
    };
  });

  return NextResponse.json({
    id: attempt.id,
    status: attempt.status,
    score: attempt.score,
    passed: attempt.passed,
    startedAt: attempt.startedAt,
    deadline: getAttemptDeadline(attempt, attempt.exam),
    durationMin: attempt.exam.durationMin,
    examTitle: attempt.exam.title,
    violationCount: attempt.violations.length,
    violations: isReviewer ? attempt.violations : undefined,
    questions: orderedQuestions,
  });
}
