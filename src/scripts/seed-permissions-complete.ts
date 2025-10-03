import { Injectable, Logger } from '@nestjs/common';
import { Sequelize } from 'sequelize-typescript';
import { RolEnum } from '../common/enums/rol.enum';
import { PermisoModel } from '../common/models/permiso.model';
import { RolPermisoModel } from '../common/models/rol-permiso.model';

@Injectable()
export class PermissionsSystemSeedService {
  private readonly logger = new Logger(PermissionsSystemSeedService.name);

  constructor(private sequelize: Sequelize) {}

  async seedCompletePermissionsSystem(): Promise<void> {
    try {
      this.logger.log('🚀 Iniciando seed completo del sistema de permisos y roles...');

      // 1. Crear tablas si no existen (usando raw SQL para evitar problemas con sync)
      await this.createTablesIfNotExist();
      
      // 2. Limpiar datos existentes para empezar limpio
      await this.cleanExistingData();
      
      // 3. Insertar todos los permisos del sistema
      await this.seedAllPermissions();
      
      // 4. Asignar permisos a cada rol
      await this.seedRolePermissions();

      this.logger.log('✅ Sistema completo de permisos y roles inicializado correctamente');
      this.logger.log('📊 Ahora todos los permisos están almacenados en base de datos');
    } catch (error) {
      this.logger.error('❌ Error al inicializar el sistema completo de permisos:', error);
      throw error;
    }
  }

  private async createTablesIfNotExist(): Promise<void> {
    this.logger.log('📝 Verificando y creando tablas necesarias...');

    // Crear tabla permisos
    await this.sequelize.query(`
      CREATE TABLE IF NOT EXISTS permisos (
        id SERIAL PRIMARY KEY,
        codigo VARCHAR(100) NOT NULL UNIQUE,
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

    // Crear tabla rol_permisos
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

    // Crear índices para mejor rendimiento
    await this.sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_permisos_codigo ON permisos(codigo);
      CREATE INDEX IF NOT EXISTS idx_permisos_categoria ON permisos(categoria);
      CREATE INDEX IF NOT EXISTS idx_permisos_modulo ON permisos(modulo);
      CREATE INDEX IF NOT EXISTS idx_rol_permisos_rol ON rol_permisos(rol);
      CREATE INDEX IF NOT EXISTS idx_rol_permisos_activo ON rol_permisos(activo);
    `);

    this.logger.log('✅ Tablas verificadas/creadas correctamente');
  }

  private async cleanExistingData(): Promise<void> {
    this.logger.log('🧹 Limpiando datos existentes...');
    
    await this.sequelize.query('DELETE FROM rol_permisos');
    await this.sequelize.query('DELETE FROM permisos');
    
    // Resetear secuencias
    await this.sequelize.query('ALTER SEQUENCE permisos_id_seq RESTART WITH 1');
    await this.sequelize.query('ALTER SEQUENCE rol_permisos_id_seq RESTART WITH 1');
    
    this.logger.log('✅ Datos existentes limpiados');
  }

