import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { finalizeExpiredAttempts } from "@/lib/scoring";
import { formatClock, formatDate, formatDuration, summarize, workingTime } from "@/lib/result-stats";
import { AppHeader } from "@/components/AppHeader";
import { PesertaTabs } from "@/components/PesertaTabs";

export const dynamic = "force-dynamic";

const STATUS: Record<string, { label: string; className: string }> = {
  IN_PROGRESS: { label: "Sedang berjalan", className: "badge-warn" },
  SUBMITTED: { label: "Selesai", className: "badge-info" },
  AUTO_SUBMITTED: { label: "Dihentikan otomatis", className: "badge-alarm" },
  REVIEWED: { label: "Sudah direview", className: "badge-ok" },
};

// Riwayat semua ujian milik peserta yang login, termasuk exam yang sudah ditutup
// (daftar "Ujian tersedia" hanya memuat ujian yang sedang terbuka).
export default async function PesertaHistoryPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "PESERTA") redirect("/login");

  // Tutup attempt yang waktunya habis tapi belum di-finalize, supaya tidak tampil "berjalan" selamanya.
  await finalizeExpiredAttempts();

  const attempts = await prisma.examAttempt.findMany({
    where: { userId: session.user.id },
    include: {
      exam: { select: { title: true, durationMin: true, passingScore: true } },
      _count: { select: { violations: true } },
    },
    orderBy: { startedAt: "desc" },
  });

  const rows = attempts.map((a) => ({ ...a, work: workingTime(a.startedAt, a.submittedAt, a.exam.durationMin) }));
  const summary = summarize(rows.map((r) => ({ status: r.status, score: r.score, passed: r.passed, workMs: r.work.ms })));
  const passedCount = rows.filter((r) => r.passed).length;

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <PesertaTabs current="history" />
        <h1 className="page-title">Riwayat ujian</h1>
        <p className="mb-6 mt-1 text-sm text-ink-mute">
          {rows.length === 0
            ? "Anda belum pernah mengerjakan ujian."
            : `${rows.length} ujian, terbaru di atas. Waktu dalam WIB.`}
        </p>

        {rows.length > 0 && (
          <dl className="mb-6 grid grid-cols-3 gap-px overflow-hidden rounded-card border border-panel-line bg-panel-line">
            <Stat label="Ujian dikerjakan" value={String(summary.finished)} />
            <Stat label="Lulus" value={String(passedCount)} />
            <Stat label="Rata-rata skor" value={summary.avgScore === null ? "-" : String(summary.avgScore)} />
          </dl>
        )}

        <div className="space-y-3">
          {rows.length === 0 && (
            <div className="card p-6">
              <p className="font-medium text-ink">Belum ada riwayat.</p>
              <p className="mt-1 text-sm text-ink-mute">
                Hasil ujian yang Anda kerjakan akan tersimpan di sini.{" "}
                <Link href="/peserta/exams" className="link">
                  Lihat ujian tersedia
                </Link>
                .
              </p>
            </div>
          )}

          {rows.map((r) => {
            const status = STATUS[r.status] ?? { label: r.status, className: "badge-neutral" };
            const end = r.work.ms === null ? null : new Date(r.startedAt.getTime() + r.work.ms);
            const done = r.status !== "IN_PROGRESS";
            return (
              <article
                key={r.id}
                className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <h2 className="section-title">{r.exam.title}</h2>
                    <span className={`badge whitespace-nowrap ${status.className}`}>{status.label}</span>
                  </div>
                  <p className="tnum mt-2 text-sm text-ink-soft">
                    {formatDate(r.startedAt)}, {formatClock(r.startedAt)}
                    {end ? ` - ${formatClock(end)}` : ""}
                  </p>
                  <p className="tnum mt-1 flex flex-wrap gap-x-5 text-xs text-ink-mute">
                    {r.work.ms !== null && (
                      <span>
                        Durasi {formatDuration(r.work.ms)}
                        {r.work.timedOut ? " (waktu habis)" : ""}
                      </span>
                    )}
                    <span>Batas {r.exam.durationMin} menit</span>
                    {r._count.violations > 0 && <span className="text-warn">{r._count.violations} pelanggaran</span>}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-5">
                  {done && r.score !== null && (
                    <div className="text-right">
                      <p className="tnum font-display text-3xl font-semibold leading-none text-ink">{r.score}</p>
                      <p
                        className={`mt-1 text-xs ${
                          r.passed === null ? "text-ink-mute" : r.passed ? "text-ok" : "text-alarm"
                        }`}
                      >
                        {r.passed === null ? "-" : r.passed ? "Lulus" : "Belum lulus"}
                      </p>
                    </div>
                  )}
                  {done ? (
                    <Link href={`/peserta/attempts/${r.id}/result`} className="btn btn-secondary whitespace-nowrap">
                      Lihat hasil
                    </Link>
                  ) : (
                    <Link href={`/peserta/exams/${r.examId}/attempt`} className="btn btn-primary whitespace-nowrap">
                      Lanjutkan
                    </Link>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </main>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-panel-raised p-4">
      <dt className="text-xs text-ink-mute">{label}</dt>
      <dd className="tnum mt-1 font-display text-3xl font-semibold leading-none text-ink">{value}</dd>
    </div>
  );
}
