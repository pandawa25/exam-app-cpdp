import Link from "next/link";
import { LogoutButton } from "@/components/LogoutButton";

export function AccountLinks() {
  return (
    <span className="flex items-center gap-4 text-sm">
      <Link href="/akun/password" className="text-slate-500 hover:text-slate-800">
        Ganti Password
      </Link>
      <LogoutButton />
    </span>
  );
}
