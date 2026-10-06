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
    <form onSubmit={handleSubmit} className="space-y-3 bg-white rounded-xl border border-slate-200 p-6">
      <h2 className="font-medium text-slate-900 mb-1">Tambah Soal</h2>
      <textarea
        required
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Teks soal"
        rows={2}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
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
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        ))}
      </div>
      <div className="flex items-center gap-4">
        <label className="text-sm text-slate-700">
          Jawaban benar:{" "}
          <select
            value={correctOption}
            onChange={(e) => setCorrectOption(e.target.value)}
            className="rounded-lg border border-slate-300 px-2 py-1 text-sm ml-1"
          >
            {["A", "B", "C", "D"].map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm text-slate-700">
          Bobot:{" "}
          <input
            type="number"
            min={1}
            value={points}
            onChange={(e) => setPoints(Number(e.target.value))}
            className="w-16 rounded-lg border border-slate-300 px-2 py-1 text-sm ml-1"
          />
        </label>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg px-4 py-2 disabled:opacity-50"
      >
        {loading ? "Menyimpan..." : "Tambah Soal"}
      </button>
    </form>
  );
}
