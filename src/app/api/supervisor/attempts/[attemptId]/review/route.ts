import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

// PATCH: supervisor approve hasil (set status REVIEWED), opsional override
// skor/passed (misal attempt AUTO_SUBMITTED karena pelanggaran ternyata
// setelah dicek videonya cuma notifikasi OS, bukan nyontek - supervisor bisa
// tetap approve dengan skor yang sudah dihitung) dan tambahkan catatan.
export async function PATCH(req: Request, { params }: { params: { attemptId: string } }) {
  const session = await requireRole(["SUPERVISOR"]);
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { overrideScore, overridePassed, reviewNote } = body;

  const attempt = await prisma.examAttempt.findUnique({ where: { id: params.attemptId } });
  if (!attempt) return NextResponse.json({ error: "Attempt tidak ditemukan" }, { status: 404 });
  if (attempt.status === "IN_PROGRESS") {
    return NextResponse.json({ error: "Attempt masih berjalan, belum bisa direview" }, { status: 400 });
  }

  const updated = await prisma.examAttempt.update({
    where: { id: params.attemptId },
    data: {
      status: "REVIEWED",
      reviewedById: session.user.id,
      reviewedAt: new Date(),
      reviewNote: reviewNote ?? null,
      score: typeof overrideScore === "number" ? overrideScore : undefined,
      passed: typeof overridePassed === "boolean" ? overridePassed : undefined,
    },
  });

  return NextResponse.json(updated);
}
