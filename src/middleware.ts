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
        return NextResponse.redirect(new URL("/login", req.url));
      }
    }
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ["/admin/:path*", "/peserta/:path*", "/supervisor/:path*"],
};
