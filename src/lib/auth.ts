import { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

// Auth internal perusahaan: email + password, tanpa social login.
// Role (ADMIN/PESERTA/SUPERVISOR) disimpan di token supaya middleware bisa
// proteksi route tanpa query ulang ke DB di tiap request.
export const authOptions: NextAuthOptions = {
  // 12 jam (default NextAuth 30 hari): akun yang dinonaktifkan admin tidak bisa dicabut dari JWT
  // yang sudah terbit, jadi masa berlaku sesi dibatasi supaya aksesnya cepat berakhir sendiri.
  session: { strategy: "jwt", maxAge: 12 * 60 * 60 },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        // Email disimpan lowercase; normalisasi input supaya "Budi@Perusahaan.com" tetap bisa login.
        const user = await prisma.user.findUnique({
          where: { email: credentials.email.trim().toLowerCase() },
        });
        if (!user || !user.isActive) return null;

        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          discipline: user.discipline,
          position: user.position,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.discipline = user.discipline;
        token.position = user.position;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.discipline = token.discipline as string | null;
        session.user.position = token.position as string | null;
      }
      return session;
    },
  },
};
