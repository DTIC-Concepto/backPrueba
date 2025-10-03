import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolEnum } from '../../common/enums/rol.enum';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<RolEnum[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (!requiredRoles) {
      return true;
    }
    
    const { user } = context.switchToHttp().getRequest();
    
    if (!user) {
      return false;
    }

    // Compatibilidad: verificar rol principal primero
    if (user.rol && requiredRoles.includes(user.rol)) {
      return true;
    }

    // Verificar múltiples roles si están disponibles
    if (user.usuarioRoles && Array.isArray(user.usuarioRoles)) {
      const userRoles = user.usuarioRoles
        .filter((ur: any) => ur.activo)
        .map((ur: any) => ur.rol);
      
      return requiredRoles.some((role) => userRoles.includes(role));
    }

    // Si el usuario tiene método hasAnyRole, usarlo
    if (typeof user.hasAnyRole === 'function') {
      return await user.hasAnyRole(requiredRoles);
    }

    // Fallback: solo verificar rol principal
    return requiredRoles.some((role) => user?.rol === role);
  }
}