import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BCRYPT_ROUNDS, validatePassword } from "@/lib/users";

// POST: ganti password sendiri (semua role). Wajib menyertakan password lama supaya
// sesi yang tertinggal di komputer orang lain tidak bisa dipakai membajak akun.
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const currentPassword = body && typeof body.currentPassword === "string" ? body.currentPassword : "";
  const newPassword = body && typeof body.newPassword === "string" ? body.newPassword : "";

  if (!currentPassword) {
    return NextResponse.json({ error: "Password saat ini wajib diisi" }, { status: 400 });
  }
  const pwError = validatePassword(newPassword);
  if (pwError) return NextResponse.json({ error: pwError }, { status: 400 });
  if (newPassword === currentPassword) {
    return NextResponse.json({ error: "Password baru harus berbeda dari password saat ini" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || !user.isActive) {
    return NextResponse.json({ error: "Akun tidak ditemukan" }, { status: 404 });
  }

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) return NextResponse.json({ error: "Password saat ini salah" }, { status: 400 });

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await bcrypt.hash(newPassword, BCRYPT_ROUNDS) },
  });

  return NextResponse.json({ ok: true });
}
