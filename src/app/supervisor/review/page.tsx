import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SupervisorReviewCard } from "@/components/SupervisorReviewCard";

export const dynamic = "force-dynamic";

// Attempt dengan pelanggaran terbanyak ditampilkan duluan - itu yang paling
// butuh perhatian supervisor (lihat references/architecture.md & anti-cheat.md di skill).
export default async function SupervisorReviewPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "SUPERVISOR") redirect("/login");

  const attempts = await prisma.examAttempt.findMany({
    where: { status: { in: ["SUBMITTED", "AUTO_SUBMITTED"] } },
    include: {
      exam: { select: { title: true, passingScore: true } },
      user: { select: { name: true, email: true } },
      violations: true,
    },
    orderBy: { submittedAt: "desc" },
  });

  const sorted = [...attempts].sort((a, b) => b.violations.length - a.violations.length);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-xl font-semibold mb-1">Review Hasil Ujian</h1>
      <p className="text-sm text-slate-500 mb-6">
        {sorted.length} attempt menunggu review.
      </p>

      <div className="space-y-4">
        {sorted.length === 0 && (
          <p className="text-sm text-slate-500 bg-white border border-slate-200 rounded-xl p-6">
            Tidak ada attempt yang perlu direview saat ini.
          </p>
        )}
        {sorted.map((attempt) => (
          <SupervisorReviewCard
            key={attempt.id}
            attempt={{
              id: attempt.id,
              status: attempt.status,
              score: attempt.score,
              passed: attempt.passed,
              violationCount: attempt.violations.length,
              exam: attempt.exam,
              user: attempt.user,
            }}
          />
        ))}
      </div>
    </div>
  );
}
