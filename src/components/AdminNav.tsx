import Link from "next/link";
import { LogoutButton } from "@/components/LogoutButton";

export function AdminNav() {
  return (
    <nav className="border-b border-slate-200 bg-white px-6 py-3 flex items-center gap-6 text-sm">
      <span className="font-semibold text-slate-900">Admin</span>
      <Link href="/admin/question-banks" className="text-slate-600 hover:text-brand-700">
        Bank Soal
      </Link>
      <Link href="/admin/exams" className="text-slate-600 hover:text-brand-700">
        Exam
      </Link>
      <span className="ml-auto">
        <LogoutButton />
      </span>
    </nav>
  );
}
