import { PrismaPg } from '@prisma/adapter-pg';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { PrismaClient } from '../generated/prisma/client.js';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL não está definida no ambiente.');
}

// Prisma 7: o client sai num output customizado (src/generated/prisma) e fala
// com o Postgres pelo driver adapter, não pela engine binária.
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  emailAndPassword: { enabled: true },
});

export type Auth = typeof auth;
