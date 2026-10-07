// Tiap halaman peserta menyusun sendiri header dan lebarnya: layar ujian (fullscreen)
// tidak boleh memakai header yang berisi tautan keluar/ganti password.
export default function PesertaLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen">{children}</div>;
}
