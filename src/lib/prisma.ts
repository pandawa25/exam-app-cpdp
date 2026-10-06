import { PrismaClient } from "@prisma/client";

// Hindari multiple instance Prisma Client saat hot-reload di dev (Next.js)
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
