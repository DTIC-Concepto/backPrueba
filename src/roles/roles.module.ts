import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { RolesController } from './roles.controller';
import { RolesPermissionsService } from '../common/services/roles-permissions.service';
import { PermisosService } from '../common/services/permisos.service';
import { PermisoModel } from '../common/models/permiso.model';
import { RolPermisoModel } from '../common/models/rol-permiso.model';

@Module({
  imports: [SequelizeModule.forFeature([PermisoModel, RolPermisoModel])],
  controllers: [RolesController],
  providers: [RolesPermissionsService, PermisosService],
  exports: [RolesPermissionsService, PermisosService],
})
export class RolesModule {}