import { SetMetadata } from '@nestjs/common';
import { RolEnum } from '../../common/enums/rol.enum';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: RolEnum[]) => SetMetadata(ROLES_KEY, roles);