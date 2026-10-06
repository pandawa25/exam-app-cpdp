import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

// Satu titik redirect setelah login sukses, supaya logic "role ini ke mana"
// tidak diduplikasi di form login maupun tempat lain.
export default async function PostLoginPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  switch (session.user.role) {
    case "ADMIN":
      redirect("/admin/exams");
    case "PESERTA":
      redirect("/peserta/exams");
    case "SUPERVISOR":
      redirect("/supervisor/review");
    default:
      redirect("/login");
  }
}
