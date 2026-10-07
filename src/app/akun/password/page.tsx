import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { ChangePasswordForm } from "@/components/ChangePasswordForm";

export const dynamic = "force-dynamic";

export default async function ChangePasswordPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <main className="max-w-md mx-auto px-4 py-8">
      <Link href="/post-login" className="text-sm text-slate-500 hover:text-slate-800">
        &larr; Kembali
      </Link>
      <h1 className="text-xl font-semibold mt-3 mb-1">Ganti Password</h1>
      <p className="text-sm text-slate-500 mb-6">{session.user.email}</p>
      <ChangePasswordForm />
    </main>
  );
}
