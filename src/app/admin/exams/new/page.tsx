import { prisma } from "@/lib/prisma";
import { NewExamForm } from "@/components/NewExamForm";

export const dynamic = "force-dynamic";

export default async function NewExamPage() {
  const banks = await prisma.questionBank.findMany({
    include: { _count: { select: { questions: true } } },
    orderBy: [{ discipline: "asc" }, { position: "asc" }, { name: "asc" }],
  });

  return (
    <div className="max-w-xl">
      <h1 className="page-title mb-6">Ujian Baru</h1>
      <NewExamForm banks={banks} />
    </div>
  );
}
