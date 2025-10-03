import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { UsuariosService } from './usuarios.service';
import { UsuariosController } from './usuarios.controller';
import { UsuarioModel } from './models/usuario.model';
import { UsuarioRolModel } from '../common/models/usuario-rol.model';
import { PermisoModel } from '../common/models/permiso.model';
import { RolPermisoModel } from '../common/models/rol-permiso.model';
import { RolesPermissionsService } from '../common/services/roles-permissions.service';
import { PermisosService } from '../common/services/permisos.service';

@Module({
  imports: [SequelizeModule.forFeature([UsuarioModel, UsuarioRolModel, PermisoModel, RolPermisoModel])],
  controllers: [UsuariosController],
  providers: [UsuariosService, RolesPermissionsService, PermisosService],
  exports: [UsuariosService],
})
export class UsuariosModule {}