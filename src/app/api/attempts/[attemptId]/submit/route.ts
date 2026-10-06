import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAttemptDeadline, GRACE_PERIOD_MS } from "@/lib/deadline";
import { finalizeAttempt } from "@/lib/scoring";

// POST: submit manual oleh peserta (klik tombol "Selesai Ujian").
// Validasi ulang waktu di server - submit lewat waktu (di luar grace period) ditolak,
// kasus itu seharusnya sudah ditangani oleh heartbeat (auto-submit).
export async function POST(_req: Request, { params }: { params: { attemptId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "PESERTA") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const attempt = await prisma.examAttempt.findUnique({
    where: { id: params.attemptId },
    include: { exam: true },
  });
  if (!attempt || attempt.userId !== session.user.id) {
    return NextResponse.json({ error: "Attempt tidak ditemukan" }, { status: 404 });
  }
  if (attempt.status !== "IN_PROGRESS") {
    return NextResponse.json(attempt); // sudah submitted sebelumnya, idempotent
  }

  const deadline = getAttemptDeadline(attempt, attempt.exam);
  const status = Date.now() > deadline.getTime() + GRACE_PERIOD_MS ? "AUTO_SUBMITTED" : "SUBMITTED";

  const result = await finalizeAttempt(attempt.id, status);
  return NextResponse.json(result);
}
