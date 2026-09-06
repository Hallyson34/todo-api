import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { prismaService } from '../prisma/prisma.service';

// Reaproveita o client único do processo (ver prisma.service.ts) em vez de abrir
// um segundo pool de conexões com o Postgres só para o Better Auth.
export const auth = betterAuth({
  database: prismaAdapter(prismaService, { provider: 'postgresql' }),
  emailAndPassword: { enabled: true },
  // Checagem de origem própria do Better Auth, separada do CORS do Express
  // (ver enableCors em main.ts) — precisa listar as mesmas origens do front.
  trustedOrigins: ['http://localhost:3000', 'http://localhost:3001'],
});

export type Auth = typeof auth;
