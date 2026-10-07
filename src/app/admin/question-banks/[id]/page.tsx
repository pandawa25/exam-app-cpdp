import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { disciplineLabel, positionLabel } from "@/lib/constants";
import { AddQuestionForm } from "@/components/AddQuestionForm";
import { DeleteButton } from "@/components/DeleteButton";

export const dynamic = "force-dynamic";

export default async function QuestionBankDetailPage({ params }: { params: { id: string } }) {
  const bank = await prisma.questionBank.findUnique({
    where: { id: params.id },
    include: { questions: { orderBy: { createdAt: "asc" } }, _count: { select: { exams: true } } },
  });
  if (!bank) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="page-title">{bank.name}</h1>
          <p className="text-sm text-ink-mute">
            {disciplineLabel(bank.discipline)} &middot; {positionLabel(bank.position)} &middot; {bank.questions.length} soal
          </p>
        </div>
        <DeleteButton
          url={`/api/question-banks/${bank.id}`}
          label="Hapus bank soal"
          confirmText={`Hapus bank soal "${bank.name}" beserta ${bank.questions.length} soalnya? Tidak bisa dibatalkan.`}
          redirectTo="/admin/question-banks"
          disabled={bank._count.exams > 0}
          disabledReason={`Dipakai ${bank._count.exams} ujian - hapus ujiannya dulu`}
        />
      </div>
      {bank._count.exams > 0 && (
        <p className="-mt-3 text-xs text-ink-mute">
          Bank ini dipakai {bank._count.exams} ujian, jadi belum bisa dihapus. Hapus ujiannya dulu di menu Ujian.
        </p>
      )}

      <AddQuestionForm bankId={bank.id} />

      <div className="bg-panel-raised rounded-card border border-panel-line divide-y divide-panel-line">
        {bank.questions.length === 0 && (
          <p className="p-6 text-sm text-ink-mute">Belum ada soal di bank ini.</p>
        )}
        {bank.questions.map((q, i) => (
          <div key={q.id} className="p-4">
            <p className="font-medium text-ink mb-2">
              {i + 1}. {q.text} <span className="text-xs text-ink-mute">({q.points} poin)</span>
            </p>
            <ul className="text-sm text-ink-soft space-y-1 pl-4">
              {[
                ["A", q.optionA],
                ["B", q.optionB],
                ["C", q.optionC],
                ["D", q.optionD],
              ].map(([label, text]) => (
                <li key={label} className={label === q.correctOption ? "text-ok font-medium" : ""}>
                  {label}. {text} {label === q.correctOption && "✓"}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
