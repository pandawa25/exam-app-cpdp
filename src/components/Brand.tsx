import { PROGRAM_MODULE, PROGRAM_SHORT, PROGRAM_TITLE } from "@/lib/program";

// Logo program CPDP Maintenance Execution II. Berkas gambar ada di /public:
// logo-mark.png (emblem saja) dan logo-full.png (emblem + tulisan), keduanya putih transparan
// supaya cocok di latar gelap aplikasi.

export function BrandMark({ size = 36 }: { size?: number }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/logo-mark.png" width={size} height={size} alt="" className="shrink-0" />;
}

/** Logo lengkap (emblem + tulisan Maintenance Execution II). Rasio asli sekitar 1 : 1. */
export function BrandLogoFull({ width = 160, className = "" }: { width?: number; className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img
      src="/logo-full.png"
      width={width}
      height={Math.round(width * (540 / 543))}
      alt={PROGRAM_TITLE}
      className={className}
    />
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
