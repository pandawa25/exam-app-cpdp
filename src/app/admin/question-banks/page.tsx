import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { disciplineLabel, positionLabel } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function QuestionBanksPage() {
  const banks = await prisma.questionBank.findMany({
    include: { _count: { select: { questions: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="page-title">Bank Soal</h1>
        <Link
          href="/admin/question-banks/new"
          className="btn btn-primary"
        >
          Bank soal baru
        </Link>
      </div>

      <div className="bg-panel-raised rounded-card border border-panel-line divide-y divide-panel-line">
        {banks.length === 0 && (
          <p className="p-6 text-sm text-ink-mute">Belum ada bank soal. Buat satu per disiplin + jabatan.</p>
        )}
        {banks.map((bank) => (
          <Link
            key={bank.id}
            href={`/admin/question-banks/${bank.id}`}
            className="flex items-center justify-between px-6 py-4 hover:bg-panel-high"
          >
            <div>
              <p className="font-medium text-ink">{bank.name}</p>
              <p className="text-sm text-ink-mute">
                {disciplineLabel(bank.discipline)} &middot; {positionLabel(bank.position)}
              </p>
            </div>
            <span className="text-sm text-ink-mute">{bank._count.questions} soal</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
