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
  const barColor = tone === "ok" ? "bg-ok" : tone === "alarm" ? "bg-alarm" : "bg-brand";
  const textColor = tone === "ok" ? "text-ok" : tone === "alarm" ? "text-alarm" : "text-ink";

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-xl px-4 py-8">
        <Link href="/peserta/history" className="text-sm text-ink-mute hover:text-ink">
          &larr; Kembali ke riwayat ujian
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

          <dl className="tnum mt-8 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-panel-line pt-6 text-sm">
            <div>
              <dt className="text-xs text-ink-mute">Tanggal</dt>
              <dd className="mt-0.5 text-ink">{formatDate(attempt.startedAt)}</dd>
            </div>
            <div>
              <dt className="text-xs text-ink-mute">Waktu pengerjaan</dt>
              <dd className="mt-0.5 text-ink">
                {work.ms === null ? "-" : formatDuration(work.ms)}
                {work.timedOut && <span className="ml-2 text-xs text-warn">waktu habis</span>}
              </dd>
              <dd className="text-xs text-ink-mute">
                {formatClock(attempt.startedAt)}
                {work.ms !== null && ` - ${formatClock(new Date(attempt.startedAt.getTime() + work.ms))}`} WIB, batas{" "}
                {attempt.exam.durationMin} menit
              </dd>
            </div>
            <div>
              <dt className="text-xs text-ink-mute">Soal benar</dt>
              <dd className="mt-0.5 text-ink">
                {correct} dari {total}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-ink-mute">Soal terjawab</dt>
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
