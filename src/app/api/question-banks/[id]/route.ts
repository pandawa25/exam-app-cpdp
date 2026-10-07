import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

// DELETE: hapus bank soal beserta soalnya. Ditolak kalau masih dipakai exam
// (hapus/ubah exam-nya dulu), supaya riwayat ujian tidak kehilangan soalnya.
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await requireRole(["ADMIN"]);
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const bank = await prisma.questionBank.findUnique({
    where: { id: params.id },
    include: { _count: { select: { exams: true } } },
  });
  if (!bank) return NextResponse.json({ error: "Bank soal tidak ditemukan" }, { status: 404 });

  if (bank._count.exams > 0) {
    return NextResponse.json(
      { error: `Bank soal ini dipakai ${bank._count.exams} exam. Hapus exam tersebut dulu.` },
      { status: 409 }
    );
  }

  await prisma.questionBank.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
