# Sistem Ujian Kompetensi Internal

Aplikasi web ujian kompetensi untuk teknisi 4 disiplin — **Instrumentasi, Electrical, Stationary, Rotating** — dengan bank soal, exam difilter otomatis sesuai disiplin & jabatan peserta, timer server-side, anti-cheat (randomize soal/opsi, deteksi tab-switch, fullscreen lock, auto-submit), dan review supervisor.

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
| Peserta (Instrumentasi, Teknisi Senior) | teknisi.instrumentasi@perusahaan.com |
| Peserta (Electrical, Teknisi Senior) | teknisi.electrical@perusahaan.com |

Login sebagai peserta Instrumentasi langsung bisa coba exam contoh yang sudah di-publish oleh seed.

## Alur pemakaian

1. **Admin** login → `Bank Soal` → buat bank per kombinasi disiplin+jabatan → tambah soal → `Exam` → buat exam dari bank itu (masih Draft) → klik **Publish**.
2. **Peserta** hanya melihat exam yang disiplin & jabatannya cocok dengan profil mereka (difilter di query, bukan disembunyikan di UI saja — lihat `src/app/api/exams/route.ts` dan `src/app/peserta/exams/page.tsx`).
3. Peserta mulai ujian → wajib masuk fullscreen dulu → timer jalan dari server → jawaban auto-save tiap pilih opsi → keluar fullscreen/pindah tab tercatat sebagai pelanggaran (auto-submit di pelanggaran ke-3, bisa diubah lewat env `VIOLATION_THRESHOLD`).
4. **Supervisor** login → `Review Hasil Ujian` → attempt dengan pelanggaran terbanyak muncul duluan → approve skor (bisa override) + catatan.

## Yang masih perlu ditambahkan admin secara manual sebelum pakai produksi

Aplikasi ini scaffold inti yang sudah jalan end-to-end, tapi beberapa hal ini belum dibuatkan karena butuh keputusan dari pihak perusahaan:

- **Manajemen user** belum ada UI-nya (saat ini lewat seed script / Prisma Studio). Tambahkan halaman admin untuk create/import user (termasuk assign disiplin+jabatan) kalau jumlah karyawan banyak — bisa pakai `npm run prisma:studio` untuk sementara, atau minta dibuatkan fitur import CSV.
- **Reset password** belum ada flow self-service — admin reset manual lewat Prisma Studio untuk sekarang.
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
