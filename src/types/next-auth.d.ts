import "next-auth";

declare module "next-auth" {
  interface User {
    role: string;
    discipline: string | null;
    position: string | null;
  }
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      role: string;
      discipline: string | null;
      position: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    discipline: string | null;
    position: string | null;
  }
}
