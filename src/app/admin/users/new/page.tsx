import Link from "next/link";
import { UserForm } from "@/components/UserForm";

export default function NewUserPage() {
  return (
    <div className="max-w-md">
      <Link href="/admin/users" className="text-sm text-ink-mute hover:text-ink">
        &larr; Daftar user
      </Link>
      <h1 className="page-title mt-3 mb-6">Tambah User</h1>
      <UserForm />
    </div>
  );
}
