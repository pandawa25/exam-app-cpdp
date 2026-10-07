import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

// PATCH: publish atau close exam. Hanya transisi status, field lain tidak
// bisa diubah lagi setelah DRAFT (hindari admin edit exam yang sudah berjalan
// sementara ada peserta mengerjakan).
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await requireRole(["ADMIN"]);
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { status } = await req.json();
  if (!["PUBLISHED", "CLOSED"].includes(status)) {
    return NextResponse.json({ error: "status harus PUBLISHED atau CLOSED" }, { status: 400 });
  }

  const exam = await prisma.exam.update({
    where: { id: params.id },
    data: { status },
  });

  return NextResponse.json(exam);
}

// DELETE: hapus exam. Exam yang sudah punya hasil ujian hanya dihapus kalau ?force=1
// (hasil ujian ikut terhapus permanen) - UI selalu menampilkan jumlahnya di konfirmasi.
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await requireRole(["ADMIN"]);
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const exam = await prisma.exam.findUnique({
    where: { id: params.id },
    include: { _count: { select: { attempts: true } } },
  });
  if (!exam) return NextResponse.json({ error: "Ujian tidak ditemukan" }, { status: 404 });

  const force = new URL(req.url).searchParams.get("force") === "1";
  if (exam._count.attempts > 0 && !force) {
    return NextResponse.json(
      { error: `Ujian ini punya ${exam._count.attempts} hasil ujian. Konfirmasi ulang untuk menghapusnya beserta hasil.` },
      { status: 409 }
    );
  }

  // Jawaban dan log pelanggaran ikut terhapus lewat cascade dari attempt.
  await prisma.$transaction([
    prisma.examAttempt.deleteMany({ where: { examId: params.id } }),
    prisma.exam.delete({ where: { id: params.id } }),
  ]);
  return NextResponse.json({ ok: true });
}
