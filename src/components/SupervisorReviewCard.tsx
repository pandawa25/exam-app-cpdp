"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Attempt = {
  id: string;
  status: string;
  score: number | null;
  passed: boolean | null;
  violationCount: number;
  exam: { title: string; passingScore: number };
  user: { name: string; email: string };
};

export function SupervisorReviewCard({ attempt }: { attempt: Attempt }) {
  const router = useRouter();
  const [score, setScore] = useState(attempt.score ?? 0);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const willPass = score >= attempt.exam.passingScore;
  const autoSubmitted = attempt.status === "AUTO_SUBMITTED";
  const scoreId = `score-${attempt.id}`;
  const noteId = `note-${attempt.id}`;

  async function approve() {
    setLoading(true);
    await fetch(`/api/supervisor/attempts/${attempt.id}/review`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        overrideScore: score,
        overridePassed: willPass,
        reviewNote: note || undefined,
      }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <article
      className={`card p-5 ${attempt.violationCount > 0 ? "border-l-4 border-l-warn" : ""}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="section-title">{attempt.exam.title}</h2>
          <p className="mt-0.5 text-sm text-ink-soft">
            {attempt.user.name} <span className="text-ink-mute">({attempt.user.email})</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {autoSubmitted && <span className="badge badge-alarm">Dihentikan otomatis</span>}
          {attempt.violationCount > 0 && (
            <span className="badge badge-warn">{attempt.violationCount} pelanggaran</span>
          )}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-end gap-x-6 gap-y-3">
        <div>
          <label htmlFor={scoreId} className="label">
            Skor akhir
          </label>
          <input
            id={scoreId}
            type="number"
            min={0}
            max={100}
            value={score}
            onChange={(e) => setScore(Number(e.target.value))}
            className="input tnum w-24"
          />
        </div>
        <p className="tnum pb-2 text-sm text-ink-mute">
          Nilai lulus {attempt.exam.passingScore}
          {" - "}
          <span className={willPass ? "font-medium text-ok" : "font-medium text-alarm"}>
            {willPass ? "Lulus" : "Belum lulus"}
          </span>
        </p>
      </div>

      <div className="mt-3">
        <label htmlFor={noteId} className="label">
          Catatan review <span className="font-normal text-ink-mute">(opsional)</span>
        </label>
        <textarea
          id={noteId}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Alasan mengubah skor atau klarifikasi pelanggaran"
          rows={2}
          className="input"
        />
      </div>

      <button onClick={approve} disabled={loading} className="btn btn-primary mt-4">
        {loading ? "Menyimpan..." : "Setujui hasil"}
      </button>
    </article>
  );
}
