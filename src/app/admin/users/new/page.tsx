import Link from "next/link";
import { UserForm } from "@/components/UserForm";

export default function NewUserPage() {
  return (
    <div className="max-w-md">
      <Link href="/admin/users" className="text-sm text-slate-500 hover:text-slate-800">
        &larr; Daftar user
      </Link>
      <h1 className="text-xl font-semibold mt-3 mb-6">Tambah User</h1>
      <UserForm />
    </div>
  );
}
