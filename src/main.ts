import './instrument';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from 'nestjs-pino';
import { setupSwagger } from './swagger';

async function bootstrap() {
  // bodyParser: false é exigência do @thallesp/nestjs-better-auth — ele readiciona
  // os parsers nas rotas não-auth. Efeito colateral: rawBody: true aqui deixa de
  // valer; se precisar do buffer cru, use bodyParser.rawBody no AuthModule.forRoot.
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    bodyParser: false,
  });
  app.useLogger(app.get(Logger));

  // credentials: true é necessário para o cookie de sessão do better-auth
  // atravessar o CORS.
  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
  });

  // Validação como fronteira: o que não está no DTO não entra.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  setupSwagger(app);

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap().catch((error: unknown) => {
  console.error('Erro ao iniciar a aplicação:', error);
  process.exit(1);
});
