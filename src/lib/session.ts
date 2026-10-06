import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * Helper dipakai di tiap API route untuk cek role sebelum eksekusi.
 * Mengembalikan session kalau role cocok, atau null kalau tidak -
 * route pemanggil tinggal `if (!session) return 401/403`.
 */
export async function requireRole(allowed: string[]) {
  const session = await getServerSession(authOptions);
  if (!session || !allowed.includes(session.user.role)) return null;
  return session;
}
