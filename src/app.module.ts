import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LoggerModule } from 'nestjs-pino';
import type { IncomingHttpHeaders } from 'node:http';
import { SentryGlobalFilter, SentryModule } from '@sentry/nestjs/setup';
import { APP_FILTER } from '@nestjs/core';
import { AuthModule } from '@thallesp/nestjs-better-auth';
import { auth } from './lib/auth';
import { PrismaModule } from './prisma/prisma.module';
import { GroupModule } from './group/group.module';
import { TaskModule } from './task/task.module';

interface SerializedReq {
  id: unknown;
  method: string;
  url: string;
  remoteAddress?: string;
  headers: IncomingHttpHeaders;
}

@Module({
  imports: [
    SentryModule.forRoot(),
    // forRoot recebe um OBJETO ({ auth }), não a instância direta.
    // O AuthGuard é global por padrão: rota sem @AllowAnonymous() exige sessão.
    AuthModule.forRoot({ auth }),
    PrismaModule,
    GroupModule,
    TaskModule,
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
        transport:
          process.env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty', options: { singleLine: true } }
            : undefined,

        // ALLOWLIST: escolhe o que entra, não o que sai
        serializers: {
          req(req: SerializedReq) {
            return {
              id: req.id,
              method: req.method,
              url: req.url,
              // forense — quem e de onde, sem segredo
              remoteAddress: req.remoteAddress,
              userAgent: req.headers['user-agent'],
              referer: req.headers['referer'],
              origin: req.headers['origin'],
            };
          },
          res(res: { statusCode: number }) {
            return { statusCode: res.statusCode };
          },
        },

        // REDE GLOBAL: pega segredo em QUALQUER coisa que você logar manualmente
        redact: {
          paths: ['*.password', '*.senha', '*.token', 'req.body.password'],
          remove: true,
        },
      },
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_FILTER, useClass: SentryGlobalFilter },
  ],
})
export class AppModule {}
