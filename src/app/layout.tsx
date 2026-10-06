import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sistem Ujian Kompetensi Internal",
  description: "Aplikasi ujian kompetensi teknisi - Instrumentasi, Electrical, Stationary, Rotating",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="bg-slate-50 text-slate-900 min-h-screen">{children}</body>
    </html>
  );
}
