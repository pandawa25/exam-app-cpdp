"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Brand } from "@/components/Brand";
import { AccountLinks } from "@/components/AccountLinks";

const ITEMS = [
  { href: "/admin/question-banks", label: "Bank Soal" },
  { href: "/admin/exams", label: "Exam" },
  { href: "/admin/results", label: "Hasil Ujian" },
  { href: "/admin/users", label: "User" },
];

// Sidebar di layar lebar, bar atas + menu geser di layar sempit.
export function AdminNav({ name, email }: { name: string; email: string }) {
  const pathname = usePathname();

  return (
    <aside className="border-b border-panel-line bg-panel-raised md:sticky md:top-0 md:flex md:h-screen md:w-60 md:shrink-0 md:flex-col md:border-b-0 md:border-r">
      <div className="flex items-center justify-between gap-4 px-4 py-3 md:px-5 md:py-6">
        <Link href="/admin/exams" aria-label="Beranda admin">
          <Brand size={32} />
        </Link>
        <AccountLinks className="flex items-center gap-4 text-sm md:hidden" />
      </div>

      <nav
        aria-label="Menu admin"
        className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-1 md:flex-col md:overflow-visible md:pb-0"
      >
        {ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`whitespace-nowrap rounded-ctl px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-brand-dim text-brand"
                  : "text-ink-soft hover:bg-panel-high hover:text-ink"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="hidden border-t border-panel-line p-5 md:block">
        <p className="truncate text-sm font-medium text-ink">{name}</p>
        <p className="mb-3 truncate text-xs text-ink-mute">{email}</p>
        <AccountLinks className="flex flex-col items-start gap-2 text-sm" />
      </div>
    </aside>
  );
}
