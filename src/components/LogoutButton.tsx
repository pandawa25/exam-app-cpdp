"use client";

import { signOut } from "next-auth/react";

export function LogoutButton({ className }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/login" })}
      className={className ?? "text-sm text-ink-soft hover:text-ink"}
    >
      Keluar
    </button>
  );
}
