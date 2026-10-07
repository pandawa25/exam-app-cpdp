import { randomInt } from "crypto";
import { DISCIPLINES, POSITIONS, ROLES, MIN_PASSWORD_LENGTH } from "@/lib/constants";

// Server-only (memakai crypto Node). Komponen client import ROLES/MIN_PASSWORD_LENGTH dari constants.ts.
export { ROLES, MIN_PASSWORD_LENGTH };
export const BCRYPT_ROUNDS = 10;

export type UserRole = "ADMIN" | "SUPERVISOR" | "PESERTA";

export type UserInput = {
  name: string;
  email: string;
  role: UserRole;
  discipline: string | null;
  position: string | null;
  department: string | null;
};

type Option = { readonly value: string; readonly label: string };

const normalize = (s: string) => s.trim().toLowerCase().replace(/[\s-]+/g, "_");

/**
 * Cocokkan input bebas ke value enum: terima value ("TEKNISI_SENIOR"), label
 * ("Teknisi Senior"), atau variasi huruf besar/kecil. Berguna untuk import CSV
 * yang diketik manual di Excel.
 */
export function matchOption(raw: unknown, options: readonly Option[]): string | null {
  if (typeof raw !== "string" || !raw.trim()) return null;
  const norm = normalize(raw);
  for (const o of options) {
    if (normalize(o.value) === norm || normalize(o.label) === norm) return o.value;
  }
  return null;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type ValidationResult = { ok: true; data: UserInput } | { ok: false; error: string };

/** Validasi + normalisasi data user. Dipakai API create, edit, dan import CSV. */
export function validateUserInput(raw: Record<string, unknown>): ValidationResult {
  const name = typeof raw.name === "string" ? raw.name.trim() : "";
  if (!name) return { ok: false, error: "Nama wajib diisi" };

  const email = typeof raw.email === "string" ? raw.email.trim().toLowerCase() : "";
  if (!EMAIL_RE.test(email)) return { ok: false, error: "Format email tidak valid" };

  const role = matchOption(raw.role, ROLES) as UserRole | null;
  if (!role) return { ok: false, error: "Role harus ADMIN, SUPERVISOR, atau PESERTA" };

  let discipline: string | null = null;
  let position: string | null = null;
  if (role === "PESERTA") {
    discipline = matchOption(raw.discipline, DISCIPLINES);
    position = matchOption(raw.position, POSITIONS);
    if (!discipline) return { ok: false, error: "Peserta wajib punya disiplin yang valid" };
    if (!position) return { ok: false, error: "Peserta wajib punya jabatan yang valid" };
  }

  const department =
    typeof raw.department === "string" && raw.department.trim() ? raw.department.trim() : null;

  return { ok: true, data: { name, email, role, discipline, position, department } };
}

export function validatePassword(password: unknown): string | null {
  if (typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH) {
    return `Password minimal ${MIN_PASSWORD_LENGTH} karakter`;
  }
  return null;
}

/** Password acak tanpa karakter yang mudah tertukar (0/O, 1/l/I). */
export function generatePassword(length = 10): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < length; i++) out += chars[randomInt(chars.length)];
  return out;
}

export function isUniqueViolation(e: unknown): boolean {
  return typeof e === "object" && e !== null && (e as { code?: string }).code === "P2002";
}
