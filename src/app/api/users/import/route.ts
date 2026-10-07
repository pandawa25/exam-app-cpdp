import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { parseCsv } from "@/lib/csv";
import {
  BCRYPT_ROUNDS,
  generatePassword,
  isUniqueViolation,
  MIN_PASSWORD_LENGTH,
  validateUserInput,
  type UserInput,
} from "@/lib/users";

const MAX_ROWS = 300;

// Nama kolom yang diterima (Indonesia/Inggris) -> field internal.
const HEADER_ALIASES: Record<string, string> = {
  nama: "name",
  name: "name",
  email: "email",
  role: "role",
  peran: "role",
  disiplin: "discipline",
  discipline: "discipline",
  jabatan: "position",
  position: "position",
  departemen: "department",
  department: "department",
  password: "password",
  "kata sandi": "password",
};

type RowError = { row: number; email?: string; error: string };

// POST: import banyak user sekaligus dari CSV. All-or-nothing: kalau ada satu baris bermasalah,
// tidak ada user yang dibuat dan semua error dikembalikan, supaya admin cukup memperbaiki file
// lalu upload ulang (tidak ada setengah data yang masuk).
// Baris tanpa kolom password dibuatkan password acak; dikembalikan sekali di response.
export async function POST(req: Request) {
  const session = await requireRole(["ADMIN"]);
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const csv = body && typeof body.csv === "string" ? body.csv : "";
  if (!csv.trim()) return NextResponse.json({ error: "Isi CSV kosong" }, { status: 400 });

  const rows = parseCsv(csv);
  if (rows.length < 2) {
    return NextResponse.json({ error: "CSV harus berisi baris header dan minimal 1 baris data" }, { status: 400 });
  }
  if (rows.length - 1 > MAX_ROWS) {
    return NextResponse.json({ error: `Maksimal ${MAX_ROWS} user per import` }, { status: 400 });
  }

  const headerIndex: Record<string, number> = {};
  rows[0].forEach((h, i) => {
    const field = HEADER_ALIASES[h.trim().toLowerCase()];
    if (field && !(field in headerIndex)) headerIndex[field] = i;
  });
  const missing = ["name", "email", "role"].filter((f) => !(f in headerIndex));
  if (missing.length > 0) {
    return NextResponse.json(
      { error: `Kolom wajib tidak ditemukan di header: ${missing.join(", ")}. Wajib ada: nama, email, role.` },
      { status: 400 }
    );
  }

  const cell = (row: string[], field: string) =>
    field in headerIndex ? (row[headerIndex[field]] ?? "").trim() : "";

  const errors: RowError[] = [];
  const seenEmails = new Set<string>();
  const prepared: { data: UserInput; password: string; generated: boolean }[] = [];

  rows.slice(1).forEach((row, idx) => {
    const lineNo = idx + 2; // nomor baris di file (header = baris 1)
    const parsed = validateUserInput({
      name: cell(row, "name"),
      email: cell(row, "email"),
      role: cell(row, "role"),
      discipline: cell(row, "discipline"),
      position: cell(row, "position"),
      department: cell(row, "department"),
    });
    if (!parsed.ok) {
      errors.push({ row: lineNo, email: cell(row, "email") || undefined, error: parsed.error });
      return;
    }
    if (seenEmails.has(parsed.data.email)) {
      errors.push({ row: lineNo, email: parsed.data.email, error: "Email dobel di dalam file" });
      return;
    }
    seenEmails.add(parsed.data.email);

    const provided = cell(row, "password");
    if (provided && provided.length < MIN_PASSWORD_LENGTH) {
      errors.push({
        row: lineNo,
        email: parsed.data.email,
        error: `Password minimal ${MIN_PASSWORD_LENGTH} karakter (atau kosongkan agar dibuatkan otomatis)`,
      });
      return;
    }
    prepared.push({
      data: parsed.data,
      password: provided || generatePassword(),
      generated: !provided,
    });
  });

  // Cek email yang sudah ada di database (sekali query, bukan per baris).
  if (prepared.length > 0) {
    const existing = await prisma.user.findMany({
      where: { email: { in: prepared.map((p) => p.data.email) } },
      select: { email: true },
    });
    const existingSet = new Set(existing.map((u) => u.email));
    rows.slice(1).forEach((row, idx) => {
      const email = cell(row, "email").toLowerCase();
      const alreadyFlagged = errors.some((e) => e.row === idx + 2);
      if (!alreadyFlagged && existingSet.has(email)) {
        errors.push({ row: idx + 2, email, error: "Email sudah terdaftar" });
      }
    });
  }

  if (errors.length > 0) {
    errors.sort((a, b) => a.row - b.row);
    return NextResponse.json(
      { error: `${errors.length} baris bermasalah. Tidak ada user yang dibuat.`, errors },
      { status: 400 }
    );
  }

  const hashes: string[] = [];
  for (const p of prepared) hashes.push(await bcrypt.hash(p.password, BCRYPT_ROUNDS));

  try {
    await prisma.user.createMany({
      data: prepared.map((p, i) => ({
        ...p.data,
        role: p.data.role as any,
        discipline: p.data.discipline as any,
        position: p.data.position as any,
        passwordHash: hashes[i],
      })),
    });
  } catch (e) {
    if (isUniqueViolation(e)) {
      return NextResponse.json(
        { error: "Ada email yang baru saja didaftarkan pihak lain. Coba import ulang." },
        { status: 409 }
      );
    }
    throw e;
  }

  return NextResponse.json(
    {
      created: prepared.length,
      users: prepared.map((p) => ({
        name: p.data.name,
        email: p.data.email,
        role: p.data.role,
        // Hanya password yang digenerate sistem yang dikembalikan; yang diisi admin tidak diulang.
        temporaryPassword: p.generated ? p.password : undefined,
      })),
    },
    { status: 201 }
  );
}
