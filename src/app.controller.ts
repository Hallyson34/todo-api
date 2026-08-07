import { Controller, Get } from '@nestjs/common';
import {
  AllowAnonymous,
  Session,
  type UserSession,
} from '@thallesp/nestjs-better-auth';
import { AppService } from './app.service';
import type { auth } from './lib/auth';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  // O AuthGuard é global — sem isso o hello world responderia 401.
  @AllowAnonymous()
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  // Rota protegida: 401 sem cookie de sessão, 200 com.
  @Get('me')
  getMe(
    @Session() session: UserSession<typeof auth>,
  ): UserSession<typeof auth>['user'] {
    return session.user;
  }
}
