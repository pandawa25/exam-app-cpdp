import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { disciplineLabel, positionLabel } from "@/lib/constants";
import { AppHeader } from "@/components/AppHeader";
import { visibleExamsWhere } from "@/lib/examAccess";
import { PesertaTabs } from "@/components/PesertaTabs";

export const dynamic = "force-dynamic";

// Server jalan di UTC (Railway); paksa tampilan jam ke WIB supaya tidak bergeser 7 jam.
const WIB = "Asia/Jakarta";

const attemptBadge: Record<string, { label: string; className: string }> = {
  IN_PROGRESS: { label: "Sedang berjalan", className: "badge-warn" },
  SUBMITTED: { label: "Selesai", className: "badge-info" },
  AUTO_SUBMITTED: { label: "Dihentikan otomatis", className: "badge-alarm" },
  REVIEWED: { label: "Sudah direview", className: "badge-ok" },
};

// Daftar exam yang muncul SUDAH difilter sesuai disiplin & jabatan peserta
// (query di dalam fungsi ini, sama logic-nya dengan GET /api/exams tapi
// langsung lewat Prisma karena ini server component).
export default async function PesertaExamsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const now = new Date();
  const where = visibleExamsWhere(session.user, now);
  const exams = where
    ? await prisma.exam.findMany({
        where,
        include: { attempts: { where: { userId: session.user.id } } },
        orderBy: { opensAt: "asc" },
      })
    : [];

  const profile =
    session.user.discipline && session.user.position
      ? `${disciplineLabel(session.user.discipline)}, ${positionLabel(session.user.position)}`
      : null;

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <PesertaTabs current="exams" />
        <h1 className="page-title">Ujian tersedia</h1>
        <p className="mb-7 mt-1 text-sm text-ink-mute">
          {profile ? `Ujian untuk ${profile}.` : "Ujian sesuai disiplin dan jabatan Anda."}
        </p>

        <div className="space-y-3">
          {exams.length === 0 && (
            <div className="card p-6">
              <p className="font-medium text-ink">Belum ada ujian yang terbuka untuk Anda.</p>
              <p className="mt-1 text-sm text-ink-mute">
                Ujian muncul di sini begitu admin mempublikasikannya untuk disiplin dan jabatan Anda.
              </p>
            </div>
          )}

          {exams.map((exam) => {
            const myAttempt = exam.attempts[0];
            const badge = myAttempt ? attemptBadge[myAttempt.status] : null;
            return (
              <article
                key={exam.id}
                className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <h2 className="section-title">{exam.title}</h2>
                    {badge && <span className={`badge ${badge.className}`}>{badge.label}</span>}
                  </div>
                  <p className="tnum mt-2 flex flex-wrap gap-x-5 text-sm text-ink-soft">
                    <span>{exam.questionCount} soal</span>
                    <span>{exam.durationMin} menit</span>
                    <span>Nilai lulus {exam.passingScore}</span>
                  </p>
                  <p className="mt-1 text-xs text-ink-mute">
                    Ditutup {exam.closesAt.toLocaleString("id-ID", { timeZone: WIB })} WIB
                  </p>
                </div>

                <div className="shrink-0">
                  {!myAttempt && (
                    <Link href={`/peserta/exams/${exam.id}/attempt`} className="btn btn-primary">
                      Mulai ujian
                    </Link>
                  )}
                  {myAttempt?.status === "IN_PROGRESS" && (
                    <Link href={`/peserta/exams/${exam.id}/attempt`} className="btn btn-primary">
                      Lanjutkan ujian
                    </Link>
                  )}
                  {myAttempt && myAttempt.status !== "IN_PROGRESS" && (
                    <Link href={`/peserta/attempts/${myAttempt.id}/result`} className="btn btn-secondary">
                      Lihat hasil
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
