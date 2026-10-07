import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const statusLabel: Record<string, string> = {
  SUBMITTED: "Selesai",
  AUTO_SUBMITTED: "Auto-submit (waktu habis / pelanggaran)",
  REVIEWED: "Sudah direview supervisor",
};

export default async function ResultPage({ params }: { params: { attemptId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const attempt = await prisma.examAttempt.findUnique({
    where: { id: params.attemptId },
    include: { exam: true, violations: true },
  });
  if (!attempt || attempt.userId !== session.user.id) redirect("/peserta/exams");

  if (attempt.status === "IN_PROGRESS") {
    redirect(`/peserta/exams/${attempt.examId}/attempt`);
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 text-center">
      <h1 className="font-semibold text-lg mb-1">{attempt.exam.title}</h1>
      <p className="text-sm text-slate-500 mb-6">{statusLabel[attempt.status]}</p>

      <div className="text-4xl font-bold mb-1 text-slate-900">{attempt.score ?? "-"}</div>
      <p className="text-sm text-slate-500 mb-4">dari passing score {attempt.exam.passingScore}</p>

      {attempt.passed !== null && (
        <span
          className={`inline-block text-sm font-medium rounded-full px-4 py-1 ${
            attempt.passed ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
          }`}
        >
          {attempt.passed ? "LULUS" : "BELUM LULUS"}
        </span>
      )}

      {attempt.violations.length > 0 && (
        <p className="text-xs text-amber-600 mt-4">
          Tercatat {attempt.violations.length} pelanggaran selama ujian - hasil akan direview supervisor.
        </p>
      )}
      {attempt.reviewNote && (
        <p className="text-sm text-slate-600 mt-4 border-t border-slate-100 pt-4">
          Catatan supervisor: {attempt.reviewNote}
        </p>
      )}
    </div>
  );
}
