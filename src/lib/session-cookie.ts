// Nama cookie sesi dibuat eksplisit dan dipakai bersama oleh auth.ts (runtime Node)
// dan middleware.ts (Edge runtime). File ini TIDAK boleh meng-import modul Node.
//
// Kenapa tidak dibiarkan default: NextAuth menentukan nama cookie dari
// process.env.NEXTAUTH_URL (https -> "__Secure-" prefix). Di Edge runtime env itu bisa
// tidak terbaca, sehingga middleware mencari cookie yang salah dan menganggap user belum login
// padahal /post-login (runtime Node) sudah mengenali sesinya. NODE_ENV selalu tersedia di keduanya.
export const USE_SECURE_COOKIES = process.env.NODE_ENV === "production";

export const SESSION_COOKIE_NAME = USE_SECURE_COOKIES
  ? "__Secure-next-auth.session-token"
  : "next-auth.session-token";
