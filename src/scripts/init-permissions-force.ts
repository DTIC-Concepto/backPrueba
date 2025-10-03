import { Injectable, Logger } from '@nestjs/common';
import { Sequelize } from 'sequelize-typescript';
import { RolEnum } from '../common/enums/rol.enum';
import { PermisoModel } from '../common/models/permiso.model';
import { RolPermisoModel } from '../common/models/rol-permiso.model';

@Injectable()
export class PermissionsForceInitService {
  private readonly logger = new Logger(PermissionsForceInitService.name);

  constructor(private sequelize: Sequelize) {}

  async initializePermissionsSystemWithForce(): Promise<void> {
    try {
      this.logger.log('🚀 Iniciando inicialización FORZADA del sistema de permisos dinámico...');
      this.logger.warn('⚠️  ADVERTENCIA: Se van a eliminar y recrear las tablas de permisos');

      // Sincronizar solo los modelos de permisos con force: true
      await this.forceRecreatePermissionsTables();
      
      // Insertar permisos por defecto
      await this.seedDefaultPermissions();
      
      // Asignar permisos a roles
      await this.assignPermissionsToRoles();

      this.logger.log('✅ Sistema de permisos dinámico inicializado correctamente con force: true');
    } catch (error) {
      this.logger.error('❌ Error al inicializar el sistema de permisos:', error);
      throw error;
    }
  }

  private async forceRecreatePermissionsTables(): Promise<void> {
    this.logger.log('🔥 Recreando tablas de permisos con force: true...');

    try {
      // Sincronizar solo los modelos específicos de permisos con force: true
      await PermisoModel.sync({ force: true });
      this.logger.log('✅ Tabla permisos recreada');

      await RolPermisoModel.sync({ force: true });
      this.logger.log('✅ Tabla rol_permisos recreada');

      this.logger.log('✅ Tablas de permisos recreadas exitosamente');
    } catch (error) {
      this.logger.error('❌ Error al recrear tablas de permisos:', error);
      throw error;
    }
  }

  private async seedDefaultPermissions(): Promise<void> {
    this.logger.log('🌱 Insertando permisos por defecto...');

    const defaultPermissions = [
      // Gestión de Usuarios
      { codigo: 'manage_users', nombre: 'Gestionar Usuarios', descripcion: 'Crear, editar, eliminar y listar usuarios del sistema', categoria: 'Gestión de Usuarios', modulo: 'Usuarios', nivelRiesgo: 3 },
      { codigo: 'view_users', nombre: 'Ver Usuarios', descripcion: 'Consultar información de usuarios y sus roles', categoria: 'Gestión de Usuarios', modulo: 'Usuarios', nivelRiesgo: 1 },
      { codigo: 'create_users', nombre: 'Crear Usuarios', descripcion: 'Registrar nuevos usuarios en el sistema', categoria: 'Gestión de Usuarios', modulo: 'Usuarios', nivelRiesgo: 2 },
      { codigo: 'edit_users', nombre: 'Editar Usuarios', descripcion: 'Modificar información de usuarios existentes', categoria: 'Gestión de Usuarios', modulo: 'Usuarios', nivelRiesgo: 2 },
      { codigo: 'delete_users', nombre: 'Eliminar Usuarios', descripcion: 'Desactivar o eliminar usuarios del sistema', categoria: 'Gestión de Usuarios', modulo: 'Usuarios', nivelRiesgo: 4 },
      { codigo: 'change_user_status', nombre: 'Cambiar Estado de Usuario', descripcion: 'Activar o desactivar usuarios', categoria: 'Gestión de Usuarios', modulo: 'Usuarios', nivelRiesgo: 3 },
      
      // Gestión de Roles
      { codigo: 'manage_roles', nombre: 'Gestionar Roles y Permisos', descripcion: 'Administrar roles de usuario y asignación de permisos', categoria: 'Gestión de Roles', modulo: 'Roles', nivelRiesgo: 5 },
      { codigo: 'view_roles', nombre: 'Ver Roles y Permisos', descripcion: 'Consultar roles disponibles y sus permisos asociados', categoria: 'Gestión de Roles', modulo: 'Roles', nivelRiesgo: 1 },
      { codigo: 'assign_roles', nombre: 'Asignar Roles', descripcion: 'Asignar múltiples roles a usuarios', categoria: 'Gestión de Roles', modulo: 'Roles', nivelRiesgo: 4 },
      
      // Dashboards
      { codigo: 'view_admin_dashboard', nombre: 'Ver Dashboard Administrativo', descripcion: 'Acceso al panel de control administrativo', categoria: 'Dashboards', modulo: 'Dashboard', nivelRiesgo: 2 },
      { codigo: 'view_faculty_dashboard', nombre: 'Ver Dashboard de Facultad', descripcion: 'Acceso al panel de control de facultad', categoria: 'Dashboards', modulo: 'Dashboard', nivelRiesgo: 1 },
      { codigo: 'view_personal_dashboard', nombre: 'Ver Dashboard Personal', descripcion: 'Acceso al panel personal básico', categoria: 'Dashboards', modulo: 'Dashboard', nivelRiesgo: 0 },
      
      // Gestión de Facultades
      { codigo: 'manage_faculties', nombre: 'Gestionar Facultades', descripcion: 'Crear, editar y administrar facultades', categoria: 'Gestión Académica', modulo: 'Facultades', nivelRiesgo: 3 },
      { codigo: 'view_faculties', nombre: 'Ver Facultades', descripcion: 'Consultar información de facultades', categoria: 'Gestión Académica', modulo: 'Facultades', nivelRiesgo: 1 },
      { codigo: 'create_faculties', nombre: 'Crear Facultades', descripcion: 'Registrar nuevas facultades', categoria: 'Gestión Académica', modulo: 'Facultades', nivelRiesgo: 3 },
      
      // Gestión de Carreras
      { codigo: 'manage_careers', nombre: 'Gestionar Carreras', descripcion: 'Crear, editar y administrar carreras académicas', categoria: 'Gestión Académica', modulo: 'Carreras', nivelRiesgo: 3 },
      { codigo: 'view_careers', nombre: 'Ver Carreras', descripcion: 'Consultar información de carreras académicas', categoria: 'Gestión Académica', modulo: 'Carreras', nivelRiesgo: 1 },
      { codigo: 'create_careers', nombre: 'Crear Carreras', descripcion: 'Registrar nuevas carreras académicas', categoria: 'Gestión Académica', modulo: 'Carreras', nivelRiesgo: 3 },
      
      // Perfil Personal
      { codigo: 'view_profile', nombre: 'Ver Perfil Personal', descripcion: 'Consultar información del propio perfil', categoria: 'Perfil Personal', modulo: 'Perfil', nivelRiesgo: 0 },
      { codigo: 'edit_profile', nombre: 'Editar Perfil Personal', descripcion: 'Modificar información del propio perfil', categoria: 'Perfil Personal', modulo: 'Perfil', nivelRiesgo: 1 },
      { codigo: 'change_password', nombre: 'Cambiar Contraseña', descripcion: 'Modificar la propia contraseña', categoria: 'Perfil Personal', modulo: 'Perfil', nivelRiesgo: 2 }
    ];

    for (const permiso of defaultPermissions) {
      await PermisoModel.create(permiso as any);
    }

    this.logger.log(`✅ ${defaultPermissions.length} permisos insertados correctamente`);
  }