  private async seedAllPermissions(): Promise<void> {
    this.logger.log('🌱 Insertando todos los permisos del sistema...');

    const allPermissions = [
      // === GESTIÓN DE USUARIOS ===
      {
        codigo: 'manage_users',
        nombre: 'Gestionar Usuarios',
        descripcion: 'Acceso completo para crear, editar, eliminar y listar usuarios del sistema',
        categoria: 'Gestión de Usuarios',
        modulo: 'Usuarios',
        nivel_riesgo: 4
      },
      {
        codigo: 'view_users',
        nombre: 'Ver Usuarios',
        descripcion: 'Consultar información de usuarios y sus roles asignados',
        categoria: 'Gestión de Usuarios',
        modulo: 'Usuarios',
        nivel_riesgo: 1
      },
      {
        codigo: 'create_users',
        nombre: 'Crear Usuarios',
        descripcion: 'Registrar nuevos usuarios en el sistema',
        categoria: 'Gestión de Usuarios',
        modulo: 'Usuarios',
        nivel_riesgo: 3
      },
      {
        codigo: 'edit_users',
        nombre: 'Editar Usuarios',
        descripcion: 'Modificar información de usuarios existentes',
        categoria: 'Gestión de Usuarios',
        modulo: 'Usuarios',
        nivel_riesgo: 3
      },
      {
        codigo: 'delete_users',
        nombre: 'Eliminar Usuarios',
        descripcion: 'Desactivar o eliminar usuarios del sistema',
        categoria: 'Gestión de Usuarios',
        modulo: 'Usuarios',
        nivel_riesgo: 5
      },
      {
        codigo: 'change_user_status',
        nombre: 'Cambiar Estado de Usuario',
        descripcion: 'Activar o desactivar usuarios del sistema',
        categoria: 'Gestión de Usuarios',
        modulo: 'Usuarios',
        nivel_riesgo: 3
      },
      {
        codigo: 'search_users',
        nombre: 'Buscar Usuarios',
        descripcion: 'Realizar búsquedas avanzadas de usuarios con filtros',
        categoria: 'Gestión de Usuarios',
        modulo: 'Usuarios',
        nivel_riesgo: 1
      },

      // === GESTIÓN DE ROLES Y PERMISOS ===
      {
        codigo: 'manage_roles',
        nombre: 'Gestionar Roles y Permisos',
        descripcion: 'Administrar roles de usuario y asignación de permisos del sistema',
        categoria: 'Gestión de Roles',
        modulo: 'Roles',
        nivel_riesgo: 5
      },
      {
        codigo: 'view_roles',
        nombre: 'Ver Roles y Permisos',
        descripcion: 'Consultar roles disponibles y sus permisos asociados',
        categoria: 'Gestión de Roles',
        modulo: 'Roles',
        nivel_riesgo: 1
      },
      {
        codigo: 'assign_roles',
        nombre: 'Asignar Roles a Usuarios',
        descripcion: 'Asignar y remover múltiples roles a usuarios específicos',
        categoria: 'Gestión de Roles',
        modulo: 'Roles',
        nivel_riesgo: 4
      },
      {
        codigo: 'create_permissions',
        nombre: 'Crear Permisos',
        descripcion: 'Crear nuevos permisos en el sistema',
        categoria: 'Gestión de Roles',
        modulo: 'Roles',
        nivel_riesgo: 5
      },
      {
        codigo: 'edit_permissions',
        nombre: 'Editar Permisos',
        descripcion: 'Modificar permisos existentes del sistema',
        categoria: 'Gestión de Roles',
        modulo: 'Roles',
        nivel_riesgo: 5
      },

      // === DASHBOARDS ===
      {
        codigo: 'view_admin_dashboard',
        nombre: 'Ver Dashboard Administrativo',
        descripcion: 'Acceso al panel de control administrativo con métricas globales',
        categoria: 'Dashboards',
        modulo: 'Dashboard',
        nivel_riesgo: 2
      },
      {
        codigo: 'view_faculty_dashboard',
        nombre: 'Ver Dashboard de Facultad',
        descripcion: 'Acceso al panel de control específico de facultad',
        categoria: 'Dashboards',
        modulo: 'Dashboard',
        nivel_riesgo: 1
      },
      {
        codigo: 'view_personal_dashboard',
        nombre: 'Ver Dashboard Personal',
        descripcion: 'Acceso al panel personal básico con información propia',
        categoria: 'Dashboards',
        modulo: 'Dashboard',
        nivel_riesgo: 0
      },
      {
        codigo: 'export_dashboard_data',
        nombre: 'Exportar Datos de Dashboard',
        descripcion: 'Exportar información y métricas de los dashboards',
        categoria: 'Dashboards',
        modulo: 'Dashboard',
        nivel_riesgo: 2
      },

      // === GESTIÓN DE FACULTADES ===
      {
        codigo: 'manage_faculties',
        nombre: 'Gestionar Facultades',
        descripcion: 'Acceso completo para crear, editar y administrar facultades',
        categoria: 'Gestión Académica',
        modulo: 'Facultades',
        nivel_riesgo: 3
      },
      {
        codigo: 'view_faculties',
        nombre: 'Ver Facultades',
        descripcion: 'Consultar información de facultades del sistema',
        categoria: 'Gestión Académica',
        modulo: 'Facultades',
        nivel_riesgo: 1
      },
      {
        codigo: 'create_faculties',
        nombre: 'Crear Facultades',
        descripcion: 'Registrar nuevas facultades en el sistema',
        categoria: 'Gestión Académica',
        modulo: 'Facultades',
        nivel_riesgo: 3
      },
      {
        codigo: 'edit_faculties',
        nombre: 'Editar Facultades',
        descripcion: 'Modificar información de facultades existentes',
        categoria: 'Gestión Académica',
        modulo: 'Facultades',
        nivel_riesgo: 3
      },
      {
        codigo: 'delete_faculties',
        nombre: 'Eliminar Facultades',
        descripcion: 'Desactivar o eliminar facultades del sistema',
        categoria: 'Gestión Académica',
        modulo: 'Facultades',
        nivel_riesgo: 4
      },

      // === GESTIÓN DE CARRERAS ===
      {
        codigo: 'manage_careers',
        nombre: 'Gestionar Carreras',
        descripcion: 'Acceso completo para crear, editar y administrar carreras académicas',
        categoria: 'Gestión Académica',
        modulo: 'Carreras',
        nivel_riesgo: 3
      },
      {
        codigo: 'view_careers',
        nombre: 'Ver Carreras',
        descripcion: 'Consultar información de carreras académicas',
        categoria: 'Gestión Académica',
        modulo: 'Carreras',
        nivel_riesgo: 1
      },
      {
        codigo: 'create_careers',
        nombre: 'Crear Carreras',
        descripcion: 'Registrar nuevas carreras académicas en el sistema',
        categoria: 'Gestión Académica',
        modulo: 'Carreras',
        nivel_riesgo: 3
      },
      {
        codigo: 'edit_careers',
        nombre: 'Editar Carreras',
        descripcion: 'Modificar información de carreras existentes',
        categoria: 'Gestión Académica',
        modulo: 'Carreras',
        nivel_riesgo: 3
      },
      {
        codigo: 'delete_careers',
        nombre: 'Eliminar Carreras',
        descripcion: 'Desactivar o eliminar carreras del sistema',
        categoria: 'Gestión Académica',
        modulo: 'Carreras',
        nivel_riesgo: 4
      },

      // === PERFIL PERSONAL ===
      {
        codigo: 'view_profile',
        nombre: 'Ver Perfil Personal',
        descripcion: 'Consultar información del propio perfil de usuario',
        categoria: 'Perfil Personal',
        modulo: 'Perfil',
        nivel_riesgo: 0
      },
      {
        codigo: 'edit_profile',
        nombre: 'Editar Perfil Personal',
        descripcion: 'Modificar información del propio perfil de usuario',
        categoria: 'Perfil Personal',
        modulo: 'Perfil',
        nivel_riesgo: 1
      },
      {
        codigo: 'change_password',
        nombre: 'Cambiar Contraseña Personal',
        descripcion: 'Modificar la propia contraseña de acceso',
        categoria: 'Perfil Personal',
        modulo: 'Perfil',
        nivel_riesgo: 2
      },

      // === AUDITORÍA Y REPORTES ===
      {
        codigo: 'view_audit_logs',
        nombre: 'Ver Logs de Auditoría',
        descripcion: 'Consultar registros de auditoría y actividad del sistema',
        categoria: 'Auditoría',
        modulo: 'Auditoría',
        nivel_riesgo: 2
      },
      {
        codigo: 'export_reports',
        nombre: 'Exportar Reportes',
        descripcion: 'Generar y exportar reportes del sistema',
        categoria: 'Reportes',
        modulo: 'Reportes',
        nivel_riesgo: 2
      },
      {
        codigo: 'view_system_metrics',
        nombre: 'Ver Métricas del Sistema',
        descripcion: 'Consultar métricas y estadísticas generales del sistema',
        categoria: 'Métricas',
        modulo: 'Sistema',
        nivel_riesgo: 1
      }
    ];

    // Insertar todos los permisos
    for (const permiso of allPermissions) {
      await this.sequelize.query(`
        INSERT INTO permisos (codigo, nombre, descripcion, categoria, modulo, nivel_riesgo, activo)
        VALUES (:codigo, :nombre, :descripcion, :categoria, :modulo, :nivel_riesgo, true)
      `, {
        replacements: permiso
      });
    }

    this.logger.log(`✅ ${allPermissions.length} permisos insertados correctamente`);
  }

