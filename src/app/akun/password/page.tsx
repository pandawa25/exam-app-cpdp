import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { ChangePasswordForm } from "@/components/ChangePasswordForm";
import { AppHeader } from "@/components/AppHeader";

export const dynamic = "force-dynamic";

export default async function ChangePasswordPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-md px-4 py-8">
        <Link href="/post-login" className="text-sm text-ink-mute hover:text-ink">
          &larr; Kembali
        </Link>
        <h1 className="page-title mt-3">Ganti password</h1>
        <p className="mb-6 mt-1 text-sm text-ink-mute">{session.user.email}</p>
        <ChangePasswordForm />
      </main>
    </>
  );
}
