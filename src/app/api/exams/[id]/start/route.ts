import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { startOrResumeAttempt } from "@/lib/startAttempt";

// POST: peserta mulai/melanjutkan exam. Logic inti ada di lib/startAttempt.ts
// supaya sama persis dengan yang dipakai halaman server component attempt.
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "PESERTA") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const result = await startOrResumeAttempt(
    params.id,
    session.user.id,
    session.user.discipline,
    session.user.position
  );

  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ attemptId: result.attemptId });
}
