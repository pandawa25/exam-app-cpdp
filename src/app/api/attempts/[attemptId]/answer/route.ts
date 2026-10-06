import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAttemptDeadline, GRACE_PERIOD_MS } from "@/lib/deadline";

// POST: auto-save satu jawaban. Dipanggil tiap peserta pilih opsi (bukan
// nunggu submit akhir) supaya jawaban tidak hilang kalau browser crash/koneksi putus.
export async function POST(req: Request, { params }: { params: { attemptId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "PESERTA") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { questionId, selectedOption } = await req.json();
  if (!questionId || !["A", "B", "C", "D"].includes(selectedOption)) {
    return NextResponse.json({ error: "questionId & selectedOption (A-D) wajib" }, { status: 400 });
  }

  const attempt = await prisma.examAttempt.findUnique({
    where: { id: params.attemptId },
    include: { exam: true },
  });
  if (!attempt || attempt.userId !== session.user.id) {
    return NextResponse.json({ error: "Attempt tidak ditemukan" }, { status: 404 });
  }
  if (attempt.status !== "IN_PROGRESS") {
    return NextResponse.json({ error: "Attempt sudah berakhir, jawaban tidak bisa diubah" }, { status: 400 });
  }

  // Validasi ulang waktu di server - cegah jawab lewat API call manual setelah waktu habis.
  const deadline = getAttemptDeadline(attempt, attempt.exam);
  if (Date.now() > deadline.getTime() + GRACE_PERIOD_MS) {
    return NextResponse.json({ error: "Waktu sudah habis" }, { status: 400 });
  }

  await prisma.attemptAnswer.update({
    where: { attemptId_questionId: { attemptId: attempt.id, questionId } },
    data: { selectedOption, answeredAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
