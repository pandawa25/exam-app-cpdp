import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SupervisorReviewCard } from "@/components/SupervisorReviewCard";
import { AppHeader } from "@/components/AppHeader";
import { finalizeExpiredAttempts } from "@/lib/scoring";

export const dynamic = "force-dynamic";

// Attempt dengan pelanggaran terbanyak ditampilkan duluan - itu yang paling
// butuh perhatian supervisor (lihat references/architecture.md & anti-cheat.md di skill).
export default async function SupervisorReviewPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "SUPERVISOR") redirect("/login");

  await finalizeExpiredAttempts();

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
    <>
      <AppHeader />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="page-title">Review hasil ujian</h1>
        <p className="mb-7 mt-1 text-sm text-ink-mute">
          {sorted.length === 0
            ? "Tidak ada hasil yang menunggu review."
            : `${sorted.length} hasil menunggu review, pelanggaran terbanyak di atas.`}
        </p>

        <div className="space-y-4">
          {sorted.length === 0 && (
            <div className="card p-6">
              <p className="font-medium text-ink">Semua hasil sudah direview.</p>
              <p className="mt-1 text-sm text-ink-mute">
                Hasil baru muncul di sini setelah peserta menyelesaikan ujian atau waktunya habis.
              </p>
            </div>
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
      </main>
    </>
  );
}
