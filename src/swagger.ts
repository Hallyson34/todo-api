import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export const SWAGGER_PATH = 'docs';

// SwaggerModule.setup registra a rota direto no http adapter, fora do roteador
// do Nest — o AuthGuard global (APP_GUARD) não roda nela, então /docs abre sem
// login sem precisar de @AllowAnonymous.
export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('todo-api')
    .setDescription('CRUD de grupos e tasks, com autorização por dono.')
    .setVersion('1.0')
    .addCookieAuth('better-auth.session_token')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup(SWAGGER_PATH, app, document);
}
