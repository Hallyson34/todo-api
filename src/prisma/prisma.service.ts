import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';

// Prisma 7: o client sai no output customizado (src/generated/prisma) e fala com
// o Postgres pelo driver adapter — mesma configuração usada em lib/auth.ts.
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error('DATABASE_URL não está definida no ambiente.');
    }

    super({ adapter: new PrismaPg({ connectionString }) });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}

// Client único do processo: lib/auth.ts reaproveita esta mesma instância em vez
// de abrir seu próprio pool de conexões com o Postgres.
export const prismaService = new PrismaService();
