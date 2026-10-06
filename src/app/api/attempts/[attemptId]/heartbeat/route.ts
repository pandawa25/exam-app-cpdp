import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAttemptDeadline } from "@/lib/deadline";
import { finalizeAttempt } from "@/lib/scoring";

// GET: dipoll client tiap 10-15 detik selama mengerjakan ujian.
// Ini yang memastikan waktu habis SELALU memicu auto-submit di server,
// bahkan kalau peserta diam di tab tanpa interaksi apapun.
// Jangan poll tiap detik - endpoint ini bukan untuk presisi countdown,
// angka detik di UI cukup dihitung di client dari `deadline` yang dikirim sekali.
export async function GET(_req: Request, { params }: { params: { attemptId: string } }) {
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
    return NextResponse.json({ status: attempt.status, remainingMs: 0 });
  }

  const deadline = getAttemptDeadline(attempt, attempt.exam);
  const remainingMs = deadline.getTime() - Date.now();

  if (remainingMs <= 0) {
    const finalized = await finalizeAttempt(attempt.id, "AUTO_SUBMITTED");
    return NextResponse.json({ status: finalized?.status ?? "AUTO_SUBMITTED", remainingMs: 0 });
  }

  return NextResponse.json({ status: "IN_PROGRESS", remainingMs });
}
