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

  async function approve() {
    setLoading(true);
    await fetch(`/api/supervisor/attempts/${attempt.id}/review`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        overrideScore: score,
        overridePassed: score >= attempt.exam.passingScore,
        reviewNote: note || undefined,
      }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-medium text-slate-900">{attempt.exam.title}</p>
          <p className="text-sm text-slate-500">
            {attempt.user.name} ({attempt.user.email})
          </p>
        </div>
        {attempt.violationCount > 0 && (
          <span className="text-xs font-medium bg-amber-100 text-amber-700 rounded-full px-2.5 py-1">
            {attempt.violationCount} pelanggaran
          </span>
        )}
      </div>

      <div className="flex items-center gap-4 mt-4">
        <label className="text-sm text-slate-700">
          Skor:{" "}
          <input
            type="number"
            min={0}
            max={100}
            value={score}
            onChange={(e) => setScore(Number(e.target.value))}
            className="w-20 rounded-lg border border-slate-300 px-2 py-1 text-sm ml-1"
          />
        </label>
        <span className="text-xs text-slate-400">passing score {attempt.exam.passingScore}</span>
      </div>

      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Catatan review (opsional) - misal alasan override skor atau klarifikasi pelanggaran"
        rows={2}
        className="w-full mt-3 rounded-lg border border-slate-300 px-3 py-2 text-sm"
      />

      <button
        onClick={approve}
        disabled={loading}
        className="mt-3 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg px-4 py-2 disabled:opacity-50"
      >
        {loading ? "Menyimpan..." : "Approve Hasil"}
      </button>
    </div>
  );
}
