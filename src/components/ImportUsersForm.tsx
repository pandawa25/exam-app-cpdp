"use client";

import { useState } from "react";
import Link from "next/link";

const EXAMPLE = `nama,email,role,disiplin,jabatan,departemen,password
Andi Pratama,andi@perusahaan.com,PESERTA,Instrumentasi,Sr. Technician I,Maintenance,
Citra Lestari,citra@perusahaan.com,PESERTA,Electrical,Jr. Technician II,Maintenance,
Budi Santoso,budi@perusahaan.com,SUPERVISOR,,,Operasi,`;

type RowError = { row: number; email?: string; error: string };
type CreatedUser = { name: string; email: string; role: string; temporaryPassword?: string };

export function ImportUsersForm() {
  const [csv, setCsv] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rowErrors, setRowErrors] = useState<RowError[]>([]);
  const [result, setResult] = useState<CreatedUser[] | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsv(await file.text());
    e.target.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setRowErrors([]);
    setResult(null);

    const res = await fetch("/api/users/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ csv }),
    });
    const json = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setError(json.error ?? "Import gagal");
      setRowErrors(json.errors ?? []);
      return;
    }
    setResult(json.users);
  }

  const generated = (result ?? []).filter((u) => u.temporaryPassword);
  const credentialsCsv = [
    "nama,email,password",
    ...generated.map((u) => `"${u.name.replace(/"/g, '""')}",${u.email},${u.temporaryPassword}`),
  ].join("\n");

  async function copyCredentials() {
    try {
      await navigator.clipboard.writeText(credentialsCsv);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Gagal menyalin otomatis. Gunakan tombol Unduh CSV.");
    }
  }

  function downloadCredentials() {
    const blob = new Blob([credentialsCsv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "password-sementara.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  if (result) {
    return (
      <div className="bg-panel-raised rounded-card border border-panel-line p-6 space-y-4">
        <p className="text-sm font-medium text-ok">{result.length} user berhasil dibuat.</p>

        {generated.length > 0 && (
          <>
            <div className="rounded-ctl bg-warn-dim border border-warn/40 p-4 text-sm text-warn">
              Password sementara di bawah ini hanya ditampilkan sekali. Unduh atau salin sekarang, lalu
              bagikan ke masing-masing user dan minta mereka menggantinya lewat menu Ganti Password.
            </div>
            <div className="flex gap-3">
              <button
                onClick={downloadCredentials}
                className="btn btn-primary"
              >
                Unduh CSV
              </button>
              <button
                onClick={copyCredentials}
                className="btn btn-secondary"
              >
                {copied ? "Tersalin" : "Salin"}
              </button>
            </div>
          </>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-ink-mute border-b border-panel-line">
                <th className="py-2 pr-4 font-medium">Nama</th>
                <th className="py-2 pr-4 font-medium">Email</th>
                <th className="py-2 font-medium">Password</th>
              </tr>
            </thead>
            <tbody>
              {result.map((u) => (
                <tr key={u.email} className="border-b border-panel-line">
                  <td className="py-2 pr-4">{u.name}</td>
                  <td className="py-2 pr-4">{u.email}</td>
                  <td className="py-2 font-mono">
                    {u.temporaryPassword ?? <span className="text-ink-mute font-sans">diisi admin</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Link href="/admin/users" className="inline-block text-sm text-ink-soft hover:underline">
          Ke daftar user
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-panel-raised rounded-card border border-panel-line p-6">
      <div className="text-sm text-ink-soft space-y-2">
        <p>
          Kolom wajib: <b>nama, email, role</b>. Untuk role PESERTA wajib juga <b>disiplin</b> dan{" "}
          <b>jabatan</b>. Kolom <b>departemen</b> dan <b>password</b> opsional; password kosong akan dibuatkan
          otomatis.
        </p>
        <p className="text-xs text-ink-mute">
          Delimiter koma, titik koma, atau tab (hasil copy dari Excel) dikenali otomatis. Nilai disiplin:
          Instrumentasi, Electrical, Stationary, Rotating, Civil. Jabatan: Jr. Technician I, Jr. Technician II,
          Technician I, Technician II, Sr. Technician I. Maksimal 300 baris. Jika ada satu baris bermasalah, tidak ada user yang dibuat.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input type="file" accept=".csv,.txt,text/csv" onChange={handleFile}
          className="text-sm text-ink-soft file:mr-3 file:cursor-pointer file:rounded-ctl file:border file:border-panel-strong file:bg-transparent file:px-3 file:py-1.5 file:text-sm file:text-ink hover:file:bg-panel-high"
        />
        <button
          type="button"
          onClick={() => setCsv(EXAMPLE)}
          className="link text-sm"
        >
          Isi contoh format
        </button>
      </div>

      <textarea
        value={csv}
        onChange={(e) => setCsv(e.target.value)}
        rows={12}
        spellCheck={false}
        placeholder="Tempel isi CSV di sini, atau pilih file di atas"
        className="input text-xs font-mono"
      />

      {error && <p className="text-sm text-alarm">{error}</p>}
      {rowErrors.length > 0 && (
        <ul className="text-sm text-alarm bg-alarm-dim border border-alarm/40 rounded-ctl p-3 space-y-1 max-h-64 overflow-y-auto">
          {rowErrors.map((r, i) => (
            <li key={i}>
              Baris {r.row}
              {r.email ? ` (${r.email})` : ""}: {r.error}
            </li>
          ))}
        </ul>
      )}

      <button
        type="submit"
        disabled={loading || !csv.trim()}
        className="btn btn-primary"
      >
        {loading ? "Mengimpor..." : "Import User"}
      </button>
    </form>
  );
}
