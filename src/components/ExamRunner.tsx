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
  durationMin: number;
  examTitle: string;
  violationCount?: number;
  questions: Question[];
};

// Sisa waktu ditampilkan seperti bar gauge di HMI: isi = sisa waktu, dua garis = batas
// peringatan (25%) dan alarm (10%). Warna berubah di batas itu, dan teks ikut berubah
// supaya status tidak hanya dibedakan lewat warna.
function TimeGauge({
  remainingMs,
  totalMs,
  className = "w-full sm:w-56",
}: {
  remainingMs: number | null;
  totalMs: number;
  className?: string;
}) {
  const known = remainingMs !== null && totalMs > 0;
  const frac = known ? Math.min(1, Math.max(0, (remainingMs as number) / totalMs)) : 1;
  const level = !known ? "normal" : frac <= 0.1 || (remainingMs as number) < 60_000 ? "alarm" : frac <= 0.25 ? "warn" : "normal";

  const fill = level === "alarm" ? "bg-alarm" : level === "warn" ? "bg-warn" : "bg-brand";
  const text = level === "alarm" ? "text-alarm" : level === "warn" ? "text-warn" : "text-ink";
  const label = level === "alarm" ? "Waktu hampir habis" : level === "warn" ? "Waktu menipis" : "Sisa waktu";

  const minutes = known ? Math.floor((remainingMs as number) / 60000) : null;
  const seconds = known ? Math.floor(((remainingMs as number) % 60000) / 1000) : null;

  return (
    <div className={`shrink-0 ${className}`}>
      <div className="flex items-baseline justify-between gap-3">
        <span className={`text-xs ${level === "normal" ? "text-ink-mute" : `font-medium ${text}`}`}>{label}</span>
        <span role="timer" aria-live="off" className={`tnum font-display text-3xl font-semibold leading-none ${text}`}>
          {minutes !== null ? `${minutes}:${String(seconds).padStart(2, "0")}` : "--:--"}
        </span>
      </div>
      <div className="relative mt-2 h-2 rounded-full bg-panel-high" aria-hidden="true">
        <div
          className={`h-full rounded-full ${fill} transition-[width] duration-1000 ease-linear`}
          style={{ width: `${frac * 100}%` }}
        />
        <span className="absolute -bottom-[3px] -top-[3px] w-px bg-panel-strong" style={{ left: "25%" }} />
        <span className="absolute -bottom-[3px] -top-[3px] w-px bg-panel-strong" style={{ left: "10%" }} />
      </div>
      {/* Hanya berubah saat melewati batas, jadi pembaca layar tidak mengumumkan tiap detik. */}
      <p className="sr-only" aria-live="polite">
        {level === "normal" ? "" : label}
      </p>
    </div>
  );
}

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
  const [violationLimit, setViolationLimit] = useState<number | null>(null);
  const [violationWarning, setViolationWarning] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const endedRef = useRef(false);

  const loadAttempt = useCallback(async () => {
    const res = await fetch(`/api/attempts/${attemptId}`);
    const json = await res.json();
    setData(json);
    if (typeof json.violationCount === "number") setViolationCount(json.violationCount);
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
      if (typeof json.threshold === "number") setViolationLimit(json.threshold);
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
    const unanswered = data ? data.questions.filter((q) => !q.selectedOption).length : 0;
    const warning = unanswered > 0 ? `Masih ada ${unanswered} soal belum dijawab. ` : "";
    if (!confirm(`${warning}Selesaikan ujian sekarang? Jawaban tidak bisa diubah lagi setelah dikirim.`)) return;
    endedRef.current = true;
    await fetch(`/api/attempts/${attemptId}/submit`, { method: "POST" });
    router.replace(`/peserta/attempts/${attemptId}/result`);
  }

  if (!data) return <p className="p-6 text-sm text-ink-mute">Memuat soal...</p>;

  const totalMs = data.durationMin * 60_000;

  // Timer server sudah berjalan sejak halaman ini dibuka, jadi sisa waktu ditampilkan juga di sini.
  if (!isFullscreen) {
    return (
      <main className="mx-auto flex min-h-screen max-w-xl items-center px-4 py-10">
        <div className="card w-full p-6 sm:p-8">
          <h1 className="page-title">{data.examTitle}</h1>
          <p className="mt-3 text-sm text-ink-soft">
            Ujian berjalan dalam mode layar penuh. Hal berikut dicatat sebagai pelanggaran:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink-soft">
            <li>Keluar dari mode layar penuh</li>
            <li>Berpindah tab atau jendela</li>
          </ul>
          <p className="mt-3 text-sm text-ink-soft">Ujian diakhiri otomatis jika pelanggaran mencapai batas.</p>

          <div className="mt-6 border-t border-panel-line pt-5">
            <TimeGauge remainingMs={remainingMs} totalMs={totalMs} className="w-full" />
            <p className="mt-3 text-xs text-ink-mute">
              Waktu sudah berjalan sejak halaman ini dibuka. Masuk mode ujian sekarang.
            </p>
          </div>

          <button onClick={enterFullscreen} className="btn btn-primary mt-5 w-full py-3">
            Masuk mode ujian
          </button>
        </div>
      </main>
    );
  }

  const question = data.questions[currentIndex];
  const total = data.questions.length;
  const answeredCount = data.questions.filter((q) => q.selectedOption).length;
  const isLast = currentIndex === total - 1;

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-panel-line bg-panel-raised/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <h1 className="min-w-0 truncate font-display text-xl font-semibold text-ink">{data.examTitle}</h1>
          <TimeGauge remainingMs={remainingMs} totalMs={totalMs} />
        </div>
      </header>

      <div className="mx-auto max-w-5xl gap-6 px-4 py-6 lg:grid lg:grid-cols-[minmax(0,1fr)_15rem]">
        <div>
          {violationWarning && (
            <p role="alert" className="notice notice-warn mb-4">
              {violationWarning}
            </p>
          )}

          <section className="card p-5 sm:p-7" aria-labelledby="question-text">
            <p className="tnum mb-4 text-sm text-ink-mute">
              Soal {currentIndex + 1} dari {total}
            </p>
            <p id="question-text" className="max-w-[68ch] text-lg font-medium leading-relaxed text-ink">
              {question.text}
            </p>
            {question.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={question.imageUrl} alt="" className="mt-4 max-h-72 rounded-ctl border border-panel-line" />
            )}

            <div role="radiogroup" aria-labelledby="question-text" className="mt-6 space-y-2.5">
              {question.options.map((opt, i) => {
                const selected = question.selectedOption === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => selectAnswer(question.questionId, opt.key)}
                    className={`flex w-full items-start gap-3 rounded-ctl border px-4 py-3 text-left transition-colors ${
                      selected
                        ? "border-brand bg-brand-dim"
                        : "border-panel-field bg-panel hover:border-ink-mute hover:bg-panel-high"
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded border text-xs font-semibold ${
                        selected ? "border-brand bg-brand text-brand-on" : "border-panel-field text-ink-soft"
                      }`}
                    >
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span className="text-[0.95rem] leading-snug text-ink">{opt.text}</span>
                  </button>
                );
              })}
            </div>
          </section>

          <div className="mt-4 flex items-center justify-between">
            <button
              onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
              disabled={currentIndex === 0}
              className="btn btn-secondary"
            >
              &larr; Sebelumnya
            </button>

            {!isLast ? (
              <button onClick={() => setCurrentIndex((i) => Math.min(total - 1, i + 1))} className="btn btn-primary">
                Selanjutnya &rarr;
              </button>
            ) : (
              <button onClick={handleSubmit} className="btn btn-ok">
                Selesai ujian
              </button>
            )}
          </div>
        </div>

        {/* Navigator soal ala annunciator: tiap soal satu kotak, status terbaca dari bentuk dan warna. */}
        <aside className="mt-6 lg:mt-0" aria-label="Daftar soal">
          <div className="card p-4 lg:sticky lg:top-24">
            <p className="tnum text-sm text-ink-soft">
              Terjawab <span className="font-semibold text-ink">{answeredCount}</span> dari {total}
            </p>

            <div className="mt-3 grid grid-cols-8 gap-1.5 sm:grid-cols-10 lg:grid-cols-5">
              {data.questions.map((q, i) => {
                const current = i === currentIndex;
                const answered = !!q.selectedOption;
                return (
                  <button
                    key={q.questionId}
                    onClick={() => setCurrentIndex(i)}
                    aria-label={`Soal ${i + 1}, ${answered ? "terjawab" : "belum dijawab"}`}
                    aria-current={current ? "step" : undefined}
                    className={`tnum h-9 rounded text-sm font-medium transition-colors ${
                      current
                        ? "bg-brand text-brand-on"
                        : answered
                        ? "border border-brand/50 bg-brand-dim text-brand hover:bg-brand/20"
                        : "border border-panel-field bg-panel text-ink-mute hover:bg-panel-high"
                    }`}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>

            <ul className="mt-4 space-y-1.5 border-t border-panel-line pt-3 text-xs text-ink-mute">
              <li className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-sm bg-brand" aria-hidden="true" />
                Soal saat ini
              </li>
              <li className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-sm border border-brand/50 bg-brand-dim" aria-hidden="true" />
                Sudah dijawab
              </li>
              <li className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-sm border border-panel-field bg-panel" aria-hidden="true" />
                Belum dijawab
              </li>
            </ul>

            {violationCount > 0 && (
              <p className="notice notice-warn mt-4 text-xs">
                Pelanggaran {violationCount}
                {violationLimit ? ` dari ${violationLimit}` : ""}
              </p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
