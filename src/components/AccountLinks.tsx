import Link from "next/link";
import { LogoutButton } from "@/components/LogoutButton";

export function AccountLinks({ className = "flex items-center gap-4 text-sm" }: { className?: string }) {
  return (
    <span className={className}>
      <Link href="/akun/password" className="text-ink-soft hover:text-ink">
        Ganti Password
      </Link>
      <LogoutButton />
    </span>
  );
}
