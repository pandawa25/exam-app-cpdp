// Identitas visual: simbol "instrument balloon" dari diagram P&ID/ISA
// (lingkaran dengan garis tengah = instrumen yang dipasang di panel ruang kontrol).
// Teks atas = fungsi (UK = Ujian Kompetensi), teks bawah = nomor loop.
// Ganti file ini bila perusahaan sudah punya logo resmi.

export function BrandMark({ size = 36 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      role="img"
      aria-label="Ujian Kompetensi"
      className="shrink-0"
    >
      <circle cx="20" cy="20" r="17.5" stroke="currentColor" strokeWidth="2.5" />
      <line x1="2.5" y1="20" x2="37.5" y2="20" stroke="currentColor" strokeWidth="2.5" />
      <text
        x="20"
        y="16.2"
        textAnchor="middle"
        fontSize="11.5"
        fontWeight="700"
        fill="currentColor"
        fontFamily='"Barlow Condensed", "Barlow", sans-serif'
      >
        UK
      </text>
      <text
        x="20"
        y="31.6"
        textAnchor="middle"
        fontSize="11.5"
        fontWeight="600"
        fill="currentColor"
        fontFamily='"Barlow Condensed", "Barlow", sans-serif'
      >
        01
      </text>
    </svg>
  );
}

export function Brand({ size = 36 }: { size?: number }) {
  return (
    <span className="flex items-center gap-3 text-brand">
      <BrandMark size={size} />
      <span className="font-display text-xl font-semibold leading-none text-ink">
        Ujian Kompetensi
      </span>
    </span>
  );
}
