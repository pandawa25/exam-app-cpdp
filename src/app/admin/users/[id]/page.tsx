import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserForm } from "@/components/UserForm";
import { UserDangerZone } from "@/components/UserDangerZone";

export const dynamic = "force-dynamic";

export default async function EditUserPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const user = await prisma.user.findUnique({ where: { id: params.id } });
  if (!user) notFound();

  const attemptCount = await prisma.examAttempt.count({ where: { userId: user.id } });

  return (
    <div className="max-w-md">
      <Link href="/admin/users" className="text-sm text-slate-500 hover:text-slate-800">
        &larr; Daftar user
      </Link>
      <h1 className="text-xl font-semibold mt-3 mb-6">Edit User</h1>
      <UserForm
        user={{
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          discipline: user.discipline,
          position: user.position,
          department: user.department,
        }}
      />
      <UserDangerZone
        id={user.id}
        name={user.name}
        isActive={user.isActive}
        isSelf={session?.user.id === user.id}
        attemptCount={attemptCount}
      />
    </div>
  );
}
