# CPDP Maintenance Execution II (ME II)

Aplikasi web ujian kompetensi untuk Craft Profesional Development Program (CPDP) Maintenance Execution II (ME II), untuk teknisi 5 disiplin — **Instrumentasi, Electrical, Stationary, Rotating, Civil** — dengan bank soal, exam difilter otomatis sesuai disiplin & jabatan peserta, timer server-side, anti-cheat (randomize soal/opsi, deteksi tab-switch, fullscreen lock, auto-submit), dan review supervisor.

Dibangun mengikuti skill `online-exam-system-builder` (lihat `references/` di skill tersebut untuk penjelasan desain lengkap).

## Stack

- **Next.js 14** (App Router) — full-stack, frontend + API routes dalam satu codebase
- **PostgreSQL + Prisma ORM**
- **NextAuth.js** (Credentials provider) — auth internal, role ADMIN / PESERTA / SUPERVISOR
- **Tailwind CSS**

## Setup lokal

```bash
npm install
cp .env.example .env
# edit .env: isi DATABASE_URL ke Postgres lokal, generate NEXTAUTH_SECRET dengan:
openssl rand -base64 32

npx prisma migrate dev --name init
npm run prisma:seed   # isi 4 disiplin, akun contoh, 1 exam contoh sudah PUBLISHED
npm run dev
```

Buka `http://localhost:3000/login`. Akun contoh dari seed (password sama semua: `password123`):

| Role | Email |
|---|---|
| Admin | admin@perusahaan.com |
| Supervisor | supervisor@perusahaan.com |
| Peserta (Instrumentasi, Sr. Technician I) | teknisi.instrumentasi@perusahaan.com |
| Peserta (Electrical, Sr. Technician I) | teknisi.electrical@perusahaan.com |

Login sebagai peserta Instrumentasi langsung bisa coba exam contoh yang sudah di-publish oleh seed.

## Alur pemakaian

1. **Admin** login → `Bank Soal` → buat bank per kombinasi disiplin+jabatan → tambah soal → `Exam` → buat exam dari bank itu (masih Draft) → klik **Publish**.
2. **Peserta** hanya melihat exam yang disiplin & jabatannya cocok dengan profil mereka (difilter di query, bukan disembunyikan di UI saja — lihat `src/app/api/exams/route.ts` dan `src/app/peserta/exams/page.tsx`).
3. Peserta mulai ujian → wajib masuk fullscreen dulu → timer jalan dari server → jawaban auto-save tiap pilih opsi → keluar fullscreen/pindah tab tercatat sebagai pelanggaran (auto-submit di pelanggaran ke-3, bisa diubah lewat env `VIOLATION_THRESHOLD`).
4. **Supervisor** login → `Review Hasil Ujian` → attempt dengan pelanggaran terbanyak muncul duluan → approve skor (bisa override) + catatan.

## Manajemen user & password

- **Admin → menu User**: cari/filter, tambah satu user, edit (nama, role, disiplin, jabatan, departemen), reset password, nonaktifkan/aktifkan, hapus (hanya untuk user tanpa riwayat ujian).
- **Import CSV** (Admin → User → Import CSV): kolom wajib `nama,email,role`; role PESERTA wajib juga `disiplin,jabatan` (disiplin: Instrumentasi, Electrical, Stationary Equipment, Rotating Equipment, Civil; jabatan: Jr. Technician I, Jr. Technician II, Technician I, Technician II, Sr. Technician I, penulisan titik/spasi/huruf besar bebas); `departemen` dan `password` opsional. Delimiter koma/titik koma/tab dikenali otomatis, jadi hasil copy dari Excel bisa langsung ditempel. Password yang dikosongkan dibuatkan acak dan ditampilkan **sekali** (bisa diunduh sebagai CSV). Import bersifat all-or-nothing: satu baris salah = tidak ada user yang dibuat, semua error ditampilkan per baris.
- **Ganti password mandiri**: semua role, menu "Ganti Password" (`/akun/password`), wajib memasukkan password lama.
- User yang dinonaktifkan tidak bisa login baru; sesi yang sudah berjalan berakhir maksimal 12 jam. Admin tidak bisa menonaktifkan/menghapus akunnya sendiri atau admin aktif terakhir.
- Belum ada "lupa password" mandiri (via email); reset dilakukan admin lewat halaman Edit User.

## Yang masih perlu ditambahkan admin secara manual sebelum pakai produksi

Aplikasi ini scaffold inti yang sudah jalan end-to-end, tapi beberapa hal ini belum dibuatkan karena butuh keputusan dari pihak perusahaan:

- **Export laporan hasil** (ke Excel/PDF) belum ada — bisa ditambahkan di halaman admin/supervisor kalau diperlukan.
- **Multiple attempts / retake** sengaja dibuat satu kali submit = selesai (lihat `startAttempt.ts`) — ubah logicnya kalau perusahaan mau izinkan retake.

## Deploy

Lihat `references/deployment.md` di skill `online-exam-system-builder` untuk langkah lengkap Railway dan Google Cloud Run. Ringkas untuk Railway:

