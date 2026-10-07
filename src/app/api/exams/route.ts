import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { visibleExamsWhere } from "@/lib/examAccess";

// GET: daftar exam.
// - ADMIN: semua exam (untuk dashboard kelola).
// - PESERTA: hanya exam PUBLISHED yang disiplin & jabatannya cocok dengan profil
//   peserta, dan masih dalam jendela waktu opensAt/closesAt. Ini inti dari
//   "soal muncul sesuai disiplin dan jabatan" - difilter di query, bukan di client.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.user.role === "ADMIN") {
    const exams = await prisma.exam.findMany({
      include: { _count: { select: { attempts: true } }, questionBank: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(exams);
  }

  if (session.user.role === "PESERTA") {
    const now = new Date();
    const where = visibleExamsWhere(session.user, now);
    if (!where) return NextResponse.json([]);
    const exams = await prisma.exam.findMany({
      where,
      include: {
        attempts: { where: { userId: session.user.id } },
      },
      orderBy: { opensAt: "asc" },
    });
    return NextResponse.json(exams);
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

// POST: admin membuat exam baru dari satu question bank.
// discipline & position exam diambil otomatis dari question bank yang dipilih,
// supaya tidak mungkin admin salah set exam utk kombinasi yang bank-nya tidak ada.
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { title, questionBankId, questionCount, durationMin, passingScore, opensAt, closesAt } = body;

  if (!title || !questionBankId || !questionCount || !durationMin || !passingScore || !opensAt || !closesAt) {
    return NextResponse.json({ error: "Semua field wajib diisi" }, { status: 400 });
  }

  const bank = await prisma.questionBank.findUnique({
    where: { id: questionBankId },
    include: { _count: { select: { questions: true } } },
  });
  if (!bank) return NextResponse.json({ error: "Bank soal tidak ditemukan" }, { status: 404 });
  if (bank._count.questions < questionCount) {
    return NextResponse.json(
      { error: `Bank soal cuma punya ${bank._count.questions} soal, kurang dari questionCount (${questionCount})` },
      { status: 400 }
    );
  }

  const exam = await prisma.exam.create({
    data: {
      title,
      questionBankId,
      discipline: bank.discipline,
      position: bank.position,
      questionCount,
      durationMin,
      passingScore,
      opensAt: new Date(opensAt),
      closesAt: new Date(closesAt),
      status: "DRAFT",
    },
  });

  return NextResponse.json(exam, { status: 201 });
}
