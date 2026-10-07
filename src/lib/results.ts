import type { Prisma, Discipline, AttemptStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { DISCIPLINES } from "@/lib/constants";
import { matchOption } from "@/lib/users";
import { workingTime, type Working } from "@/lib/result-stats";

// Batas baris per halaman. Ringkasan dihitung dari baris yang ditampilkan,
// jadi kalau hasil melebihi batas ini UI memberi tahu supaya filter dipersempit.
export const RESULTS_LIMIT = 500;

export const ATTEMPT_STATUSES = ["IN_PROGRESS", "SUBMITTED", "AUTO_SUBMITTED", "REVIEWED"] as const;

export type ResultFilters = {
  examId: string | null;
  discipline: string | null;
  status: string | null;
  q: string;
};

type RawParams = Record<string, string | string[] | undefined>;

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export function parseFilters(sp: RawParams): ResultFilters {
  const status = first(sp.status);
  return {
    examId: first(sp.exam)?.trim() || null,
    discipline: matchOption(first(sp.discipline), DISCIPLINES),
    status: (ATTEMPT_STATUSES as readonly string[]).includes(status ?? "") ? (status as string) : null,
    q: first(sp.q)?.trim() ?? "",
  };
}

export type ResultRow = {
  id: string;
  name: string;
  email: string;
  department: string | null;
  discipline: string | null;
  position: string | null;
  examTitle: string;
  limitMin: number;
  passingScore: number;
  status: string;
  score: number | null;
  passed: boolean | null;
  startedAt: Date;
  work: Working;
  violationCount: number;
};

export async function loadResults(filters: ResultFilters) {
  const where: Prisma.ExamAttemptWhereInput = {
    AND: [
      filters.examId ? { examId: filters.examId } : {},
      filters.status ? { status: filters.status as AttemptStatus } : {},
      filters.discipline ? { user: { discipline: filters.discipline as Discipline } } : {},
      filters.q
        ? {
            user: {
              OR: [
                { name: { contains: filters.q, mode: "insensitive" as const } },
                { email: { contains: filters.q, mode: "insensitive" as const } },
                { department: { contains: filters.q, mode: "insensitive" as const } },
              ],
            },
          }
        : {},
    ],
  };

  const [attempts, total, exams] = await Promise.all([
    prisma.examAttempt.findMany({
      where,
      orderBy: { startedAt: "desc" },
      take: RESULTS_LIMIT,
      include: {
        exam: { select: { title: true, durationMin: true, passingScore: true } },
        user: { select: { name: true, email: true, department: true, discipline: true, position: true } },
        _count: { select: { violations: true } },
      },
    }),
    prisma.examAttempt.count({ where }),
    prisma.exam.findMany({
      where: { status: { not: "DRAFT" } },
      select: { id: true, title: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const rows: ResultRow[] = attempts.map((a) => ({
    id: a.id,
    name: a.user.name,
    email: a.user.email,
    department: a.user.department,
    discipline: a.user.discipline,
    position: a.user.position,
    examTitle: a.exam.title,
    limitMin: a.exam.durationMin,
    passingScore: a.exam.passingScore,
    status: a.status,
    score: a.score,
    passed: a.passed,
    startedAt: a.startedAt,
    work: workingTime(a.startedAt, a.submittedAt, a.exam.durationMin),
    violationCount: a._count.violations,
  }));

  return { rows, total, exams, truncated: total > rows.length };
}
