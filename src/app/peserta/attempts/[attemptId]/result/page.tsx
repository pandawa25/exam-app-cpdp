import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppHeader } from "@/components/AppHeader";
import { formatClock, formatDate, formatDuration, workingTime } from "@/lib/result-stats";

export const dynamic = "force-dynamic";

const statusLabel: Record<string, string> = {
  SUBMITTED: "Selesai",
  AUTO_SUBMITTED: "Dihentikan otomatis (waktu habis atau pelanggaran)",
  REVIEWED: "Sudah direview supervisor",
};

const R = 48;
const C = 2 * Math.PI * R;

export default async function ResultPage({ params }: { params: { attemptId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const attempt = await prisma.examAttempt.findUnique({
    where: { id: params.attemptId },
    include: { exam: true, violations: true, answers: true },
  });
  if (!attempt || attempt.userId !== session.user.id) redirect("/peserta/exams");

  if (attempt.status === "IN_PROGRESS") {
    redirect(`/peserta/exams/${attempt.examId}/attempt`);
  }

  const work = workingTime(attempt.startedAt, attempt.submittedAt, attempt.exam.durationMin);
  // Hanya jumlah, bukan kunci jawaban per soal: soal bisa dipakai ulang oleh peserta lain.
  const total = attempt.answers.length;
  const answered = attempt.answers.filter((a) => a.selectedOption).length;
  const keys = await prisma.question.findMany({
    where: { id: { in: attempt.answers.map((a) => a.questionId) } },
    select: { id: true, correctOption: true },
  });
  const keyById = new Map(keys.map((q) => [q.id, q.correctOption]));
  const correct = attempt.answers.filter((a) => a.selectedOption && a.selectedOption === keyById.get(a.questionId)).length;

  const passing = attempt.exam.passingScore;
  const hasScore = attempt.score !== null && attempt.score !== undefined;
  const score = hasScore ? Math.min(100, Math.max(0, attempt.score as number)) : null;
  const tone = attempt.passed === null ? "brand" : attempt.passed ? "ok" : "alarm";
  const textColor = tone === "ok" ? "text-ok" : tone === "alarm" ? "text-alarm" : "text-ink";

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-xl px-4 py-8">
        <Link href="/peserta/history" className="text-sm text-ink-mute hover:text-ink">
          &larr; Kembali ke riwayat ujian
        </Link>

        <section className="card mt-4 p-6 sm:p-8">
          <h1 className="section-title text-center">{attempt.exam.title}</h1>
          <p className="mt-1 text-center text-sm text-ink-mute">{statusLabel[attempt.status]}</p>

          {/* Gauge melingkar: busur = skor, garis putih = batas lulus. */}
          <div className="mt-8 flex flex-col items-center">
            <div
              role="img"
              aria-label={score === null ? "Belum ada skor" : `Skor ${score} dari 100, nilai lulus ${passing}`}
              className="relative h-48 w-48"
            >
              <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90" aria-hidden="true">
                <circle cx="60" cy="60" r={R} fill="none" strokeWidth="9" className="stroke-panel-high" />
                {score !== null && (
                  <circle
                    cx="60"
                    cy="60"
                    r={R}
                    fill="none"
                    strokeWidth="9"
                    strokeLinecap="round"
                    strokeDasharray={`${(C * score) / 100} ${C}`}
                    className={tone === "ok" ? "stroke-ok" : tone === "alarm" ? "stroke-alarm" : "stroke-brand"}
                  />
                )}
                <line
                  x1="60"
                  y1={60 - R - 7}
                  x2="60"
                  y2={60 - R + 7}
                  strokeWidth="2.5"
                  className="stroke-ink"
                  transform={`rotate(${(passing / 100) * 360} 60 60)`}
                />
              </svg>
              <p className={`tnum absolute inset-0 flex items-center justify-center font-display text-6xl font-semibold ${textColor}`}>
                {score ?? "-"}
              </p>
            </div>
            <p className="tnum mt-3 text-sm text-ink-soft">Nilai lulus {passing}</p>
          </div>

          {attempt.passed !== null && (
            <p className="mt-5 text-center">
              <span className={`badge ${attempt.passed ? "badge-ok" : "badge-alarm"} px-3 py-1 text-sm`}>
                {attempt.passed ? "Lulus" : "Belum lulus"}
              </span>
            </p>
          )}

          <dl className="tnum mt-8 grid grid-cols-1 gap-x-6 gap-y-4 border-t border-panel-line pt-6 text-base sm:grid-cols-2">
            <div>
              <dt className="text-sm text-ink-mute">Tanggal</dt>
              <dd className="mt-0.5 text-ink">{formatDate(attempt.startedAt)}</dd>
            </div>
            <div>
              <dt className="text-sm text-ink-mute">Waktu pengerjaan</dt>
              <dd className="mt-0.5 text-ink">
                {work.ms === null ? "-" : formatDuration(work.ms)}
                {work.timedOut && <span className="ml-2 text-sm text-warn">waktu habis</span>}
              </dd>
              <dd className="text-sm text-ink-mute">
                {formatClock(attempt.startedAt)}
                {work.ms !== null && ` - ${formatClock(new Date(attempt.startedAt.getTime() + work.ms))}`} WIB, batas{" "}
                {attempt.exam.durationMin} menit
              </dd>
            </div>
            <div>
              <dt className="text-sm text-ink-mute">Soal benar</dt>
              <dd className="mt-0.5 text-ink">
                {correct} dari {total}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-ink-mute">Soal terjawab</dt>
              <dd className="mt-0.5 text-ink">
                {answered} dari {total}
              </dd>
            </div>
          </dl>

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
