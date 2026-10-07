import Link from "next/link";

const TABS = [
  { key: "review", href: "/supervisor/review", label: "Perlu review" },
  { key: "results", href: "/supervisor/results", label: "Semua hasil" },
] as const;

export function SupervisorTabs({ current }: { current: (typeof TABS)[number]["key"] }) {
  return (
    <nav aria-label="Bagian supervisor" className="mb-7 flex gap-1 border-b border-panel-line">
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
