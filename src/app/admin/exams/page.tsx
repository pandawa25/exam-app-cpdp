import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { disciplineLabel, positionLabel } from "@/lib/constants";
import { ExamStatusActions } from "@/components/ExamStatusActions";
import { DeleteButton } from "@/components/DeleteButton";

export const dynamic = "force-dynamic";

const statusBadge: Record<string, { label: string; className: string }> = {
  DRAFT: { label: "Draft", className: "badge-neutral" },
  PUBLISHED: { label: "Published", className: "badge-info" },
  CLOSED: { label: "Ditutup", className: "badge-neutral" },
};

export default async function AdminExamsPage() {
  const exams = await prisma.exam.findMany({
    include: { questionBank: true, _count: { select: { attempts: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="page-title">Exam</h1>
        <Link
          href="/admin/exams/new"
          className="btn btn-primary"
        >
          Exam baru
        </Link>
      </div>

      <div className="bg-panel-raised rounded-card border border-panel-line divide-y divide-panel-line">
        {exams.length === 0 && <p className="p-6 text-sm text-ink-mute">Belum ada exam.</p>}
        {exams.map((exam) => (
          <div key={exam.id} className="flex items-center justify-between gap-4 px-6 py-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <p className="font-medium text-ink">{exam.title}</p>
                <span className={`badge ${statusBadge[exam.status].className}`}>{statusBadge[exam.status].label}</span>
              </div>
              <p className="tnum mt-1 flex flex-wrap gap-x-4 text-sm text-ink-soft">
                <span>
                  {disciplineLabel(exam.discipline)}, {positionLabel(exam.position)}
                </span>
                <span>{exam.questionCount} soal</span>
                <span>{exam.durationMin} menit</span>
                <span>{exam._count.attempts} peserta</span>
              </p>
              <p className="mt-0.5 text-xs text-ink-mute">
                Buka {exam.opensAt.toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })}, tutup{" "}
                {exam.closesAt.toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })} WIB
              </p>
            </div>
            <div className="flex shrink-0 items-start gap-5">
              <ExamStatusActions examId={exam.id} status={exam.status} />
              <DeleteButton
                url={`/api/exams/${exam.id}${exam._count.attempts > 0 ? "?force=1" : ""}`}
                confirmText={
                  exam._count.attempts > 0
                    ? `Hapus exam "${exam.title}" BESERTA ${exam._count.attempts} hasil ujian peserta? Tidak bisa dibatalkan.`
                    : `Hapus exam "${exam.title}"? Tidak bisa dibatalkan.`
                }
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
