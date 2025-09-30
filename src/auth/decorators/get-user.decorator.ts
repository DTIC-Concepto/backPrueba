import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UsuarioModel } from '../../usuarios/models/usuario.model';

export const GetUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): UsuarioModel => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);