  private async seedRolePermissions(): Promise<void> {
    this.logger.log('🔗 Asignando permisos a cada rol...');

    // Definir qué permisos tiene cada rol
    const rolePermissionsMapping = {
      [RolEnum.ADMINISTRADOR]: [
        // Acceso total del sistema
        'manage_users', 'view_users', 'create_users', 'edit_users', 'delete_users', 'change_user_status', 'search_users',
        'manage_roles', 'view_roles', 'assign_roles', 'create_permissions', 'edit_permissions',
        'view_admin_dashboard', 'export_dashboard_data',
        'manage_faculties', 'view_faculties', 'create_faculties', 'edit_faculties', 'delete_faculties',
        'manage_careers', 'view_careers', 'create_careers', 'edit_careers', 'delete_careers',
        'view_profile', 'edit_profile', 'change_password',
        'view_audit_logs', 'export_reports', 'view_system_metrics'
      ],

      [RolEnum.DGIP]: [
        // Dirección General de Investigación y Posgrado - gestión académica completa
        'view_users', 'create_users', 'edit_users', 'change_user_status', 'search_users',
        'view_roles', 'assign_roles',
        'view_admin_dashboard', 'export_dashboard_data',
        'manage_faculties', 'view_faculties', 'create_faculties', 'edit_faculties',
        'manage_careers', 'view_careers', 'create_careers', 'edit_careers',
        'view_profile', 'edit_profile', 'change_password',
        'export_reports', 'view_system_metrics'
      ],

      [RolEnum.DECANO]: [
        // Gestión de su facultad específica
        'view_users', 'search_users',
        'view_roles',
        'view_faculty_dashboard', 'export_dashboard_data',
        'view_faculties', 'edit_faculties',
        'view_careers', 'create_careers', 'edit_careers',
        'view_profile', 'edit_profile', 'change_password',
        'export_reports'
      ],

      [RolEnum.SUBDECANO]: [
        // Apoyo en gestión de facultad
        'view_users', 'search_users',
        'view_roles',
        'view_faculty_dashboard',
        'view_faculties',
        'view_careers', 'edit_careers',
        'view_profile', 'edit_profile', 'change_password'
      ],

      [RolEnum.JEFE_DEPARTAMENTO]: [
        // Gestión departamental
        'view_users', 'search_users',
        'view_roles',
        'view_faculty_dashboard',
        'view_faculties',
        'view_careers', 'edit_careers',
        'view_profile', 'edit_profile', 'change_password'
      ],

      [RolEnum.COORDINADOR]: [
        // Coordinación de carreras específicas
        'view_users',
        'view_roles',
        'view_personal_dashboard',
        'view_careers',
        'view_profile', 'edit_profile', 'change_password'
      ],

      [RolEnum.PROFESOR]: [
        // Acceso básico del sistema
        'view_roles',
        'view_personal_dashboard',
        'view_profile', 'edit_profile', 'change_password'
      ],

      [RolEnum.CEI]: [
        // Comité de Ética en Investigación
        'view_users', 'search_users',
        'view_roles',
        'view_personal_dashboard',
        'view_faculties',
        'view_careers',
        'view_profile', 'edit_profile', 'change_password',
        'view_audit_logs'
      ]
    };

    // Insertar asignaciones rol-permiso
    for (const [rol, permisos] of Object.entries(rolePermissionsMapping)) {
      this.logger.log(`Asignando ${permisos.length} permisos al rol ${rol}...`);
      
      for (const permisoCode of permisos) {
        try {
          await this.sequelize.query(`
            INSERT INTO rol_permisos (permiso_id, rol, activo)
            SELECT p.id, :rol, true
            FROM permisos p
            WHERE p.codigo = :permisoCode
          `, {
            replacements: { rol, permisoCode }
          });
        } catch (error) {
          this.logger.warn(`⚠️  Error asignando permiso ${permisoCode} al rol ${rol}:`, error.message);
        }
      }
    }

    // Mostrar resumen final
    const [results] = await this.sequelize.query(`
      SELECT 
        rp.rol,
        COUNT(*) as total_permisos,
        COUNT(CASE WHEN p.nivel_riesgo >= 4 THEN 1 END) as permisos_alto_riesgo
      FROM rol_permisos rp
      JOIN permisos p ON rp.permiso_id = p.id
      WHERE rp.activo = true
      GROUP BY rp.rol
      ORDER BY rp.rol
    `);

    this.logger.log('📊 Resumen de permisos por rol:');
    results.forEach((row: any) => {
      this.logger.log(`  ${row.rol}: ${row.total_permisos} permisos (${row.permisos_alto_riesgo} de alto riesgo)`);
    });

    this.logger.log('✅ Permisos asignados a roles correctamente');
  }
}

// Script principal para ejecutar el seed completo
async function main() {
  const { NestFactory } = require('@nestjs/core');
  const { AppModule } = require('../app.module');

  try {
    const app = await NestFactory.create(AppModule, { logger: ['log', 'error', 'warn'] });
    
    const sequelize = app.get(Sequelize);
    const service = new PermissionsSystemSeedService(sequelize);
    
    await service.seedCompletePermissionsSystem();
    
    console.log('\n🎉 ¡Sistema completo de permisos y roles inicializado exitosamente!');
    console.log('📊 Ahora TODOS los permisos están almacenados en base de datos');
    console.log('🔧 No hay más código hardcodeado - todo es dinámico');
    console.log('👥 Cada rol tiene sus permisos específicos asignados');
    console.log('🔄 Los administradores pueden gestionar permisos dinámicamente');
    
    await app.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error durante la inicialización completa:', error);
    process.exit(1);
  }
}

// Ejecutar el script
if (require.main === module) {
  main();
}