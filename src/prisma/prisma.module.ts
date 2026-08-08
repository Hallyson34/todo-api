import { Global, Module } from '@nestjs/common';
import { PrismaService, prismaService } from './prisma.service';

// useValue com o singleton exportado por prisma.service.ts: se fosse useClass,
// o Nest instanciaria um SEGUNDO PrismaClient, com seu próprio pool.
@Global()
@Module({
  providers: [{ provide: PrismaService, useValue: prismaService }],
  exports: [PrismaService],
})
export class PrismaModule {}
