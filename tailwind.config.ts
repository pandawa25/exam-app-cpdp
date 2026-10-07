import type { Config } from "tailwindcss";

// Palet "ruang kontrol": permukaan baja gelap, warna HANYA untuk status (seperti annunciator panel).
//   brand  = aksi / elemen aktif (cyan proses)
//   ok     = normal / lulus
//   warn   = perhatian (waktu menipis, pelanggaran tercatat)
//   alarm  = gagal / auto-submit / destruktif
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        panel: {
          DEFAULT: "#141C2B", // latar halaman
          raised: "#1B2538", // kartu, tabel
          high: "#25314A", // hover, sel tombol
          line: "#2F3C55", // garis pemisah
          strong: "#435472", // garis dekoratif yang lebih tegas
          field: "#6B7C99", // batas kontrol interaktif (input, tombol): >= 3:1 terhadap latar
        },
        ink: {
          DEFAULT: "#E8EDF5",
          soft: "#C0CBDD",
          mute: "#94A3BC",
        },
        brand: {
          DEFAULT: "#4DB6C8",
          strong: "#74CCDA",
          dim: "#143645",
          on: "#06222A",
        },
        ok: { DEFAULT: "#5DBB82", dim: "#16352A", on: "#06210F" },
        warn: { DEFAULT: "#F2A93B", dim: "#3A2B14" },
        alarm: { DEFAULT: "#F27474", dim: "#42212B" },
      },
      fontFamily: {
        sans: ['"Barlow"', "ui-sans-serif", "system-ui", "sans-serif"],
        logo: ['"Cinzel"', "Georgia", "serif"],
        display: ['"Barlow Condensed"', '"Barlow"', "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 0 rgba(255,255,255,.04) inset, 0 8px 24px -12px rgba(0,0,0,.55)",
        glow: "0 0 0 1px rgba(77,182,200,.35), 0 8px 28px -8px rgba(77,182,200,.35)",
      },
      borderRadius: {
        ctl: "8px", // kontrol: tombol, input
        card: "14px", // panel / kartu
      },
    },
  },
  plugins: [],
};
export default config;
