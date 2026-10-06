import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { disciplineLabel, positionLabel } from "@/lib/constants";

export default async function QuestionBanksPage() {
  const banks = await prisma.questionBank.findMany({
    include: { _count: { select: { questions: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Bank Soal</h1>
        <Link
          href="/admin/question-banks/new"
          className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg px-4 py-2"
        >
          + Bank Soal Baru
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
        {banks.length === 0 && (
          <p className="p-6 text-sm text-slate-500">Belum ada bank soal. Buat satu per disiplin + jabatan.</p>
        )}
        {banks.map((bank) => (
          <Link
            key={bank.id}
            href={`/admin/question-banks/${bank.id}`}
            className="flex items-center justify-between px-6 py-4 hover:bg-slate-50"
          >
            <div>
              <p className="font-medium text-slate-900">{bank.name}</p>
              <p className="text-sm text-slate-500">
                {disciplineLabel(bank.discipline)} &middot; {positionLabel(bank.position)}
              </p>
            </div>
            <span className="text-sm text-slate-500">{bank._count.questions} soal</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
