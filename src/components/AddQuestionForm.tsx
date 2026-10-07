"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AddQuestionForm({ bankId }: { bankId: string }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [optionA, setOptionA] = useState("");
  const [optionB, setOptionB] = useState("");
  const [optionC, setOptionC] = useState("");
  const [optionD, setOptionD] = useState("");
  const [correctOption, setCorrectOption] = useState("A");
  const [points, setPoints] = useState(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch(`/api/question-banks/${bankId}/questions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, optionA, optionB, optionC, optionD, correctOption, points }),
    });

    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Gagal menambah soal");
      return;
    }

    setText("");
    setOptionA("");
    setOptionB("");
    setOptionC("");
    setOptionD("");
    setCorrectOption("A");
    setPoints(1);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 bg-panel-raised rounded-card border border-panel-line p-6">
      <h2 className="font-medium text-ink mb-1">Tambah Soal</h2>
      <textarea
        required
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Teks soal"
        rows={2}
        className="input"
      />
      <div className="grid grid-cols-2 gap-3">
        {[
          ["A", optionA, setOptionA],
          ["B", optionB, setOptionB],
          ["C", optionC, setOptionC],
          ["D", optionD, setOptionD],
        ].map(([label, value, setter]: any) => (
          <input
            key={label}
            required
            value={value}
            onChange={(e) => setter(e.target.value)}
            placeholder={`Opsi ${label}`}
            className="input w-auto"
          />
        ))}
      </div>
      <div className="flex items-center gap-4">
        <label className="text-sm text-ink-soft">
          Jawaban benar:{" "}
          <select
            value={correctOption}
            onChange={(e) => setCorrectOption(e.target.value)}
            className="rounded-ctl border border-panel-strong px-2 py-1 text-sm ml-1"
          >
            {["A", "B", "C", "D"].map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm text-ink-soft">
          Bobot:{" "}
          <input
            type="number"
            min={1}
            value={points}
            onChange={(e) => setPoints(Number(e.target.value))}
            className="input w-16 !px-2 !py-1 ml-1"
          />
        </label>
      </div>
      {error && <p className="text-sm text-alarm">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="btn btn-primary"
      >
        {loading ? "Menyimpan..." : "Tambah Soal"}
      </button>
    </form>
  );
}
