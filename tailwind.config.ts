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
          DEFAULT: "#1B222A", // latar halaman
          raised: "#232C35", // kartu, tabel
          high: "#2C3742", // hover, sel tombol
          line: "#38444F", // garis pemisah
          strong: "#4C5B69", // border input & tombol sekunder
        },
        ink: {
          DEFAULT: "#E8EDF1",
          soft: "#BAC5CE",
          mute: "#93A0AC",
        },
        brand: {
          DEFAULT: "#4DB6C8",
          strong: "#74CCDA",
          dim: "#173A44",
          on: "#06222A",
        },
        ok: { DEFAULT: "#5DBB82", dim: "#1B3A2A", on: "#06210F" },
        warn: { DEFAULT: "#F2A93B", dim: "#3E2E12" },
        alarm: { DEFAULT: "#F27474", dim: "#442224" },
      },
      fontFamily: {
        sans: ['"Barlow"', "ui-sans-serif", "system-ui", "sans-serif"],
        display: ['"Barlow Condensed"', '"Barlow"', "ui-sans-serif", "system-ui", "sans-serif"],
      },
      borderRadius: {
        ctl: "6px", // kontrol: tombol, input
        card: "10px", // panel / kartu
      },
    },
  },
  plugins: [],
};
export default config;
