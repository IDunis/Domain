import { PrismaClient } from "@prisma/client";

declare global {
  var __prisma: PrismaClient | undefined;
}

let prisma: PrismaClient = global.__prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") global.__prisma = prisma;

export { prisma };