"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { disciplineLabel, positionLabel } from "@/lib/constants";

type Bank = {
  id: string;
  name: string;
  discipline: string;
  position: string;
  _count: { questions: number };
};

export function NewExamForm({ banks }: { banks: Bank[] }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [questionBankId, setQuestionBankId] = useState(banks[0]?.id ?? "");
  const [questionCount, setQuestionCount] = useState(20);
  const [durationMin, setDurationMin] = useState(60);
  const [passingScore, setPassingScore] = useState(70);
  const [opensAt, setOpensAt] = useState("");
  const [closesAt, setClosesAt] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const selectedBank = banks.find((b) => b.id === questionBankId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/exams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        questionBankId,
        questionCount,
        durationMin,
        passingScore,
        opensAt,
        closesAt,
      }),
    });

    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Gagal membuat exam");
      return;
    }
    router.push("/admin/exams");
  }

  if (banks.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        Belum ada bank soal. Buat bank soal dulu sebelum membuat exam.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white rounded-xl border border-slate-200 p-6">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Judul Exam</label>
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder='Misal: "Ujian Kompetensi Instrumentasi - Teknisi Senior Q4 2026"'
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Bank Soal</label>
        <select
          value={questionBankId}
          onChange={(e) => setQuestionBankId(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          {banks.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name} ({disciplineLabel(b.discipline)} / {positionLabel(b.position)}) - {b._count.questions} soal
            </option>
          ))}
        </select>
        {selectedBank && (
          <p className="text-xs text-slate-500 mt-1">
            Exam otomatis untuk disiplin {disciplineLabel(selectedBank.discipline)}, jabatan{" "}
            {positionLabel(selectedBank.position)} - hanya peserta dengan profil itu yang akan melihat exam ini.
          </p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Jumlah Soal</label>
          <input
            type="number"
            min={1}
            max={selectedBank?._count.questions ?? 1}
            value={questionCount}
            onChange={(e) => setQuestionCount(Number(e.target.value))}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Durasi (menit)</label>
          <input
            type="number"
            min={1}
            value={durationMin}
            onChange={(e) => setDurationMin(Number(e.target.value))}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Passing Score</label>
          <input
            type="number"
            min={0}
            max={100}
            value={passingScore}
            onChange={(e) => setPassingScore(Number(e.target.value))}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Buka</label>
          <input
            type="datetime-local"
            required
            value={opensAt}
            onChange={(e) => setOpensAt(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Tutup</label>
          <input
            type="datetime-local"
            required
            value={closesAt}
            onChange={(e) => setClosesAt(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg px-4 py-2.5 disabled:opacity-50"
      >
        {loading ? "Menyimpan..." : "Buat Exam (Draft)"}
      </button>
      <p className="text-xs text-slate-400">
        Exam dibuat sebagai Draft dulu. Klik &quot;Publish&quot; di halaman daftar exam setelah siap.
      </p>
    </form>
  );
}
