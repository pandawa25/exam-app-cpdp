import { PROGRAM_MODULE, PROGRAM_SHORT, PROGRAM_TITLE } from "@/lib/program";

// Logo program CPDP Maintenance Execution II. Berkas gambar ada di /public:
// logo-mark.png (emblem saja) dan logo-full.png (emblem + tulisan), keduanya putih transparan
// supaya cocok di latar gelap aplikasi.

export function BrandMark({ size = 36 }: { size?: number }) {
  // SVG hasil trace dari emblem: tajam di ukuran berapa pun (PNG sumber hanya 246 px).
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/logo-mark.svg" width={size} height={Math.round(size * (1580 / 1676))} alt="" className="shrink-0" />;
}

/**
 * Logo lengkap: emblem (SVG) + tulisan "Maintenance Execution II" sebagai teks hidup
 * (Cinzel, serif kapital bergaya prasasti seperti logo asli) supaya tetap tajam.
 */
export function BrandLogoFull({ width = 160, className = "" }: { width?: number; className?: string }) {
  return (
    <div role="img" aria-label={PROGRAM_TITLE} className={`inline-flex flex-col items-center text-white ${className}`} style={{ width }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo-mark.svg" alt="" style={{ width: width * 0.78 }} />
      <span
        aria-hidden="true"
        className="whitespace-nowrap font-logo font-semibold uppercase leading-none"
        style={{ fontSize: width * 0.112, marginTop: width * 0.05, letterSpacing: "0.01em" }}
      >
        Maintenance
      </span>
      <span aria-hidden="true" className="flex w-full items-center" style={{ gap: width * 0.03, marginTop: width * 0.04 }}>
        <span className="h-[2px] flex-1 bg-white" />
        <span className="font-logo font-medium uppercase leading-none" style={{ fontSize: width * 0.06, letterSpacing: "0.14em" }}>
          Execution II
        </span>
        <span className="h-[2px] flex-1 bg-white" />
      </span>
    </div>
  );
}

export function Brand({ size = 36 }: { size?: number }) {
  return (
    <span className="flex items-center gap-3">
      <BrandMark size={size} />
      <span className="flex flex-col gap-1">
        <span className="font-display text-xl font-semibold leading-none text-ink">{PROGRAM_SHORT}</span>
        <span className="text-[0.7rem] font-medium uppercase leading-none tracking-wider text-ink-mute">
          {PROGRAM_MODULE}
        </span>
      </span>
    </span>
  );
}
