import Link from "next/link";
import { ImportUsersForm } from "@/components/ImportUsersForm";

export default function ImportUsersPage() {
  return (
    <div className="max-w-3xl">
      <Link href="/admin/users" className="text-sm text-slate-500 hover:text-slate-800">
        &larr; Daftar user
      </Link>
      <h1 className="text-xl font-semibold mt-3 mb-6">Import User dari CSV</h1>
      <ImportUsersForm />
    </div>
  );
}
