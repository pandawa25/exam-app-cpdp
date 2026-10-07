import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { DISCIPLINES, POSITIONS, disciplineLabel, positionLabel } from "@/lib/constants";

export const dynamic = "force-dynamic";

const pick = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

// Bank soal dikelompokkan per disiplin dan diurutkan per jenjang, supaya 25+ bank tetap mudah dicari.
export default async function QuestionBanksPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const discipline = DISCIPLINES.find((d) => d.value === pick(searchParams.discipline))?.value;
  const position = POSITIONS.find((p) => p.value === pick(searchParams.position))?.value;
  const q = pick(searchParams.q).trim().slice(0, 80);
  const filtered = !!(discipline || position || q);

  // Urutan enum Postgres mengikuti urutan deklarasi di schema (disiplin lalu jenjang naik).
  const banks = await prisma.questionBank.findMany({
    where: {
      discipline: discipline,
      position: position,
      name: q ? { contains: q, mode: "insensitive" } : undefined,
    },
    include: { _count: { select: { questions: true } } },
    orderBy: [{ discipline: "asc" }, { position: "asc" }, { name: "asc" }],
  });

  const groups = DISCIPLINES.map((d) => ({
    discipline: d,
    banks: banks.filter((b) => b.discipline === d.value),
  })).filter((g) => g.banks.length > 0);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Bank Soal</h1>
          <p className="mt-1 text-sm text-ink-mute">
            {banks.length} bank soal{filtered ? " sesuai filter" : ""}.
          </p>
        </div>
        <Link href="/admin/question-banks/new" className="btn btn-primary shrink-0">
          Bank soal baru
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
          <label htmlFor="f-q" className="label">
            Cari nama
          </label>
          <input id="f-q" name="q" defaultValue={q} placeholder="Nama bank soal" className="input w-56 max-w-full" />
        </div>
        <button type="submit" className="btn btn-secondary whitespace-nowrap">
          Terapkan
        </button>
        {filtered && (
          <Link href="/admin/question-banks" className="link py-2 text-sm">
            Hapus filter
          </Link>
        )}
      </form>

      {banks.length === 0 && (
        <div className="card p-6">
          <p className="text-sm text-ink-mute">
            {filtered ? "Tidak ada bank soal yang cocok. Coba hapus filter." : "Belum ada bank soal. Buat satu per disiplin dan jenjang."}
          </p>
        </div>
      )}

      <div className="space-y-6">
        {groups.map((g) => (
          <section key={g.discipline.value} aria-labelledby={`grp-${g.discipline.value}`}>
            <h2
              id={`grp-${g.discipline.value}`}
              className="mb-2 flex items-baseline gap-3 font-display text-lg font-semibold text-ink"
            >
              {g.discipline.label}
              <span className="text-sm font-normal text-ink-mute">{g.banks.length} bank</span>
            </h2>
            <div className="card divide-y divide-panel-line">
              {g.banks.map((bank) => (
                <Link
                  key={bank.id}
                  href={`/admin/question-banks/${bank.id}`}
                  className="flex min-h-11 items-center justify-between gap-4 px-5 py-3 hover:bg-panel-high"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-ink">{bank.name}</p>
                    <p className="text-sm text-ink-mute">{positionLabel(bank.position)}</p>
                  </div>
                  <span className="tnum shrink-0 text-sm text-ink-mute">{bank._count.questions} soal</span>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
