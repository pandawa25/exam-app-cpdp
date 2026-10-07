import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { startOrResumeAttempt } from "@/lib/startAttempt";
import { ExamRunner } from "@/components/ExamRunner";
import { AppHeader } from "@/components/AppHeader";

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
      <>
        <AppHeader />
        <main className="mx-auto max-w-xl px-4 py-8">
          <div className="card p-6">
            <h1 className="section-title">Ujian tidak bisa dimulai</h1>
            <p role="alert" className="notice notice-alarm mt-3">
              {result.error}
            </p>
            <Link href="/peserta/exams" className="btn btn-secondary mt-5">
              Kembali ke daftar exam
            </Link>
          </div>
        </main>
      </>
    );
  }

  return <ExamRunner attemptId={result.attemptId} />;
}
