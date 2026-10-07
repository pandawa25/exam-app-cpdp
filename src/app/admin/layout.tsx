import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AdminNav } from "@/components/AdminNav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  return (
    <div className="md:flex md:min-h-screen">
      <AdminNav name={session?.user.name ?? ""} email={session?.user.email ?? ""} />
      <main className="min-w-0 flex-1 px-5 py-7 md:px-10 md:py-10">
        <div className="mx-auto max-w-5xl">{children}</div>
      </main>
    </div>
  );
}
