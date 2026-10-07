import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { roleLabel } from "@/lib/constants";
import { Brand } from "@/components/Brand";
import { AccountLinks } from "@/components/AccountLinks";

// Header untuk peserta & supervisor (admin memakai sidebar). Sengaja TIDAK dipasang di
// layar ujian: tidak boleh ada tautan keluar/ganti password di tengah ujian berlangsung.
export async function AppHeader({ width = "max-w-3xl" }: { width?: string }) {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  return (
    <header className="sticky top-0 z-10 border-b border-panel-line bg-panel/75 backdrop-blur-md supports-[backdrop-filter]:bg-panel/60">
      <div className={`mx-auto flex items-center justify-between gap-4 px-4 py-3 ${width}`}>
        <Link href="/post-login" aria-label="Beranda">
          <Brand size={30} />
        </Link>
        <div className="flex items-center gap-5">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium leading-tight text-ink">{session.user.name}</p>
            <p className="text-xs text-ink-mute">{roleLabel(session.user.role)}</p>
          </div>
          <AccountLinks />
        </div>
      </div>
    </header>
  );
}
