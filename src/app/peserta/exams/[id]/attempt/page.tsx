import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { startOrResumeAttempt } from "@/lib/startAttempt";
import { ExamRunner } from "@/components/ExamRunner";

export default async function AttemptPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "PESERTA") redirect("/login");

  const result = await startOrResumeAttempt(
    params.id,
    session.user.id,
    session.user.discipline,
    session.user.position
  );

  if (!result.ok) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <p className="text-sm text-red-600">{result.error}</p>
      </div>
    );
  }

  return <ExamRunner attemptId={result.attemptId} />;
}
