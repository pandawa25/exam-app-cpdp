import Link from "next/link";

const TABS = [
  { key: "exams", href: "/peserta/exams", label: "Exam tersedia" },
  { key: "history", href: "/peserta/history", label: "Riwayat ujian" },
] as const;

export function PesertaTabs({ current }: { current: (typeof TABS)[number]["key"] }) {
  return (
    <nav aria-label="Bagian peserta" className="mb-7 flex gap-1 border-b border-panel-line">
      {TABS.map((t) => {
        const active = t.key === current;
        return (
          <Link
            key={t.key}
            href={t.href}
            aria-current={active ? "page" : undefined}
            className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
              active ? "border-brand text-brand" : "border-transparent text-ink-soft hover:text-ink"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
