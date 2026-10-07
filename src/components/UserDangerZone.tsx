"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  id: string;
  name: string;
  isActive: boolean;
  isSelf: boolean;
  attemptCount: number;
};

// Nonaktifkan = akun tidak bisa login tapi riwayat ujian tetap. Hapus hanya untuk
// user tanpa riwayat ujian (salah input / akun percobaan).
export function UserDangerZone({ id, name, isActive, isSelf, attemptCount }: Props) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function toggleActive() {
    const verb = isActive ? "menonaktifkan" : "mengaktifkan kembali";
    if (!confirm(`Yakin ${verb} akun ${name}?`)) return;
    setLoading(true);
    setError("");
    const res = await fetch(`/api/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Gagal mengubah status akun");
      return;
    }
    router.refresh();
  }

  async function remove() {
    if (!confirm(`Hapus permanen akun ${name}? Tindakan ini tidak bisa dibatalkan.`)) return;
    setLoading(true);
    setError("");
    const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Gagal menghapus user");
      return;
    }
    router.push("/admin/users");
    router.refresh();
  }

  return (
    <div className="mt-6 bg-white rounded-xl border border-slate-200 p-6">
      <h2 className="text-sm font-semibold text-slate-900 mb-3">Status Akun</h2>
      <p className="text-sm text-slate-500 mb-4">
        Status saat ini:{" "}
        <span className={isActive ? "text-green-700 font-medium" : "text-red-700 font-medium"}>
          {isActive ? "Aktif" : "Nonaktif (tidak bisa login)"}
        </span>
        . Sesi login yang sudah berjalan berakhir otomatis maksimal 12 jam.
      </p>

      {isSelf ? (
        <p className="text-xs text-slate-400">Akun Anda sendiri tidak bisa dinonaktifkan atau dihapus.</p>
      ) : (
        <div className="flex flex-wrap gap-3">
          <button
            onClick={toggleActive}
            disabled={loading}
            className="text-sm border border-slate-300 rounded-lg px-4 py-2 hover:bg-slate-50 disabled:opacity-50"
          >
            {isActive ? "Nonaktifkan akun" : "Aktifkan kembali"}
          </button>
          <button
            onClick={remove}
            disabled={loading || attemptCount > 0}
            title={attemptCount > 0 ? "Sudah punya riwayat ujian - nonaktifkan saja" : undefined}
            className="text-sm text-red-700 border border-red-200 rounded-lg px-4 py-2 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Hapus permanen
          </button>
        </div>
      )}
      {!isSelf && attemptCount > 0 && (
        <p className="text-xs text-slate-400 mt-3">
          Punya {attemptCount} riwayat ujian, jadi hanya bisa dinonaktifkan.
        </p>
      )}
      {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
    </div>
  );
}
