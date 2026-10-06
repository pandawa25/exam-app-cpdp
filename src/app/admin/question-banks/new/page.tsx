"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DISCIPLINES, POSITIONS } from "@/lib/constants";

export default function NewQuestionBankPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [discipline, setDiscipline] = useState(DISCIPLINES[0].value);
  const [position, setPosition] = useState(POSITIONS[0].value);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/question-banks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, discipline, position }),
    });

    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Gagal membuat bank soal");
      return;
    }
    const bank = await res.json();
    router.push(`/admin/question-banks/${bank.id}`);
  }

  return (
    <div className="max-w-md">
      <h1 className="text-xl font-semibold mb-6">Bank Soal Baru</h1>
      <form onSubmit={handleSubmit} className="space-y-4 bg-white rounded-xl border border-slate-200 p-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Nama Bank Soal</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder='Misal: "Instrumentasi - Teknisi Senior"'
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Disiplin</label>
          <select
            value={discipline}
            onChange={(e) => setDiscipline(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            {DISCIPLINES.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Jabatan</label>
          <select
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            {POSITIONS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg py-2.5 disabled:opacity-50"
        >
          {loading ? "Menyimpan..." : "Buat Bank Soal"}
        </button>
      </form>
    </div>
  );
}