1. Push project ini ke GitHub, hubungkan ke Railway.
2. Tambah PostgreSQL addon di Railway (auto-inject `DATABASE_URL`).
3. Set env var `NEXTAUTH_SECRET`, `NEXTAUTH_URL` (domain Railway kamu), `VIOLATION_THRESHOLD` (opsional, default 3).
4. Settings → Deploy → **Pre-deploy Command**: `npx prisma migrate deploy` (jangan di Start Command; biarkan Start Command default). Migration awal ada di `prisma/migrations/`.
5. Jalankan seed sekali (opsional) dengan `SEED_PASSWORD` diisi di environment variables, supaya akun contoh tidak memakai `password123`: `npm run prisma:seed`. Untuk produksi sebaiknya buat user asli lewat Prisma Studio, lalu hapus akun contoh.
6. Akses lewat `https://<domain>/` — root otomatis diarahkan ke `/login` atau dashboard sesuai role.

Catatan: waktu buka/tutup exam diinput sesuai zona waktu browser admin dan ditampilkan dalam WIB. Setiap perubahan `schema.prisma` harus disertai migration baru (`npx prisma migrate dev --name <nama>` di lokal, commit folder `prisma/migrations/`).

## Jabatan dan soal dummy

- Jabatan = jenjang + disiplin, mis. "Jr. Technician I Instrument". Jenjang: Jr. Technician I, Jr. Technician II, Technician I, Technician II, Sr. Technician I. Disiplin: Instrumentasi, Electrical, Stationary, Rotating, Civil (5 x 5 = 25 jabatan).
- Soal dummy: 30 soal per jabatan (750 soal) di `prisma/data/questions/<DISIPLIN>.<JENJANG>.json`. Dijalankan oleh `npm run prisma:seed` atau hanya soalnya dengan `npm run prisma:seed-questions`. Idempotent: bank bernama "<Disiplin> - <Jenjang> (dummy)" yang sudah ada dilewati.
- Soal dummy dibuat untuk uji alur aplikasi, belum diverifikasi SME. Ganti dengan soal resmi sebelum dipakai menilai peserta.
- Migrasi `position_levels` memetakan data lama: Teknisi Junior menjadi Jr. Technician I; Teknisi Senior, Supervisor Lapangan, dan Engineer menjadi Sr. Technician I. Periksa ulang jabatan user yang sudah ada.

## Riwayat ujian peserta

- Peserta: tab **Riwayat ujian** (`/peserta/history`) memuat semua ujian miliknya, termasuk exam yang sudah ditutup: tanggal, jam mulai-selesai, durasi, skor, lulus/belum, pelanggaran, status, dan tautan ke halaman hasil.
- Halaman hasil menampilkan skor, tanggal, waktu pengerjaan, jumlah soal benar dan terjawab. Kunci jawaban per soal tidak ditampilkan ke peserta.

## Hasil ujian

- Admin: menu **Hasil Ujian** (`/admin/results`). Supervisor: tab **Semua hasil** (`/supervisor/results`), hanya baca.
- Kolom: nama, email, jabatan, disiplin, exam, waktu pengerjaan (durasi + jam mulai-selesai WIB), skor, pelanggaran, status. Ada filter exam, disiplin, status, dan pencarian peserta.
- Waktu pengerjaan = `startedAt` sampai `submittedAt`, dibatasi `durationMin` exam. Peserta yang menghilang ditutup otomatis saat halaman dibuka, jadi tampil sebagai durasi penuh dengan penanda "waktu habis".
- Waktu per soal tidak dicatat (hanya waktu awal dan akhir per attempt). Mencatatnya butuh perubahan skema.

## Tampilan

Tema gelap "ruang kontrol": warna dipakai sebagai status (cyan = aksi, hijau = lulus/normal, amber = peringatan, merah = gagal/alarm), seperti annunciator panel.

- Token warna, font, dan radius: `tailwind.config.ts`. Kelas komponen (`btn`, `input`, `card`, `badge-*`, `notice-*`): `src/app/globals.css`.
- Font Barlow dan Barlow Condensed di-host sendiri lewat paket `@fontsource/*` (tidak ada request ke Google Fonts).
- Logo sementara (simbol instrument balloon "UK 01") ada di `src/components/Brand.tsx`. Ganti file itu bila perusahaan sudah punya logo resmi.
- Layar ujian (`ExamRunner`) sengaja tanpa header akun supaya tidak ada tautan keluar di tengah ujian.

## Struktur project

```
src/
├── app/
│   ├── (auth)/login/            # halaman login
│   ├── admin/                   # kelola bank soal & exam
│   ├── peserta/                 # daftar exam, halaman pengerjaan, hasil
│   ├── supervisor/review/       # review & approve hasil
│   └── api/                     # semua API route (lihat tiap route.ts, dikomentari alasannya)
├── components/                  # ExamRunner (inti anti-cheat+timer), form2 admin, dll
├── lib/                         # prisma client, auth config, scoring, startAttempt
└── middleware.ts                # proteksi route per role
prisma/
├── schema.prisma
└── seed.ts
```
