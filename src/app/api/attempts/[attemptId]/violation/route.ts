import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { VIOLATION_THRESHOLD } from "@/lib/deadline";
import { finalizeAttempt } from "@/lib/scoring";

// POST: catat satu pelanggaran (tab-switch / fullscreen-exit / copy-paste).
// Tidak langsung memblokir di pelanggaran pertama - cuma dicatat sebagai audit
// trail untuk supervisor. Auto-submit baru terjadi kalau total pelanggaran
// attempt ini sudah >= VIOLATION_THRESHOLD. Lihat skill reference anti-cheat.md
// untuk alasan desain ini (mengurangi false positive).
export async function POST(req: Request, { params }: { params: { attemptId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "PESERTA") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { type } = await req.json();
  if (!["TAB_SWITCH", "FULLSCREEN_EXIT", "COPY_PASTE"].includes(type)) {
    return NextResponse.json({ error: "type tidak valid" }, { status: 400 });
  }

  const attempt = await prisma.examAttempt.findUnique({ where: { id: params.attemptId } });
  if (!attempt || attempt.userId !== session.user.id) {
    return NextResponse.json({ error: "Attempt tidak ditemukan" }, { status: 404 });
  }
  if (attempt.status !== "IN_PROGRESS") {
    return NextResponse.json({ ok: true, status: attempt.status });
  }

  await prisma.violationLog.create({
    data: { attemptId: attempt.id, type },
  });

  const violationCount = await prisma.violationLog.count({ where: { attemptId: attempt.id } });

  if (violationCount >= VIOLATION_THRESHOLD) {
    const finalized = await finalizeAttempt(attempt.id, "AUTO_SUBMITTED");
    return NextResponse.json({
      ok: true,
      violationCount,
      threshold: VIOLATION_THRESHOLD,
      autoSubmitted: true,
      attempt: finalized,
    });
  }

  return NextResponse.json({
    ok: true,
    violationCount,
    threshold: VIOLATION_THRESHOLD,
    autoSubmitted: false,
  });
}
