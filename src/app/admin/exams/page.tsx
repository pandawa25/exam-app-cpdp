import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { DISCIPLINES, POSITIONS, disciplineLabel, positionLabel } from "@/lib/constants";
import { ExamStatusActions } from "@/components/ExamStatusActions";
import { DeleteButton } from "@/components/DeleteButton";

export const dynamic = "force-dynamic";

const statusBadge: Record<string, { label: string; className: string }> = {
  DRAFT: { label: "Draf", className: "badge-neutral" },
  PUBLISHED: { label: "Terbit", className: "badge-info" },
  CLOSED: { label: "Ditutup", className: "badge-neutral" },
};

const PAGE_SIZE = 20;
const STATUSES = ["DRAFT", "PUBLISHED", "CLOSED"] as const;
const pick = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function AdminExamsPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const discipline = DISCIPLINES.find((d) => d.value === pick(searchParams.discipline))?.value;
  const position = POSITIONS.find((p) => p.value === pick(searchParams.position))?.value;
  const status = STATUSES.find((v) => v === pick(searchParams.status));
  const q = pick(searchParams.q).trim().slice(0, 80);
  const filtered = !!(discipline || position || status || q);

  const where = {
    discipline,
    position,
    status,
    title: q ? { contains: q, mode: "insensitive" as const } : undefined,
  };
  const total = await prisma.exam.count({ where });
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(pages, Math.max(1, parseInt(pick(searchParams.page), 10) || 1));

  const exams = await prisma.exam.findMany({
    where,
    include: { questionBank: true, _count: { select: { attempts: true } } },
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  });

  // Tautan halaman mempertahankan filter yang aktif.
  const pageHref = (n: number) => {
    const params = new URLSearchParams();
    if (discipline) params.set("discipline", discipline);
    if (position) params.set("position", position);
    if (status) params.set("status", status);
    if (q) params.set("q", q);
    if (n > 1) params.set("page", String(n));
    const qs = params.toString();
    return qs ? `/admin/exams?${qs}` : "/admin/exams";
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Ujian</h1>
          <p className="mt-1 text-sm text-ink-mute">
            {total} ujian{filtered ? " sesuai filter" : ""}.
          </p>
        </div>
        <Link href="/admin/exams/new" className="btn btn-primary shrink-0">
          Ujian baru
        </Link>
      </div>

      <form method="get" className="mb-6 flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="f-discipline" className="label">
            Disiplin
          </label>
          <select id="f-discipline" name="discipline" defaultValue={discipline ?? ""} className="input w-auto">
            <option value="">Semua disiplin</option>
            {DISCIPLINES.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="f-position" className="label">
            Jenjang
          </label>
          <select id="f-position" name="position" defaultValue={position ?? ""} className="input w-auto">
            <option value="">Semua jenjang</option>
            {POSITIONS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="f-status" className="label">
            Status
          </label>
          <select id="f-status" name="status" defaultValue={status ?? ""} className="input w-auto">
            <option value="">Semua status</option>
            {STATUSES.map((v) => (
              <option key={v} value={v}>
                {statusBadge[v].label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="f-q" className="label">
            Cari judul
          </label>
          <input id="f-q" name="q" defaultValue={q} placeholder="Judul ujian" className="input w-56 max-w-full" />
        </div>
        <button type="submit" className="btn btn-secondary whitespace-nowrap">
          Terapkan
        </button>
        {filtered && (
          <Link href="/admin/exams" className="link py-2 text-sm">
            Hapus filter
          </Link>
        )}
      </form>

      <div className="card divide-y divide-panel-line">
        {exams.length === 0 && (
          <p className="p-6 text-sm text-ink-mute">
            {filtered ? "Tidak ada ujian yang cocok. Coba hapus filter." : "Belum ada ujian."}
          </p>
        )}
        {exams.map((exam) => (
          <div key={exam.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-6">
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
            <div className="flex shrink-0 items-center gap-5">
              <ExamStatusActions examId={exam.id} status={exam.status} />
              <DeleteButton
                url={`/api/exams/${exam.id}${exam._count.attempts > 0 ? "?force=1" : ""}`}
                confirmTitle="Hapus ujian?"
                confirmText={
                  exam._count.attempts > 0
                    ? `"${exam.title}" dan ${exam._count.attempts} hasil ujian peserta akan terhapus permanen, termasuk jawaban dan catatan pelanggarannya. Tidak bisa dibatalkan.`
                    : `"${exam.title}" akan terhapus permanen. Tidak bisa dibatalkan.`
                }
                requireText={exam._count.attempts > 0 ? "HAPUS" : undefined}
              />
            </div>
          </div>
        ))}
      </div>

      {pages > 1 && (
        <nav aria-label="Halaman" className="mt-4 flex items-center justify-between text-sm">
          {page > 1 ? (
            <Link href={pageHref(page - 1)} className="btn btn-secondary">
              &larr; Sebelumnya
            </Link>
          ) : (
            <span />
          )}
          <span className="tnum text-ink-mute">
            Halaman {page} dari {pages}
          </span>
          {page < pages ? (
            <Link href={pageHref(page + 1)} className="btn btn-secondary">
              Berikutnya &rarr;
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </div>
  );
}
