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
