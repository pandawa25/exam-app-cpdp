import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import type { Prisma, Role, Discipline, Position } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import {
  BCRYPT_ROUNDS,
  isUniqueViolation,
  validatePassword,
  validateUserInput,
} from "@/lib/users";

const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  discipline: true,
  position: true,
  department: true,
  isActive: true,
} as const;

/** True kalau setelah perubahan ini TIDAK ada lagi admin aktif selain user ini. */
async function wouldRemoveLastAdmin(userId: string) {
  const others = await prisma.user.count({
    where: { role: "ADMIN", isActive: true, id: { not: userId } },
  });
  return others === 0;
}

// PATCH: edit data user, reset password (newPassword), atau aktif/nonaktifkan (isActive).
// Field yang tidak dikirim dipertahankan dari data lama.
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await requireRole(["ADMIN"]);
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Body tidak valid" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });

  const merged = {
    name: "name" in body ? body.name : existing.name,
    email: "email" in body ? body.email : existing.email,
    role: "role" in body ? body.role : existing.role,
    discipline: "discipline" in body ? body.discipline : existing.discipline,
    position: "position" in body ? body.position : existing.position,
    department: "department" in body ? body.department : existing.department,
  };
  const parsed = validateUserInput(merged);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const isSelf = params.id === session.user.id;
  const deactivating = body.isActive === false;
  const losingAdmin = existing.role === "ADMIN" && parsed.data.role !== "ADMIN";

  if (isSelf && (deactivating || losingAdmin)) {
    return NextResponse.json(
      { error: "Anda tidak bisa menonaktifkan atau menurunkan role akun Anda sendiri" },
      { status: 400 }
    );
  }
  if (existing.role === "ADMIN" && (deactivating || losingAdmin) && (await wouldRemoveLastAdmin(existing.id))) {
    return NextResponse.json({ error: "Harus tersisa minimal satu admin aktif" }, { status: 400 });
  }

  const data: Prisma.UserUpdateInput = {
    name: parsed.data.name,
    email: parsed.data.email,
    department: parsed.data.department,
    role: parsed.data.role as Role,
    discipline: parsed.data.discipline as Discipline | null,
    position: parsed.data.position as Position | null,
  };
  if (typeof body.isActive === "boolean") data.isActive = body.isActive;

  if (typeof body.newPassword === "string" && body.newPassword !== "") {
    const pwError = validatePassword(body.newPassword);
    if (pwError) return NextResponse.json({ error: pwError }, { status: 400 });
    data.passwordHash = await bcrypt.hash(body.newPassword, BCRYPT_ROUNDS);
  }

  try {
    const user = await prisma.user.update({
      where: { id: params.id },
      data,
      select: publicUserSelect,
    });
    return NextResponse.json(user);
  } catch (e) {
    if (isUniqueViolation(e)) {
      return NextResponse.json({ error: "Email sudah dipakai user lain" }, { status: 409 });
    }
    throw e;
  }
}

// DELETE: hapus permanen. Hanya untuk user yang belum punya riwayat ujian (salah input,
// akun percobaan). User yang sudah pernah ujian harus dinonaktifkan, supaya hasil ujiannya tidak hilang.
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await requireRole(["ADMIN"]);
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (params.id === session.user.id) {
    return NextResponse.json({ error: "Anda tidak bisa menghapus akun Anda sendiri" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });

  if (existing.role === "ADMIN" && (await wouldRemoveLastAdmin(existing.id))) {
    return NextResponse.json({ error: "Harus tersisa minimal satu admin aktif" }, { status: 400 });
  }

  const attempts = await prisma.examAttempt.count({ where: { userId: params.id } });
  if (attempts > 0) {
    return NextResponse.json(
      { error: "User ini sudah punya riwayat ujian dan tidak bisa dihapus. Nonaktifkan saja." },
      { status: 409 }
    );
  }

  await prisma.user.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
