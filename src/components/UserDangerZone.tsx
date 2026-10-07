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
    <div className="mt-6 bg-panel-raised rounded-card border border-panel-line p-6">
      <h2 className="text-sm font-semibold text-ink mb-3">Status Akun</h2>
      <p className="text-sm text-ink-mute mb-4">
        Status saat ini:{" "}
        <span className={isActive ? "text-ok font-medium" : "text-alarm font-medium"}>
          {isActive ? "Aktif" : "Nonaktif (tidak bisa login)"}
        </span>
        . Sesi login yang sudah berjalan berakhir otomatis maksimal 12 jam.
      </p>

      {isSelf ? (
        <p className="text-xs text-ink-mute">Akun Anda sendiri tidak bisa dinonaktifkan atau dihapus.</p>
      ) : (
        <div className="flex flex-wrap gap-3">
          <button
            onClick={toggleActive}
            disabled={loading}
            className="text-sm border border-panel-strong rounded-ctl px-4 py-2 hover:bg-panel-high disabled:opacity-50"
          >
            {isActive ? "Nonaktifkan akun" : "Aktifkan kembali"}
          </button>
          <button
            onClick={remove}
            disabled={loading || attemptCount > 0}
            title={attemptCount > 0 ? "Sudah punya riwayat ujian - nonaktifkan saja" : undefined}
            className="btn btn-danger"
          >
            Hapus permanen
          </button>
        </div>
      )}
      {!isSelf && attemptCount > 0 && (
        <p className="text-xs text-ink-mute mt-3">
          Punya {attemptCount} riwayat ujian, jadi hanya bisa dinonaktifkan.
        </p>
      )}
      {error && <p className="text-sm text-alarm mt-3">{error}</p>}
    </div>
  );
}
