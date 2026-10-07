"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Question = {
  questionId: string;
  text: string;
  imageUrl: string | null;
  options: { key: string; text: string }[];
  selectedOption: string | null;
};

type AttemptData = {
  id: string;
  status: string;
  deadline: string;
  examTitle: string;
  questions: Question[];
};

// Halaman pengerjaan ujian - inti dari tiga pilar anti-cheat di skill:
// 1. Timer: angka mundur di sini HANYA untuk tampilan. Source of truth tetap
//    endpoint heartbeat di server; kalau server bilang waktu habis, attempt
//    langsung AUTO_SUBMITTED di sana.
// 2. Tab-switch & fullscreen-exit: dicatat ke server tiap kejadian, auto-submit
//    terjadi di server begitu threshold terlampaui (bukan logic di client).
// 3. Jawaban auto-save tiap kali peserta memilih opsi.
export function ExamRunner({ attemptId }: { attemptId: string }) {
  const router = useRouter();
  const [data, setData] = useState<AttemptData | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [remainingMs, setRemainingMs] = useState<number | null>(null);
  const [violationCount, setViolationCount] = useState(0);
  const [violationWarning, setViolationWarning] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const endedRef = useRef(false);

  const loadAttempt = useCallback(async () => {
    const res = await fetch(`/api/attempts/${attemptId}`);
    const json = await res.json();
    setData(json);
    if (json.status !== "IN_PROGRESS" && !endedRef.current) {
      endedRef.current = true;
      router.replace(`/peserta/attempts/${attemptId}/result`);
    }
  }, [attemptId, router]);

  useEffect(() => {
    loadAttempt();
  }, [loadAttempt]);

  // Heartbeat ke server tiap 10 detik - ini yang memastikan auto-submit
  // benar-benar terjadi walau peserta diam tanpa interaksi.
  useEffect(() => {
    async function beat() {
      try {
        const res = await fetch(`/api/attempts/${attemptId}/heartbeat`);
        const json = await res.json();
        setRemainingMs(json.remainingMs);
        if (json.status !== "IN_PROGRESS" && !endedRef.current) {
          endedRef.current = true;
          router.replace(`/peserta/attempts/${attemptId}/result`);
        }
      } catch {
        // Koneksi putus sesaat: abaikan, heartbeat berikutnya mencoba lagi.
        // Waktu tetap dihitung server, jadi tidak ada keuntungan dari memutus koneksi.
      }
    }
    beat(); // langsung sekali di awal supaya timer tidak "--:--" selama 10 detik pertama
    const interval = setInterval(beat, 10_000);
    return () => clearInterval(interval);
  }, [attemptId, router]);

  // Countdown lokal tiap detik untuk tampilan - dikoreksi ulang tiap heartbeat 10 detik.
  useEffect(() => {
    if (remainingMs === null) return;
    const tick = setInterval(() => {
      setRemainingMs((ms) => (ms !== null ? Math.max(0, ms - 1000) : ms));
    }, 1000);
    return () => clearInterval(tick);
  }, [remainingMs !== null]);

  const reportViolation = useCallback(
    async (type: "TAB_SWITCH" | "FULLSCREEN_EXIT") => {
      const res = await fetch(`/api/attempts/${attemptId}/violation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      const json = await res.json();
      setViolationCount(json.violationCount ?? 0);
      if (json.autoSubmitted && !endedRef.current) {
        endedRef.current = true;
        router.replace(`/peserta/attempts/${attemptId}/result`);
      } else {
        setViolationWarning(
          `Pelanggaran tercatat (${json.violationCount}/${json.threshold ?? 3}). Ujian akan otomatis diakhiri jika pelanggaran mencapai batas.`
        );
      }
    },
    [attemptId, router]
  );

  useEffect(() => {
    function onVisibilityChange() {
      if (document.hidden) reportViolation("TAB_SWITCH");
    }
    function onFullscreenChange() {
      const inFullscreen = !!document.fullscreenElement;
      setIsFullscreen(inFullscreen);
      if (!inFullscreen) reportViolation("FULLSCREEN_EXIT");
    }
    document.addEventListener("visibilitychange", onVisibilityChange);
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      document.removeEventListener("fullscreenchange", onFullscreenChange);
    };
  }, [reportViolation]);

  async function enterFullscreen() {
    try {
      await document.documentElement.requestFullscreen();
    } catch {
      // Beberapa browser/embed menolak fullscreen - ujian tetap bisa dikerjakan,
      // cuma tanpa proteksi fullscreen-lock.
    }
  }

  async function selectAnswer(questionId: string, optionKey: string) {
    setData((prev) =>
      prev
        ? {
            ...prev,
            questions: prev.questions.map((q) =>
              q.questionId === questionId ? { ...q, selectedOption: optionKey } : q
            ),
          }
        : prev
    );
    await fetch(`/api/attempts/${attemptId}/answer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionId, selectedOption: optionKey }),
    });
  }

  async function handleSubmit() {
    if (!confirm("Yakin selesaikan ujian sekarang? Jawaban tidak bisa diubah lagi setelah submit.")) return;
    endedRef.current = true;
    await fetch(`/api/attempts/${attemptId}/submit`, { method: "POST" });
    router.replace(`/peserta/attempts/${attemptId}/result`);
  }

  if (!data) return <p className="text-sm text-slate-500 p-6">Memuat soal...</p>;

  if (!isFullscreen) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
        <h1 className="font-semibold text-lg mb-2">{data.examTitle}</h1>
        <p className="text-sm text-slate-600 mb-6">
          Ujian ini dijalankan dalam mode fullscreen dengan pemantauan tab-switch. Keluar dari fullscreen
          atau berpindah tab akan tercatat sebagai pelanggaran.
        </p>
        <button
          onClick={enterFullscreen}
          className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg px-6 py-3"
        >
          Masuk Mode Ujian (Fullscreen)
        </button>
      </div>
    );
  }

  const question = data.questions[currentIndex];
  const answeredCount = data.questions.filter((q) => q.selectedOption).length;
  const minutes = remainingMs !== null ? Math.floor(remainingMs / 60000) : null;
  const seconds = remainingMs !== null ? Math.floor((remainingMs % 60000) / 1000) : null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-semibold">{data.examTitle}</h1>
        <div
          className={`text-sm font-mono px-3 py-1 rounded-lg ${
            remainingMs !== null && remainingMs < 60_000 ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-700"
          }`}
        >
          {minutes !== null ? `${minutes}:${String(seconds).padStart(2, "0")}` : "--:--"}
        </div>
      </div>

      {violationWarning && (
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4">
          {violationWarning}
        </p>
      )}

      <p className="text-xs text-slate-400 mb-2">
        Soal {currentIndex + 1} dari {data.questions.length} &middot; Terjawab: {answeredCount}
      </p>

      <div className="bg-white border border-slate-200 rounded-xl p-6 mb-4">
        <p className="font-medium text-slate-900 mb-4">{question.text}</p>
        {question.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={question.imageUrl} alt="" className="mb-4 rounded-lg max-h-64" />
        )}
        <div className="space-y-2">
          {question.options.map((opt) => (
            <button
              key={opt.key}
              onClick={() => selectAnswer(question.questionId, opt.key)}
              className={`w-full text-left rounded-lg border px-4 py-2.5 text-sm ${
                question.selectedOption === opt.key
                  ? "border-brand-600 bg-brand-50 text-brand-900"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              {opt.text}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
          disabled={currentIndex === 0}
          className="text-sm text-slate-600 disabled:opacity-30"
        >
          &larr; Sebelumnya
        </button>

        <div className="flex gap-1 flex-wrap justify-center max-w-xs">
          {data.questions.map((q, i) => (
            <button
              key={q.questionId}
              onClick={() => setCurrentIndex(i)}
              className={`w-7 h-7 text-xs rounded ${
                i === currentIndex
                  ? "bg-brand-600 text-white"
                  : q.selectedOption
                  ? "bg-brand-100 text-brand-700"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>

        {currentIndex < data.questions.length - 1 ? (
          <button
            onClick={() => setCurrentIndex((i) => Math.min(data.questions.length - 1, i + 1))}
            className="text-sm text-slate-600"
          >
            Selanjutnya &rarr;
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg px-4 py-2"
          >
            Selesai Ujian
          </button>
        )}
      </div>
    </div>
  );
}
