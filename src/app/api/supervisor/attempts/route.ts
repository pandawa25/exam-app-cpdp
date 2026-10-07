import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { finalizeExpiredAttempts } from "@/lib/scoring";

// GET: daftar attempt yang perlu direview supervisor.
// Default: SUBMITTED/AUTO_SUBMITTED yang belum REVIEWED, diurutkan attempt
// dengan pelanggaran paling banyak duluan - itu yang paling butuh perhatian.
export async function GET() {
  const session = await requireRole(["SUPERVISOR", "ADMIN"]);
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await finalizeExpiredAttempts();

  const attempts = await prisma.examAttempt.findMany({
    where: { status: { in: ["SUBMITTED", "AUTO_SUBMITTED"] } },
    include: {
      exam: { select: { title: true, discipline: true, position: true, passingScore: true } },
      user: { select: { name: true, email: true, discipline: true, position: true } },
      violations: true,
    },
    orderBy: { submittedAt: "desc" },
  });

  const withViolationCount = attempts
    .map((a) => ({ ...a, violationCount: a.violations.length }))
    .sort((a, b) => b.violationCount - a.violationCount);

  return NextResponse.json(withViolationCount);
}
