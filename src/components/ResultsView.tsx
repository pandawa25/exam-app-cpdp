import Link from "next/link";
import { DISCIPLINES, jobTitle } from "@/lib/constants";
import { ATTEMPT_STATUSES, RESULTS_LIMIT, type ResultFilters, type ResultRow } from "@/lib/results";
import { formatClock, formatDate, formatDuration, summarize } from "@/lib/result-stats";

// Dipakai bersama oleh /admin/results dan /supervisor/results (tampilan sama, hanya baca).
// Server component: filter lewat form GET, tanpa state di client.

const STATUS: Record<string, { label: string; className: string }> = {
  IN_PROGRESS: { label: "Sedang berjalan", className: "badge-warn" },
  SUBMITTED: { label: "Selesai", className: "badge-info" },
  AUTO_SUBMITTED: { label: "Dihentikan otomatis", className: "badge-alarm" },
  REVIEWED: { label: "Sudah direview", className: "badge-ok" },
};

export function ResultsView({
  basePath,
  filters,
  rows,
  total,
  exams,
  truncated,
}: {
  basePath: string;
  filters: ResultFilters;
  rows: ResultRow[];
  total: number;
  exams: { id: string; title: string }[];
  truncated: boolean;
}) {
  const summary = summarize(rows.map((r) => ({ ...r, workMs: r.work.ms })));
  const filtered = !!(filters.examId || filters.discipline || filters.status || filters.q);

  return (
    <div>
      <h1 className="page-title">Hasil ujian</h1>
      <p className="mb-6 mt-1 text-sm text-ink-mute">
        {total === 0
          ? filtered
            ? "Tidak ada hasil yang cocok dengan filter."
            : "Belum ada peserta yang mengerjakan ujian."
          : `${total} hasil${filtered ? " sesuai filter" : ""}, terbaru di atas. Waktu dalam WIB.`}
      </p>

      <dl className="mb-6 grid grid-cols-2 gap-px overflow-hidden rounded-card border border-panel-line bg-panel-line sm:grid-cols-4">
        <Stat label="Peserta mengerjakan" value={String(summary.total)} note={summary.finished < summary.total ? `${summary.total - summary.finished} masih berjalan` : "semuanya selesai"} />
        <Stat label="Rata-rata skor" value={summary.avgScore === null ? "-" : String(summary.avgScore)} />
        <Stat label="Tingkat kelulusan" value={summary.passRate === null ? "-" : `${summary.passRate}%`} />
        <Stat label="Rata-rata durasi" value={summary.avgWorkMs === null ? "-" : formatDuration(summary.avgWorkMs)} />
      </dl>

      <form method="get" action={basePath} className="mb-4 flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="f-exam" className="label">
            Exam
          </label>
          <select id="f-exam" name="exam" defaultValue={filters.examId ?? ""} className="input w-auto max-w-[16rem]">
            <option value="">Semua exam</option>
            {exams.map((e) => (
              <option key={e.id} value={e.id}>
                {e.title}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="f-discipline" className="label">
            Disiplin
          </label>
          <select id="f-discipline" name="discipline" defaultValue={filters.discipline ?? ""} className="input w-auto">
            <option value="">Semua disiplin</option>
            {DISCIPLINES.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="f-status" className="label">
            Status
          </label>
          <select id="f-status" name="status" defaultValue={filters.status ?? ""} className="input w-auto">
            <option value="">Semua status</option>
            {ATTEMPT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS[s].label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="f-q" className="label">
            Cari peserta
          </label>
          <input
            id="f-q"
            name="q"
            defaultValue={filters.q}
            placeholder="Nama, email, atau departemen"
            className="input w-64 max-w-full"
          />
        </div>
        <button type="submit" className="btn btn-secondary whitespace-nowrap">
          Terapkan
        </button>
        {filtered && (
          <Link href={basePath} className="link py-2 text-sm">
            Hapus filter
          </Link>
        )}
      </form>

      {truncated && (
        <p className="notice notice-warn mb-4">
          Menampilkan {RESULTS_LIMIT} dari {total} hasil terbaru, dan ringkasan di atas dihitung dari yang ditampilkan.
          Persempit dengan filter untuk melihat sisanya.
        </p>
      )}

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[60rem] text-sm">
          <caption className="sr-only">Hasil ujian per peserta</caption>
          <thead>
            <tr className="border-b border-panel-line text-left text-ink-mute">
              <th scope="col" className="min-w-[13rem] px-4 py-3 font-medium">Peserta</th>
              <th scope="col" className="min-w-[12rem] px-4 py-3 font-medium">Jabatan</th>
              <th scope="col" className="min-w-[10rem] px-4 py-3 font-medium">Exam</th>
              <th scope="col" className="min-w-[13rem] px-4 py-3 font-medium">Waktu pengerjaan</th>
              <th scope="col" className="px-4 py-3 text-right font-medium">Skor</th>
              <th scope="col" className="whitespace-nowrap px-4 py-3 text-right font-medium">Pelanggaran</th>
              <th scope="col" className="whitespace-nowrap px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-panel-line">
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-ink-mute">
                  {filtered ? "Tidak ada hasil yang cocok. Coba hapus filter." : "Belum ada hasil ujian."}
                </td>
              </tr>
            )}
            {rows.map((r) => {
              const end = r.work.ms === null ? null : new Date(r.startedAt.getTime() + r.work.ms);
              const status = STATUS[r.status] ?? { label: r.status, className: "badge-neutral" };
              return (
                <tr key={r.id} className="align-top">
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink">{r.name}</p>
                    <p className="text-xs text-ink-mute">{r.email}</p>
                  </td>
                  <td className="px-4 py-3 text-ink-soft">
                    <p>{jobTitle(r.discipline, r.position)}</p>
                    {r.department && <p className="text-xs text-ink-mute">{r.department}</p>}
                  </td>
                  <td className="px-4 py-3 text-ink-soft">
                    <p className="max-w-[14rem]">{r.examTitle}</p>
                  </td>
                  <td className="tnum px-4 py-3">
                    {r.work.ms === null ? (
                      <p className="text-ink-mute">Belum selesai</p>
                    ) : (
                      <p className="font-medium text-ink">
                        {formatDuration(r.work.ms)}
                        {r.work.timedOut && <span className="ml-2 whitespace-nowrap text-xs font-normal text-warn">waktu habis</span>}
                      </p>
                    )}
                    <p className="text-xs text-ink-mute">
                      {formatDate(r.startedAt)}, {formatClock(r.startedAt)}
                      {end ? ` - ${formatClock(end)}` : " - ..."}
                    </p>
                    <p className="text-xs text-ink-mute">batas {r.limitMin} menit</p>
                  </td>
                  <td className="tnum px-4 py-3 text-right">
                    {r.score === null ? (
                      <span className="text-ink-mute">-</span>
                    ) : (
                      <>
                        <p className="font-display text-xl font-semibold leading-none text-ink">{r.score}</p>
                        <p className={`mt-1 text-xs ${r.passed ? "text-ok" : "text-alarm"}`}>
                          {r.passed ? "Lulus" : "Belum lulus"}
                        </p>
                      </>
                    )}
                  </td>
                  <td className="tnum px-4 py-3 text-right">
                    {r.violationCount > 0 ? (
                      <span className="badge badge-warn">{r.violationCount}</span>
                    ) : (
                      <span className="text-ink-mute">0</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge whitespace-nowrap ${status.className}`}>{status.label}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-ink-mute">
        Waktu pengerjaan dihitung dari saat peserta membuka ujian sampai selesai, dan tidak melebihi batas waktu exam.
        Server tidak mencatat waktu per soal.
      </p>
    </div>
  );
}

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="bg-panel-raised p-4">
      <dt className="text-xs text-ink-mute">{label}</dt>
      <dd className="tnum mt-1 font-display text-3xl font-semibold leading-none text-ink">{value}</dd>
      {note && <p className="mt-1.5 text-xs text-ink-mute">{note}</p>}
    </div>
  );
}
