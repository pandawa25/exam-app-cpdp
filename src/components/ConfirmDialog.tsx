"use client";

import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";

export type ConfirmOptions = {
  title: string;
  message: string;
  confirmLabel?: string;
  /** "danger" = tombol merah, untuk tindakan yang tidak bisa dibatalkan. */
  tone?: "default" | "danger";
  /** Kalau diisi, pengguna harus mengetik teks ini persis sebelum tombol konfirmasi aktif. */
  requireText?: string;
};

type State = ConfirmOptions & { resolve: (ok: boolean) => void };

// Pengganti window.confirm: mengikuti tema gelap, bisa memuat detail, dan (opsional)
// meminta pengetikan teks untuk tindakan yang menghapus data. Memakai elemen <dialog>
// native, jadi fokus terkunci di dalam dialog dan Esc menutupnya.
export function useConfirm() {
  const [state, setState] = useState<State | null>(null);

  const confirm = useCallback(
    (options: ConfirmOptions) => new Promise<boolean>((resolve) => setState({ ...options, resolve })),
    []
  );

  const dialog: ReactNode = state ? (
    <ConfirmDialog
      {...state}
      onClose={(ok) => {
        state.resolve(ok);
        setState(null);
      }}
    />
  ) : null;

  return { confirm, dialog };
}

function ConfirmDialog({
  title,
  message,
  confirmLabel = "Ya, lanjutkan",
  tone = "default",
  requireText,
  onClose,
}: ConfirmOptions & { onClose: (ok: boolean) => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [typed, setTyped] = useState("");
  const allowed = !requireText || typed.trim() === requireText;

  useEffect(() => {
    const el = ref.current;
    if (el && !el.open) el.showModal();
  }, []);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        onClose(false);
      }}
      onClick={(e) => {
        // Klik di area gelap (backdrop) = batal.
        if (e.target === ref.current) onClose(false);
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-card border border-panel-line bg-panel-raised p-0 text-ink backdrop:bg-black/65"
    >
      <div className="p-6">
        <h2 id={titleId} className="section-title">
          {title}
        </h2>
        <p className="mt-3 whitespace-pre-line text-sm text-ink-soft">{message}</p>

        {requireText && (
          <div className="mt-4">
            <label className="label" htmlFor={`${titleId}-confirm`}>
              Ketik <span className="font-semibold text-ink">{requireText}</span> untuk melanjutkan
            </label>
            <input
              id={`${titleId}-confirm`}
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              autoComplete="off"
              className="input"
            />
          </div>
        )}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={() => onClose(false)} className="btn btn-secondary">
            Batal
          </button>
          <button
            type="button"
            disabled={!allowed}
            onClick={() => onClose(true)}
            className={`btn ${tone === "danger" ? "btn-danger" : "btn-primary"}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
