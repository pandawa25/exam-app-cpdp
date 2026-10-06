import { prisma } from "@/lib/prisma";
import { NewExamForm } from "@/components/NewExamForm";

export default async function NewExamPage() {
  const banks = await prisma.questionBank.findMany({
    include: { _count: { select: { questions: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-xl">
      <h1 className="text-xl font-semibold mb-6">Exam Baru</h1>
      <NewExamForm banks={banks} />
    </div>
  );
}
