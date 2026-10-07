import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// Proteksi route berdasarkan role. Satu peserta tidak bisa buka /admin,
// satu admin tidak otomatis bisa buka /supervisor/review, dst.
export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const role = req.nextauth.token?.role;

    const roleGuards: { prefix: string; allow: string[] }[] = [
      { prefix: "/admin", allow: ["ADMIN"] },
      { prefix: "/peserta", allow: ["PESERTA"] },
      { prefix: "/supervisor", allow: ["SUPERVISOR"] },
    ];

    for (const guard of roleGuards) {
      if (pathname.startsWith(guard.prefix) && !guard.allow.includes(role as string)) {
        // Sudah login tapi salah area: kembalikan ke dashboard role-nya sendiri (/post-login),
        // bukan ke form login yang membingungkan.
        return NextResponse.redirect(new URL("/post-login", req.url));
      }
    }
    return NextResponse.next();
  },
  {
    // Tanpa ini, user belum login dilempar ke halaman sign-in bawaan NextAuth (/api/auth/signin),
    // bukan ke halaman /login aplikasi.
    pages: { signIn: "/login" },
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ["/admin/:path*", "/peserta/:path*", "/supervisor/:path*", "/akun/:path*"],
};
