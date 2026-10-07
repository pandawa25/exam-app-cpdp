import Link from "next/link";

const TABS = [
  { key: "exams", href: "/peserta/exams", label: "Ujian tersedia" },
  { key: "history", href: "/peserta/history", label: "Riwayat ujian" },
] as const;

export function PesertaTabs({ current }: { current: (typeof TABS)[number]["key"] }) {
  return (
    <nav aria-label="Bagian peserta" className="mb-7 inline-flex gap-1 rounded-full border border-panel-line bg-panel-raised p-1">
      {TABS.map((t) => {
        const active = t.key === current;
        return (
          <Link
            key={t.key}
            href={t.href}
            aria-current={active ? "page" : undefined}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition duration-150 ${
              active ? "bg-brand text-brand-on shadow-sm" : "text-ink-soft hover:bg-panel-high hover:text-ink"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
