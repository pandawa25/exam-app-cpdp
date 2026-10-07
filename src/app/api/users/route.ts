import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import {
  BCRYPT_ROUNDS,
  generatePassword,
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
  createdAt: true,
} as const;

// GET: daftar user (admin). passwordHash TIDAK pernah ikut dikirim.
export async function GET() {
  const session = await requireRole(["ADMIN"]);
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const users = await prisma.user.findMany({
    select: publicUserSelect,
    orderBy: [{ role: "asc" }, { name: "asc" }],
  });
  return NextResponse.json(users);
}

// POST: admin membuat user baru. Kalau password dikosongkan, dibuatkan password acak
// dan dikembalikan SEKALI di response (temporaryPassword) supaya admin bisa menyerahkannya.
export async function POST(req: Request) {
  const session = await requireRole(["ADMIN"]);
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Body tidak valid" }, { status: 400 });
  }

  const parsed = validateUserInput(body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const provided = typeof body.password === "string" ? body.password : "";
  let password = provided;
  let temporaryPassword: string | undefined;
  if (!provided) {
    password = generatePassword();
    temporaryPassword = password;
  } else {
    const pwError = validatePassword(provided);
    if (pwError) return NextResponse.json({ error: pwError }, { status: 400 });
  }

  try {
    const user = await prisma.user.create({
      data: {
        ...parsed.data,
        role: parsed.data.role as any,
        discipline: parsed.data.discipline as any,
        position: parsed.data.position as any,
        passwordHash: await bcrypt.hash(password, BCRYPT_ROUNDS),
      },
      select: publicUserSelect,
    });
    return NextResponse.json({ ...user, temporaryPassword }, { status: 201 });
  } catch (e) {
    if (isUniqueViolation(e)) {
      return NextResponse.json({ error: "Email sudah terdaftar" }, { status: 409 });
    }
    throw e;
  }
}
