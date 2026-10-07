"use client";

import { useState } from "react";
import Link from "next/link";

const EXAMPLE = `nama,email,role,disiplin,jabatan,departemen,password
Andi Pratama,andi@perusahaan.com,PESERTA,Instrumentasi,Teknisi Senior,Maintenance,
Citra Lestari,citra@perusahaan.com,PESERTA,Electrical,Teknisi Junior,Maintenance,
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
      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
        <p className="text-sm font-medium text-green-700">{result.length} user berhasil dibuat.</p>

        {generated.length > 0 && (
          <>
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
              Password sementara di bawah ini hanya ditampilkan sekali. Unduh atau salin sekarang, lalu
              bagikan ke masing-masing user dan minta mereka menggantinya lewat menu Ganti Password.
            </div>
            <div className="flex gap-3">
              <button
                onClick={downloadCredentials}
                className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg px-4 py-2"
              >
                Unduh CSV
              </button>
              <button
                onClick={copyCredentials}
                className="text-sm border border-slate-300 rounded-lg px-4 py-2 hover:bg-slate-50"
              >
                {copied ? "Tersalin" : "Salin"}
              </button>
            </div>
          </>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-200">
                <th className="py-2 pr-4 font-medium">Nama</th>
                <th className="py-2 pr-4 font-medium">Email</th>
                <th className="py-2 font-medium">Password</th>
              </tr>
            </thead>
            <tbody>
              {result.map((u) => (
                <tr key={u.email} className="border-b border-slate-100">
                  <td className="py-2 pr-4">{u.name}</td>
                  <td className="py-2 pr-4">{u.email}</td>
                  <td className="py-2 font-mono">
                    {u.temporaryPassword ?? <span className="text-slate-400 font-sans">diisi admin</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Link href="/admin/users" className="inline-block text-sm text-slate-600 hover:underline">
          Ke daftar user
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white rounded-xl border border-slate-200 p-6">
      <div className="text-sm text-slate-600 space-y-2">
        <p>
          Kolom wajib: <b>nama, email, role</b>. Untuk role PESERTA wajib juga <b>disiplin</b> dan{" "}
          <b>jabatan</b>. Kolom <b>departemen</b> dan <b>password</b> opsional; password kosong akan dibuatkan
          otomatis.
        </p>
        <p className="text-xs text-slate-400">
          Delimiter koma, titik koma, atau tab (hasil copy dari Excel) dikenali otomatis. Nilai disiplin:
          Instrumentasi, Electrical, Stationary, Rotating. Jabatan: Teknisi Junior, Teknisi Senior, Supervisor
          Lapangan, Engineer. Maksimal 300 baris. Jika ada satu baris bermasalah, tidak ada user yang dibuat.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input type="file" accept=".csv,.txt,text/csv" onChange={handleFile} className="text-sm" />
        <button
          type="button"
          onClick={() => setCsv(EXAMPLE)}
          className="text-sm text-brand-700 hover:underline"
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
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono"
      />

      {error && <p className="text-sm text-red-600">{error}</p>}
      {rowErrors.length > 0 && (
        <ul className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3 space-y-1 max-h-64 overflow-y-auto">
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
        className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg px-4 py-2.5 disabled:opacity-50"
      >
        {loading ? "Mengimpor..." : "Import User"}
      </button>
    </form>
  );
}
