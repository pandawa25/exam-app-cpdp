import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { disciplineLabel, positionLabel } from "@/lib/constants";
import { AddQuestionForm } from "@/components/AddQuestionForm";

export default async function QuestionBankDetailPage({ params }: { params: { id: string } }) {
  const bank = await prisma.questionBank.findUnique({
    where: { id: params.id },
    include: { questions: { orderBy: { createdAt: "asc" } } },
  });
  if (!bank) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">{bank.name}</h1>
        <p className="text-sm text-slate-500">
          {disciplineLabel(bank.discipline)} &middot; {positionLabel(bank.position)} &middot; {bank.questions.length} soal
        </p>
      </div>

      <AddQuestionForm bankId={bank.id} />

      <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
        {bank.questions.length === 0 && (
          <p className="p-6 text-sm text-slate-500">Belum ada soal di bank ini.</p>
        )}
        {bank.questions.map((q, i) => (
          <div key={q.id} className="p-4">
            <p className="font-medium text-slate-900 mb-2">
              {i + 1}. {q.text} <span className="text-xs text-slate-400">({q.points} poin)</span>
            </p>
            <ul className="text-sm text-slate-600 space-y-1 pl-4">
              {[
                ["A", q.optionA],
                ["B", q.optionB],
                ["C", q.optionC],
                ["D", q.optionD],
              ].map(([label, text]) => (
                <li key={label} className={label === q.correctOption ? "text-green-700 font-medium" : ""}>
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
