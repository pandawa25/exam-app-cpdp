"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DISCIPLINES, POSITIONS } from "@/lib/constants";

export default function NewQuestionBankPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [discipline, setDiscipline] = useState<string>(DISCIPLINES[0].value);
  const [position, setPosition] = useState<string>(POSITIONS[0].value);
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
      <h1 className="page-title mb-6">Bank Soal Baru</h1>
      <form onSubmit={handleSubmit} className="space-y-4 bg-panel-raised rounded-card border border-panel-line p-6">
        <div>
          <label className="label">Nama Bank Soal</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder='Misal: "Instrumentasi - Teknisi Senior"'
            className="input"
          />
        </div>
        <div>
          <label className="label">Disiplin</label>
          <select
            value={discipline}
            onChange={(e) => setDiscipline(e.target.value)}
            className="input"
          >
            {DISCIPLINES.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Jabatan</label>
          <select
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            className="input"
          >
            {POSITIONS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
        {error && <p className="text-sm text-alarm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary w-full"
        >
          {loading ? "Menyimpan..." : "Buat Bank Soal"}
        </button>
      </form>
    </div>
  );
}
