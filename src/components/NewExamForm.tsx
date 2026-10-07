"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DISCIPLINES, POSITIONS, disciplineLabel, positionLabel } from "@/lib/constants";

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
  // Filter disiplin/jenjang mempersempit pilihan bank soal (bisa puluhan bank).
  const [discipline, setDiscipline] = useState("");
  const [position, setPosition] = useState("");
  const [pickedBankId, setPickedBankId] = useState(banks[0]?.id ?? "");
  const [questionCount, setQuestionCount] = useState(20);
  const [durationMin, setDurationMin] = useState(60);
  const [passingScore, setPassingScore] = useState(70);
  const [opensAt, setOpensAt] = useState("");
  const [closesAt, setClosesAt] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const visibleBanks = banks.filter(
    (b) => (!discipline || b.discipline === discipline) && (!position || b.position === position)
  );
  // Pilihan yang tidak lagi termasuk hasil filter otomatis pindah ke bank pertama yang tampil.
  const selectedBank = visibleBanks.find((b) => b.id === pickedBankId) ?? visibleBanks[0];
  const questionBankId = selectedBank?.id ?? "";

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
        // datetime-local tidak membawa zona waktu. Konversi di browser (zona waktu admin)
        // ke ISO UTC; kalau dikirim mentah, server (UTC) akan menafsirkannya bergeser 7 jam dari WIB.
        opensAt: new Date(opensAt).toISOString(),
        closesAt: new Date(closesAt).toISOString(),
      }),
    });

    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Gagal membuat ujian");
      return;
    }
    router.push("/admin/exams");
  }

  if (banks.length === 0) {
    return (
      <p className="text-sm text-ink-mute">
        Belum ada bank soal. Buat bank soal dulu sebelum membuat ujian.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-panel-raised rounded-card border border-panel-line p-6">
      <div>
        <label className="label">Judul Ujian</label>
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder='Misal: "CPDP ME II - Instrumentasi Jr. Technician I - Q4 2026"'
          className="input"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="n-discipline">
            Disiplin
          </label>
          <select id="n-discipline" value={discipline} onChange={(e) => setDiscipline(e.target.value)} className="input">
            <option value="">Semua disiplin</option>
            {DISCIPLINES.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="n-position">
            Jenjang
          </label>
          <select id="n-position" value={position} onChange={(e) => setPosition(e.target.value)} className="input">
            <option value="">Semua jenjang</option>
            {POSITIONS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="label" htmlFor="n-bank">
          Bank Soal
        </label>
        <select
          id="n-bank"
          value={questionBankId}
          onChange={(e) => setPickedBankId(e.target.value)}
          className="input"
          disabled={visibleBanks.length === 0}
        >
          {visibleBanks.length === 0 && <option value="">Tidak ada bank soal untuk filter ini</option>}
          {visibleBanks.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name} - {b._count.questions} soal
            </option>
          ))}
        </select>
        {selectedBank && (
          <p className="text-xs text-ink-mute mt-1">
            Ujian otomatis untuk disiplin {disciplineLabel(selectedBank.discipline)}, jabatan{" "}
            {positionLabel(selectedBank.position)} - hanya peserta dengan profil itu yang akan melihat ujian ini.
          </p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="label">Jumlah Soal</label>
          <input
            type="number"
            min={1}
            max={selectedBank?._count.questions ?? 1}
            value={questionCount}
            onChange={(e) => setQuestionCount(Number(e.target.value))}
            className="input"
          />
        </div>
        <div>
          <label className="label">Durasi (menit)</label>
          <input
            type="number"
            min={1}
            value={durationMin}
            onChange={(e) => setDurationMin(Number(e.target.value))}
            className="input"
          />
        </div>
        <div>
          <label className="label">Nilai Lulus</label>
          <input
            type="number"
            min={0}
            max={100}
            value={passingScore}
            onChange={(e) => setPassingScore(Number(e.target.value))}
            className="input"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Buka</label>
          <input
            type="datetime-local"
            required
            value={opensAt}
            onChange={(e) => setOpensAt(e.target.value)}
            className="input"
          />
        </div>
        <div>
          <label className="label">Tutup</label>
          <input
            type="datetime-local"
            required
            value={closesAt}
            onChange={(e) => setClosesAt(e.target.value)}
            className="input"
          />
        </div>
      </div>

      {error && <p className="text-sm text-alarm">{error}</p>}

      <button
        type="submit"
        disabled={loading || !questionBankId}
        className="btn btn-primary"
      >
        {loading ? "Menyimpan..." : "Buat Ujian (Draf)"}
      </button>
      <p className="text-xs text-ink-mute">
        Ujian dibuat sebagai draf dulu. Klik &quot;Terbitkan&quot; di halaman daftar ujian setelah siap.
      </p>
    </form>
  );
}
