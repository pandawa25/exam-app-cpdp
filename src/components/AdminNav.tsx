"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Brand } from "@/components/Brand";
import { AccountLinks } from "@/components/AccountLinks";

// Ikon outline 20px, dekoratif (label teks tetap ada).
const ICONS: Record<string, string> = {
  bank: "M4 6c0-1.1 3.6-2 8-2s8 .9 8 2-3.6 2-8 2-8-.9-8-2Zm0 0v6c0 1.1 3.6 2 8 2s8-.9 8-2V6M4 12v6c0 1.1 3.6 2 8 2s8-.9 8-2v-6",
  exam: "M9 4h6a1 1 0 0 1 1 1v1H8V5a1 1 0 0 1 1-1ZM8 6H6a1 1 0 0 0-1 1v13a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1h-2M9 13l2 2 4-4",
  result: "M5 20V10m5 10V4m5 16v-7m5 7H3",
  user: "M16 19v-1a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v1m12-9a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-6 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm12 9v-1a4 4 0 0 0-3-3.9",
};

const ITEMS = [
  { href: "/admin/question-banks", label: "Bank Soal", icon: "bank" },
  { href: "/admin/exams", label: "Ujian", icon: "exam" },
  { href: "/admin/results", label: "Hasil Ujian", icon: "result" },
  { href: "/admin/users", label: "User", icon: "user" },
];

function NavIcon({ name }: { name: string }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0">
      <path d={ICONS[name]} />
    </svg>
  );
}

// Sidebar di layar lebar, bar atas + menu geser di layar sempit.
export function AdminNav({ name, email }: { name: string; email: string }) {
  const pathname = usePathname();

  return (
    <aside className="border-b border-panel-line bg-panel-raised/90 backdrop-blur md:sticky md:top-0 md:flex md:h-screen md:w-60 md:shrink-0 md:flex-col md:border-b-0 md:border-r">
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
              className={`relative flex items-center gap-2.5 whitespace-nowrap rounded-ctl px-3 py-2.5 text-sm font-medium transition duration-150 ${
                active
                  ? "bg-brand-dim text-brand md:before:absolute md:before:-left-3 md:before:top-2 md:before:h-[calc(100%-1rem)] md:before:w-1 md:before:rounded-r md:before:bg-brand"
                  : "text-ink-soft hover:bg-panel-high hover:text-ink"
              }`}
            >
              <NavIcon name={item.icon} />
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
