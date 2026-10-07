"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  url: string;
  label?: string;
  /** Teks konfirmasi sebelum hapus. */
  confirmText: string;
  /** Pindah ke halaman ini setelah berhasil (default: refresh halaman sekarang). */
  redirectTo?: string;
  disabled?: boolean;
  disabledReason?: string;
};

// Tombol hapus permanen generik untuk admin: konfirmasi dulu, tampilkan error dari API apa adanya.
export function DeleteButton({ url, label = "Hapus", confirmText, redirectTo, disabled, disabledReason }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function remove() {
    if (!confirm(confirmText)) return;
    setLoading(true);
    setError("");
    const res = await fetch(url, { method: "DELETE" });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Gagal menghapus");
      return;
    }
    if (redirectTo) router.push(redirectTo);
    router.refresh();
  }

  return (
    <span className="inline-flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={remove}
        disabled={loading || disabled}
        title={disabled ? disabledReason : undefined}
        className="text-sm font-medium text-alarm hover:underline disabled:cursor-not-allowed disabled:opacity-40 disabled:no-underline"
      >
        {loading ? "Menghapus..." : label}
      </button>
      {error && <span className="max-w-xs text-right text-xs text-alarm">{error}</span>}
    </span>
  );
}
