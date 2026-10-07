"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useConfirm } from "@/components/ConfirmDialog";

type Props = {
  url: string;
  label?: string;
  /** Judul dan isi dialog konfirmasi. */
  confirmTitle: string;
  confirmText: string;
  /** Kalau diisi, pengguna harus mengetik teks ini persis (untuk hapus yang ikut menghapus hasil ujian). */
  requireText?: string;
  /** Pindah ke halaman ini setelah berhasil (default: refresh halaman sekarang). */
  redirectTo?: string;
  disabled?: boolean;
  disabledReason?: string;
};

// Tombol hapus permanen generik untuk admin: konfirmasi dulu, tampilkan error dari API apa adanya.
export function DeleteButton({
  url,
  label = "Hapus",
  confirmTitle,
  confirmText,
  requireText,
  redirectTo,
  disabled,
  disabledReason,
}: Props) {
  const router = useRouter();
  const { confirm, dialog } = useConfirm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function remove() {
    const ok = await confirm({
      title: confirmTitle,
      message: confirmText,
      confirmLabel: "Hapus permanen",
      tone: "danger",
      requireText,
    });
    if (!ok) return;
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
        className="action text-alarm hover:underline disabled:cursor-not-allowed disabled:opacity-40 disabled:no-underline"
      >
        {loading ? "Menghapus..." : label}
      </button>
      {error && <span className="max-w-xs text-right text-xs text-alarm">{error}</span>}
      {dialog}
    </span>
  );
}
