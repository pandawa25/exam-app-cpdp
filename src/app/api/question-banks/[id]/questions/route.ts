import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

// GET: semua soal di satu bank (admin, untuk halaman edit bank soal)
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await requireRole(["ADMIN"]);
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const questions = await prisma.question.findMany({
    where: { questionBankId: params.id },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(questions);
}

// POST: tambah soal baru ke bank
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await requireRole(["ADMIN"]);
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { text, optionA, optionB, optionC, optionD, correctOption, points, imageUrl } = body;

  if (!text || !optionA || !optionB || !optionC || !optionD || !correctOption) {
    return NextResponse.json({ error: "Semua field soal & opsi wajib diisi" }, { status: 400 });
  }
  if (!["A", "B", "C", "D"].includes(correctOption)) {
    return NextResponse.json({ error: "correctOption harus A/B/C/D" }, { status: 400 });
  }

  const question = await prisma.question.create({
    data: {
      questionBankId: params.id,
      text,
      optionA,
      optionB,
      optionC,
      optionD,
      correctOption,
      points: points ?? 1,
      imageUrl,
    },
  });

  return NextResponse.json(question, { status: 201 });
}