  private async assignPermissionsToRoles(): Promise<void> {
    this.logger.log('🔗 Asignando permisos a roles...');

    // Definir asignaciones de permisos por rol
    const rolePermissions = {
      [RolEnum.ADMINISTRADOR]: [
        'manage_users', 'view_users', 'create_users', 'edit_users', 'delete_users', 'change_user_status',
        'manage_roles', 'view_roles', 'assign_roles',
        'view_admin_dashboard',
        'manage_faculties', 'view_faculties', 'create_faculties',
        'manage_careers', 'view_careers', 'create_careers',
        'view_profile', 'edit_profile', 'change_password'
      ],
      [RolEnum.DGIP]: [
        'view_users', 'create_users', 'edit_users', 'change_user_status',
        'view_roles',
        'view_admin_dashboard',
        'manage_faculties', 'view_faculties', 'create_faculties',
        'manage_careers', 'view_careers', 'create_careers',
        'view_profile', 'edit_profile', 'change_password'
      ],
      [RolEnum.DECANO]: [
        'view_users',
        'view_roles',
        'view_faculty_dashboard',
        'view_faculties',
        'view_careers',
        'view_profile', 'edit_profile', 'change_password'
      ],
      [RolEnum.SUBDECANO]: [
        'view_users',
        'view_roles',
        'view_faculty_dashboard',
        'view_faculties',
        'view_careers',
        'view_profile', 'edit_profile', 'change_password'
      ],
      [RolEnum.JEFE_DEPARTAMENTO]: [
        'view_users',
        'view_roles',
        'view_faculty_dashboard',
        'view_faculties',
        'view_careers',
        'view_profile', 'edit_profile', 'change_password'
      ],
      [RolEnum.COORDINADOR]: [
        'view_users',
        'view_roles',
        'view_personal_dashboard',
        'view_careers',
        'view_profile', 'edit_profile', 'change_password'
      ],
      [RolEnum.PROFESOR]: [
        'view_roles',
        'view_personal_dashboard',
        'view_profile', 'edit_profile', 'change_password'
      ],
      [RolEnum.CEI]: [
        'view_users',
        'view_roles',
        'view_personal_dashboard',
        'view_faculties',
        'view_careers',
        'view_profile', 'edit_profile', 'change_password'
      ]
    };

    for (const [rol, permisos] of Object.entries(rolePermissions)) {
      this.logger.log(`Asignando ${permisos.length} permisos al rol ${rol}...`);
      
      for (const permisoCode of permisos) {
        // Buscar el permiso por código
        const permiso = await PermisoModel.findOne({
          where: { codigo: permisoCode }
        });

        if (permiso) {
          await RolPermisoModel.create({
            permiso_id: permiso.id,
            rol: rol as RolEnum,
            activo: true
          } as any);
        } else {
          this.logger.warn(`⚠️  Permiso ${permisoCode} no encontrado para asignar a rol ${rol}`);
        }
      }
    }

    this.logger.log('✅ Permisos asignados a roles correctamente');
  }
}

// Script principal para ejecutar la inicialización con force
async function main() {
  const { NestFactory } = require('@nestjs/core');
  const { AppModule } = require('../app.module');

  try {
    const app = await NestFactory.create(AppModule, { logger: ['log', 'error', 'warn'] });
    
    const sequelize = app.get(Sequelize);
    const service = new PermissionsForceInitService(sequelize);
    
    await service.initializePermissionsSystemWithForce();
    
    console.log('\n🎉 ¡Sistema de permisos dinámico inicializado exitosamente con FORCE!');
    console.log('📊 Las tablas de permisos fueron recreadas completamente');
    console.log('🔧 Los administradores pueden gestionar permisos dinámicamente');
    
    await app.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error durante la inicialización forzada:', error);
    process.exit(1);
  }
}

// Ejecutar el script
if (require.main === module) {
  main();
}