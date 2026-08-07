/**
 * Stub de @thallesp/nestjs-better-auth para os testes.
 *
 * O pacote é ESM-only e o runtime do Jest é CJS — importá-lo de verdade quebra
 * na hora de parsear (`import.meta` dentro das dependências). Nos testes de
 * unidade só precisamos que os decorators existam e não façam nada; a
 * integração real é exercitada em runtime/e2e.
 */
import { SetMetadata, createParamDecorator } from '@nestjs/common';

export const AllowAnonymous = () => SetMetadata('ALLOW_ANONYMOUS', true);
export const OptionalAuth = () => SetMetadata('OPTIONAL_AUTH', true);

export const Session = createParamDecorator(() => undefined);

export class AuthGuard {
  canActivate(): boolean {
    return true;
  }
}

// Espelha a assinatura real: infere a sessão do tipo da instância do auth.
export type UserSession<T = unknown> = T extends {
  $Infer: { Session: infer S };
}
  ? S
  : { user: Record<string, unknown>; session: Record<string, unknown> };
