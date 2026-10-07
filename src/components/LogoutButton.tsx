"use client";

import { signOut } from "next-auth/react";

export function LogoutButton({ className }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/login" })}
      className={className ?? "text-sm text-slate-500 hover:text-slate-800"}
    >
      Keluar
    </button>
  );
}
