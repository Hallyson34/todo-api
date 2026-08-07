import './instrument';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from 'nestjs-pino';

async function bootstrap() {
  // bodyParser: false é exigência do @thallesp/nestjs-better-auth — ele readiciona
  // os parsers nas rotas não-auth. Efeito colateral: rawBody: true aqui deixa de
  // valer; se precisar do buffer cru, use bodyParser.rawBody no AuthModule.forRoot.
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    bodyParser: false,
  });
  app.useLogger(app.get(Logger));
  await app.listen(process.env.PORT ?? 3000);
}

bootstrap().catch((error: unknown) => {
  console.error('Erro ao iniciar a aplicação:', error);
  process.exit(1);
});
