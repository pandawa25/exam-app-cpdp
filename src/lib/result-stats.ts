// Logika murni (tanpa Prisma/IO) untuk modul hasil ujian, supaya mudah diuji.

export const WIB = "Asia/Jakarta";

export type Working = {
  /** Lama pengerjaan efektif dalam ms; null kalau attempt belum selesai. */
  ms: number | null;
  /** True kalau waktu pengerjaan mencapai batas waktu exam (waktu habis). */
  timedOut: boolean;
};

/**
 * Lama pengerjaan = submittedAt - startedAt, dibatasi sampai durasi exam.
 *
 * Pembatasan perlu karena submittedAt dicatat saat attempt di-finalize, bukan saat peserta
 * berhenti. Peserta yang menutup browser lalu tidak kembali baru di-finalize saat ada yang
 * membuka daftar hasil (lihat finalizeExpiredAttempts), bisa berjam-jam setelah waktu habis.
 * Tanpa batas ini, durasinya akan tampak jauh melebihi waktu ujian.
 *
 * Catatan: untuk attempt seperti itu, angka ini = batas waktu exam, bukan kapan peserta
 * sebenarnya berhenti mengerjakan (server tidak mencatat aktivitas terakhir).
 */
export function workingTime(startedAt: Date, submittedAt: Date | null, limitMin: number): Working {
  if (!submittedAt) return { ms: null, timedOut: false };
  const limitMs = limitMin * 60_000;
  const raw = submittedAt.getTime() - startedAt.getTime();
  const ms = Math.min(Math.max(raw, 0), limitMs);
  return { ms, timedOut: raw >= limitMs };
}

/** 2535000 -> "42 mnt 15 dtk"; 45000 -> "45 dtk"; 4500000 -> "1 j 15 mnt"; 3600000 -> "1 j". */
export function formatDuration(ms: number): string {
  const total = Math.round(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return m > 0 ? `${h} j ${m} mnt` : `${h} j`;
  if (m > 0) return `${m} mnt ${s} dtk`;
  return `${s} dtk`;
}

export type StatRow = {
  status: string;
  score: number | null;
  passed: boolean | null;
  workMs: number | null;
};

export type Summary = {
  total: number;
  finished: number;
  avgScore: number | null;
  passRate: number | null; // 0..100, dari attempt yang sudah punya hasil lulus/tidak
  avgWorkMs: number | null;
};

export function summarize(rows: StatRow[]): Summary {
  const scored = rows.filter((r) => r.score !== null);
  const judged = rows.filter((r) => r.passed !== null);
  const timed = rows.filter((r) => r.workMs !== null);

  const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
  const avgScore = mean(scored.map((r) => r.score as number));

  return {
    total: rows.length,
    finished: rows.filter((r) => r.status !== "IN_PROGRESS").length,
    avgScore: avgScore === null ? null : Math.round(avgScore * 10) / 10,
    passRate: judged.length ? Math.round((judged.filter((r) => r.passed).length / judged.length) * 100) : null,
    avgWorkMs: mean(timed.map((r) => r.workMs as number)),
  };
}

export function formatDate(d: Date): string {
  return d.toLocaleDateString("id-ID", { timeZone: WIB, day: "numeric", month: "short", year: "numeric" });
}

export function formatClock(d: Date): string {
  return d.toLocaleTimeString("id-ID", { timeZone: WIB, hour: "2-digit", minute: "2-digit" });
}
