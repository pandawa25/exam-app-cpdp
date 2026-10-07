import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { disciplineLabel, positionLabel } from "@/lib/constants";
import { ExamStatusActions } from "@/components/ExamStatusActions";

export const dynamic = "force-dynamic";

const statusLabel: Record<string, string> = {
  DRAFT: "Draft",
  PUBLISHED: "Published",
  CLOSED: "Ditutup",
};

export default async function AdminExamsPage() {
  const exams = await prisma.exam.findMany({
    include: { questionBank: true, _count: { select: { attempts: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Exam</h1>
        <Link
          href="/admin/exams/new"
          className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg px-4 py-2"
        >
          + Exam Baru
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
        {exams.length === 0 && <p className="p-6 text-sm text-slate-500">Belum ada exam.</p>}
        {exams.map((exam) => (
          <div key={exam.id} className="flex items-center justify-between px-6 py-4">
            <div>
              <p className="font-medium text-slate-900">{exam.title}</p>
              <p className="text-sm text-slate-500">
                {disciplineLabel(exam.discipline)} &middot; {positionLabel(exam.position)} &middot;{" "}
                {exam.questionCount} soal &middot; {exam.durationMin} menit &middot; {exam._count.attempts} peserta
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                {statusLabel[exam.status]} &middot; Buka {exam.opensAt.toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })} - Tutup{" "}
                {exam.closesAt.toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })} WIB
              </p>
            </div>
            <ExamStatusActions examId={exam.id} status={exam.status} />
          </div>
        ))}
      </div>
    </div>
  );
}
