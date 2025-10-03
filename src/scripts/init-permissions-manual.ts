import { Injectable, Logger } from '@nestjs/common';
import { Sequelize } from 'sequelize-typescript';
import { RolEnum } from '../common/enums/rol.enum';

@Injectable()
export class PermissionsInitService {
  private readonly logger = new Logger(PermissionsInitService.name);

  constructor(private sequelize: Sequelize) {}

  async initializePermissionsSystem(): Promise<void> {
    try {
      this.logger.log('🚀 Iniciando inicialización del sistema de permisos dinámico...');

      // Crear tablas directamente con SQL
      await this.createTables();
      
      // Insertar permisos por defecto
      await this.seedDefaultPermissions();
      
      // Asignar permisos a roles
      await this.assignPermissionsToRoles();

      this.logger.log('✅ Sistema de permisos dinámico inicializado correctamente');
    } catch (error) {
      this.logger.error('❌ Error al inicializar el sistema de permisos:', error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    this.logger.log('📝 Creando tablas de permisos...');

    // Crear tabla permisos si no existe
    await this.sequelize.query(`
      CREATE TABLE IF NOT EXISTS permisos (
        id SERIAL PRIMARY KEY,
        codigo VARCHAR(100) NOT NULL,
        nombre VARCHAR(255) NOT NULL,
        descripcion TEXT,
        categoria VARCHAR(100) NOT NULL,
        modulo VARCHAR(100) NOT NULL,
        activo BOOLEAN NOT NULL DEFAULT true,
        nivel_riesgo INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Crear índice único para código
    await this.sequelize.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS permisos_codigo_unique 
      ON permisos (codigo);
    `);

    // Agregar comentarios
    await this.sequelize.query(`
      COMMENT ON COLUMN permisos.codigo IS 'Código único del permiso (ej: manage_users, create_faculties)';
      COMMENT ON COLUMN permisos.nombre IS 'Nombre descriptivo del permiso';
      COMMENT ON COLUMN permisos.descripcion IS 'Descripción detallada del permiso y su propósito';
      COMMENT ON COLUMN permisos.categoria IS 'Categoría funcional del permiso (ej: Gestión de Usuarios, Dashboards)';
      COMMENT ON COLUMN permisos.modulo IS 'Módulo o área del sistema al que pertenece';
      COMMENT ON COLUMN permisos.activo IS 'Indica si el permiso está activo y disponible para asignación';
      COMMENT ON COLUMN permisos.nivel_riesgo IS 'Nivel de riesgo del permiso (0=bajo, 5=alto) para auditoría';
    `);

    // Crear tabla rol_permisos si no existe
    await this.sequelize.query(`
      CREATE TABLE IF NOT EXISTS rol_permisos (
        id SERIAL PRIMARY KEY,
        permiso_id INTEGER NOT NULL REFERENCES permisos(id) ON DELETE CASCADE,
        rol VARCHAR(50) NOT NULL,
        activo BOOLEAN NOT NULL DEFAULT true,
        observaciones TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(permiso_id, rol)
      );
    `);

    // Agregar comentarios a rol_permisos
    await this.sequelize.query(`
      COMMENT ON COLUMN rol_permisos.rol IS 'Rol al que se asigna el permiso';
      COMMENT ON COLUMN rol_permisos.activo IS 'Indica si la asignación está activa';
      COMMENT ON COLUMN rol_permisos.observaciones IS 'Observaciones sobre la asignación del permiso';
    `);

    this.logger.log('✅ Tablas de permisos creadas correctamente');
  }

  private async seedDefaultPermissions(): Promise<void> {
    this.logger.log('🌱 Insertando permisos por defecto...');

    const defaultPermissions = [
      // Gestión de Usuarios
      { codigo: 'manage_users', nombre: 'Gestionar Usuarios', descripcion: 'Crear, editar, eliminar y listar usuarios del sistema', categoria: 'Gestión de Usuarios', modulo: 'Usuarios', nivel_riesgo: 3 },
      { codigo: 'view_users', nombre: 'Ver Usuarios', descripcion: 'Consultar información de usuarios y sus roles', categoria: 'Gestión de Usuarios', modulo: 'Usuarios', nivel_riesgo: 1 },
      { codigo: 'create_users', nombre: 'Crear Usuarios', descripcion: 'Registrar nuevos usuarios en el sistema', categoria: 'Gestión de Usuarios', modulo: 'Usuarios', nivel_riesgo: 2 },
      { codigo: 'edit_users', nombre: 'Editar Usuarios', descripcion: 'Modificar información de usuarios existentes', categoria: 'Gestión de Usuarios', modulo: 'Usuarios', nivel_riesgo: 2 },
      { codigo: 'delete_users', nombre: 'Eliminar Usuarios', descripcion: 'Desactivar o eliminar usuarios del sistema', categoria: 'Gestión de Usuarios', modulo: 'Usuarios', nivel_riesgo: 4 },
      { codigo: 'change_user_status', nombre: 'Cambiar Estado de Usuario', descripcion: 'Activar o desactivar usuarios', categoria: 'Gestión de Usuarios', modulo: 'Usuarios', nivel_riesgo: 3 },
      
      // Gestión de Roles
      { codigo: 'manage_roles', nombre: 'Gestionar Roles y Permisos', descripcion: 'Administrar roles de usuario y asignación de permisos', categoria: 'Gestión de Roles', modulo: 'Roles', nivel_riesgo: 5 },
      { codigo: 'view_roles', nombre: 'Ver Roles y Permisos', descripcion: 'Consultar roles disponibles y sus permisos asociados', categoria: 'Gestión de Roles', modulo: 'Roles', nivel_riesgo: 1 },
      { codigo: 'assign_roles', nombre: 'Asignar Roles', descripcion: 'Asignar múltiples roles a usuarios', categoria: 'Gestión de Roles', modulo: 'Roles', nivel_riesgo: 4 },
      
      // Dashboards
      { codigo: 'view_admin_dashboard', nombre: 'Ver Dashboard Administrativo', descripcion: 'Acceso al panel de control administrativo', categoria: 'Dashboards', modulo: 'Dashboard', nivel_riesgo: 2 },
      { codigo: 'view_faculty_dashboard', nombre: 'Ver Dashboard de Facultad', descripcion: 'Acceso al panel de control de facultad', categoria: 'Dashboards', modulo: 'Dashboard', nivel_riesgo: 1 },
      { codigo: 'view_personal_dashboard', nombre: 'Ver Dashboard Personal', descripcion: 'Acceso al panel personal básico', categoria: 'Dashboards', modulo: 'Dashboard', nivel_riesgo: 0 },
      
      // Gestión de Facultades
      { codigo: 'manage_faculties', nombre: 'Gestionar Facultades', descripcion: 'Crear, editar y administrar facultades', categoria: 'Gestión Académica', modulo: 'Facultades', nivel_riesgo: 3 },
      { codigo: 'view_faculties', nombre: 'Ver Facultades', descripcion: 'Consultar información de facultades', categoria: 'Gestión Académica', modulo: 'Facultades', nivel_riesgo: 1 },
      { codigo: 'create_faculties', nombre: 'Crear Facultades', descripcion: 'Registrar nuevas facultades', categoria: 'Gestión Académica', modulo: 'Facultades', nivel_riesgo: 3 },
      
      // Gestión de Carreras
      { codigo: 'manage_careers', nombre: 'Gestionar Carreras', descripcion: 'Crear, editar y administrar carreras académicas', categoria: 'Gestión Académica', modulo: 'Carreras', nivel_riesgo: 3 },
      { codigo: 'view_careers', nombre: 'Ver Carreras', descripcion: 'Consultar información de carreras académicas', categoria: 'Gestión Académica', modulo: 'Carreras', nivel_riesgo: 1 },
      { codigo: 'create_careers', nombre: 'Crear Carreras', descripción: 'Registrar nuevas carreras académicas', categoria: 'Gestión Académica', modulo: 'Carreras', nivel_riesgo: 3 },
      
      // Perfil Personal
      { codigo: 'view_profile', nombre: 'Ver Perfil Personal', descripcion: 'Consultar información del propio perfil', categoria: 'Perfil Personal', modulo: 'Perfil', nivel_riesgo: 0 },
      { codigo: 'edit_profile', nombre: 'Editar Perfil Personal', descripcion: 'Modificar información del propio perfil', categoria: 'Perfil Personal', modulo: 'Perfil', nivel_riesgo: 1 },
      { codigo: 'change_password', nombre: 'Cambiar Contraseña', descripcion: 'Modificar la propia contraseña', categoria: 'Perfil Personal', modulo: 'Perfil', nivel_riesgo: 2 }
    ];

    for (const permiso of defaultPermissions) {
      await this.sequelize.query(`
        INSERT INTO permisos (codigo, nombre, descripcion, categoria, modulo, nivel_riesgo, activo)
        VALUES (:codigo, :nombre, :descripcion, :categoria, :modulo, :nivel_riesgo, true)
        ON CONFLICT (codigo) DO UPDATE SET
          nombre = EXCLUDED.nombre,
          descripcion = EXCLUDED.descripcion,
          categoria = EXCLUDED.categoria,
          modulo = EXCLUDED.modulo,
          nivel_riesgo = EXCLUDED.nivel_riesgo,
          updated_at = NOW()
      `, {
        replacements: permiso
      });
    }

    this.logger.log(`✅ ${defaultPermissions.length} permisos insertados/actualizados`);
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
        await this.sequelize.query(`
          INSERT INTO rol_permisos (permiso_id, rol, activo)
          SELECT p.id, :rol, true
          FROM permisos p
          WHERE p.codigo = :permisoCode
          ON CONFLICT (permiso_id, rol) DO UPDATE SET
            activo = true,
            updated_at = NOW()
        `, {
          replacements: { rol, permisoCode }
        });
      }
    }

    this.logger.log('✅ Permisos asignados a roles correctamente');
  }
}

// Script principal para ejecutar la inicialización
async function main() {
  const { NestFactory } = require('@nestjs/core');
  const { AppModule } = require('../app.module');

  try {
    const app = await NestFactory.create(AppModule, { logger: ['log', 'error', 'warn'] });
    
    const sequelize = app.get(Sequelize);
    const service = new PermissionsInitService(sequelize);
    
    await service.initializePermissionsSystem();
    
    console.log('\n🎉 ¡Sistema de permisos dinámico inicializado exitosamente!');
    console.log('📊 El sistema ahora utiliza permisos almacenados en base de datos');
    console.log('🔧 Los administradores pueden gestionar permisos dinámicamente');
    
    await app.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error durante la inicialización:', error);
    process.exit(1);
  }
}

// Ejecutar el script
if (require.main === module) {
  main();
}