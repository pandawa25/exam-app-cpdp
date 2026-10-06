import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

// GET: list bank soal (admin lihat semua, bisa difilter ?discipline=&position=)
export async function GET(req: Request) {
  const session = await requireRole(["ADMIN"]);
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const discipline = searchParams.get("discipline") ?? undefined;
  const position = searchParams.get("position") ?? undefined;

  const banks = await prisma.questionBank.findMany({
    where: {
      discipline: discipline ? (discipline as any) : undefined,
      position: position ? (position as any) : undefined,
    },
    include: { _count: { select: { questions: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(banks);
}

// POST: buat bank soal baru untuk kombinasi disiplin + jabatan tertentu
export async function POST(req: Request) {
  const session = await requireRole(["ADMIN"]);
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { name, discipline, position } = body;

  if (!name || !discipline || !position) {
    return NextResponse.json({ error: "name, discipline, position wajib diisi" }, { status: 400 });
  }

  const bank = await prisma.questionBank.create({
    data: { name, discipline, position },
  });

  return NextResponse.json(bank, { status: 201 });
}
