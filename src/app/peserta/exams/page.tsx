import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Daftar exam yang muncul SUDAH difilter sesuai disiplin & jabatan peserta
// (query di dalam fungsi ini, sama logic-nya dengan GET /api/exams tapi
// langsung lewat Prisma karena ini server component).
export default async function PesertaExamsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const now = new Date();
  const exams = await prisma.exam.findMany({
    where: {
      status: "PUBLISHED",
      discipline: session.user.discipline as any,
      position: session.user.position as any,
      opensAt: { lte: now },
      closesAt: { gte: now },
    },
    include: { attempts: { where: { userId: session.user.id } } },
    orderBy: { opensAt: "asc" },
  });

  return (
    <div>
      <h1 className="text-xl font-semibold mb-1">Exam Tersedia</h1>
      <p className="text-sm text-slate-500 mb-6">
        Halo {session.user.name} - menampilkan exam untuk disiplin & jabatan Anda.
      </p>

      <div className="space-y-3">
        {exams.length === 0 && (
          <p className="text-sm text-slate-500 bg-white border border-slate-200 rounded-xl p-6">
            Belum ada exam yang terbuka untuk Anda saat ini.
          </p>
        )}
        {exams.map((exam) => {
          const myAttempt = exam.attempts[0];
          return (
            <div key={exam.id} className="bg-white border border-slate-200 rounded-xl p-5">
              <p className="font-medium text-slate-900">{exam.title}</p>
              <p className="text-sm text-slate-500 mt-1">
                {exam.questionCount} soal &middot; {exam.durationMin} menit &middot; nilai lulus{" "}
                {exam.passingScore}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Tutup: {exam.closesAt.toLocaleString("id-ID")}
              </p>

              <div className="mt-3">
                {!myAttempt && (
                  <Link
                    href={`/peserta/exams/${exam.id}/attempt`}
                    className="inline-block bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg px-4 py-2"
                  >
                    Mulai Ujian
                  </Link>
                )}
                {myAttempt?.status === "IN_PROGRESS" && (
                  <Link
                    href={`/peserta/exams/${exam.id}/attempt`}
                    className="inline-block bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg px-4 py-2"
                  >
                    Lanjutkan Ujian
                  </Link>
                )}
                {myAttempt && myAttempt.status !== "IN_PROGRESS" && (
                  <Link
                    href={`/peserta/attempts/${myAttempt.id}/result`}
                    className="inline-block text-sm text-slate-600 hover:underline"
                  >
                    Lihat hasil ({myAttempt.status === "AUTO_SUBMITTED" ? "auto-submit" : "selesai"})
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
