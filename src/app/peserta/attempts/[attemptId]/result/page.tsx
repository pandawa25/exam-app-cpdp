import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppHeader } from "@/components/AppHeader";

export const dynamic = "force-dynamic";

const statusLabel: Record<string, string> = {
  SUBMITTED: "Selesai",
  AUTO_SUBMITTED: "Dihentikan otomatis (waktu habis atau pelanggaran)",
  REVIEWED: "Sudah direview supervisor",
};

export default async function ResultPage({ params }: { params: { attemptId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const attempt = await prisma.examAttempt.findUnique({
    where: { id: params.attemptId },
    include: { exam: true, violations: true },
  });
  if (!attempt || attempt.userId !== session.user.id) redirect("/peserta/exams");

  if (attempt.status === "IN_PROGRESS") {
    redirect(`/peserta/exams/${attempt.examId}/attempt`);
  }

  const passing = attempt.exam.passingScore;
  const hasScore = attempt.score !== null && attempt.score !== undefined;
  const score = hasScore ? Math.min(100, Math.max(0, attempt.score as number)) : null;
  const tone = attempt.passed === null ? "brand" : attempt.passed ? "ok" : "alarm";
  const barColor = tone === "ok" ? "bg-ok" : tone === "alarm" ? "bg-alarm" : "bg-brand";
  const textColor = tone === "ok" ? "text-ok" : tone === "alarm" ? "text-alarm" : "text-ink";

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-xl px-4 py-8">
        <Link href="/peserta/exams" className="text-sm text-ink-mute hover:text-ink">
          &larr; Kembali ke daftar exam
        </Link>

        <section className="card mt-4 p-6 sm:p-8">
          <h1 className="section-title">{attempt.exam.title}</h1>
          <p className="mt-1 text-sm text-ink-mute">{statusLabel[attempt.status]}</p>

          <p className={`tnum mt-8 font-display text-8xl font-semibold leading-none ${textColor}`}>
            {score ?? "-"}
          </p>

          {/* Bar gauge: isi = skor, garis putih = batas lulus (seperti PV vs setpoint di HMI). */}
          {score !== null && (
            <div className="mt-6">
              <div
                role="img"
                aria-label={`Skor ${score} dari 100, nilai lulus ${passing}`}
                className="relative h-3 rounded-full bg-panel-high"
              >
                <div className={`h-full rounded-full ${barColor}`} style={{ width: `${score}%` }} />
                <div
                  className="absolute -bottom-1.5 -top-1.5 w-0.5 rounded bg-ink"
                  style={{ left: `${Math.min(100, Math.max(0, passing))}%` }}
                />
              </div>
              <div className="relative mt-3 h-4 text-xs text-ink-mute">
                <span className="absolute left-0">0</span>
                <span
                  className="tnum absolute -translate-x-1/2 whitespace-nowrap text-ink-soft"
                  style={{ left: `${Math.min(92, Math.max(8, passing))}%` }}
                >
                  Nilai lulus {passing}
                </span>
                <span className="absolute right-0">100</span>
              </div>
            </div>
          )}

          {attempt.passed !== null && (
            <p className="mt-6">
              <span className={`badge ${attempt.passed ? "badge-ok" : "badge-alarm"} px-3 py-1 text-sm`}>
                {attempt.passed ? "Lulus" : "Belum lulus"}
              </span>
            </p>
          )}

          {attempt.violations.length > 0 && (
            <p className="notice notice-warn mt-6">
              Tercatat {attempt.violations.length} pelanggaran selama ujian. Hasil ini akan direview supervisor.
            </p>
          )}
          {attempt.reviewNote && (
            <p className="mt-6 border-t border-panel-line pt-4 text-sm text-ink-soft">
              <span className="font-medium text-ink">Catatan supervisor:</span> {attempt.reviewNote}
            </p>
          )}
        </section>
      </main>
    </>
  );
}
