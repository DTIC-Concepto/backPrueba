import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { Logger } from '@nestjs/common';
import { PermisosService } from '../common/services/permisos.service';
import { RolEnum } from '../common/enums/rol.enum';

async function initializePermissionsSystem() {
  const logger = new Logger('PermissionsInit');
  
  logger.log('🚀 Iniciando inicialización del sistema de permisos dinámico...');
  
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn'],
  });
  
  try {
    const permisosService = app.get(PermisosService);

    logger.log('📋 === INICIALIZACIÓN SISTEMA DE PERMISOS DINÁMICO ===');
    
    // 1. Crear tablas manualmente (evitar conflictos con sync)
    logger.log('\n🔄 1. CREANDO TABLAS DE PERMISOS...');
    
    const sequelize = app.get('SequelizeInstance');
    
    // Crear tabla permisos
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS permisos (
        id SERIAL PRIMARY KEY,
        codigo VARCHAR(100) UNIQUE NOT NULL,
        nombre VARCHAR(255) NOT NULL,
        descripcion TEXT,
        categoria VARCHAR(100) NOT NULL,
        modulo VARCHAR(100) NOT NULL,
        activo BOOLEAN NOT NULL DEFAULT true,
        nivel_riesgo INTEGER DEFAULT 0,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);
    
    // Crear tabla rol_permisos
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS rol_permisos (
        id SERIAL PRIMARY KEY,
        rol VARCHAR(50) NOT NULL CHECK (rol IN (
          'ADMINISTRADOR', 'DGIP', 'PROFESOR', 'DECANO', 
          'SUBDECANO', 'JEFE_DEPARTAMENTO', 'COORDINADOR', 'CEI'
        )),
        permiso_id INTEGER NOT NULL REFERENCES permisos(id) ON DELETE CASCADE,
        activo BOOLEAN NOT NULL DEFAULT true,
        observaciones TEXT,
        asignado_por INTEGER,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(rol, permiso_id)
      );
    `);
    
    // Crear índices
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_permisos_codigo ON permisos(codigo);
      CREATE INDEX IF NOT EXISTS idx_permisos_categoria ON permisos(categoria);
      CREATE INDEX IF NOT EXISTS idx_permisos_activo ON permisos(activo);
      
      CREATE INDEX IF NOT EXISTS idx_rol_permisos_rol ON rol_permisos(rol);
      CREATE INDEX IF NOT EXISTS idx_rol_permisos_permiso ON rol_permisos(permiso_id);
      CREATE INDEX IF NOT EXISTS idx_rol_permisos_activo ON rol_permisos(activo);
    `);
    
    logger.log('✅ Tablas de permisos creadas correctamente');

    // 2. Inicializar permisos por defecto
    logger.log('\n📝 2. CREANDO PERMISOS POR DEFECTO...');
    await permisosService.seedDefaultPermissions();
    
    const stats = await permisosService.getPermissionStats();
    logger.log(`✅ Sistema inicializado:`);
    logger.log(`   📊 Total permisos: ${stats.totalPermisos}`);
    logger.log(`   ✅ Permisos activos: ${stats.permisosActivos}`);
    logger.log(`   🏷️ Categorías: ${stats.categorias.length} (${stats.categorias.join(', ')})`);
    logger.log(`   📦 Módulos: ${stats.modulos.length} (${stats.modulos.join(', ')})`);

    // 3. Asignar permisos por defecto a roles
    logger.log('\n🎭 3. ASIGNANDO PERMISOS A ROLES...');
    
    // Definir asignaciones por defecto
    const rolePermissionAssignments = {
      [RolEnum.ADMINISTRADOR]: [
        'manage_users', 'create_users', 'update_users', 'delete_users',
        'manage_faculties', 'create_faculties', 'update_faculties',
        'manage_careers', 'create_careers', 'update_careers',
        'view_all_dashboards', 'generate_all_reports', 'manage_system_settings',
        'view_audit_logs', 'manage_roles', 'view_profile', 'update_profile'
      ],
      [RolEnum.DGIP]: [
        'view_all_dashboards', 'generate_all_reports',
        'view_profile', 'update_profile'
      ],
      [RolEnum.DECANO]: [
        'create_careers', 'update_careers', 'view_faculty_dashboard',
        'generate_faculty_reports', 'view_profile', 'update_profile'
      ],
      [RolEnum.SUBDECANO]: [
        'update_careers', 'view_faculty_dashboard', 'generate_faculty_reports',
        'view_profile', 'update_profile'
      ],
      [RolEnum.JEFE_DEPARTAMENTO]: [
        'view_faculty_dashboard', 'generate_faculty_reports',
        'view_profile', 'update_profile'
      ],
      [RolEnum.COORDINADOR]: [
        'view_career_dashboard', 'generate_career_reports',
        'view_profile', 'update_profile'
      ],
      [RolEnum.PROFESOR]: [
        'view_profile', 'update_profile'
      ],
      [RolEnum.CEI]: [
        'view_all_dashboards', 'generate_all_reports',
        'view_profile', 'update_profile'
      ],
    };

    let totalAssignments = 0;
    for (const [rol, permissionCodes] of Object.entries(rolePermissionAssignments)) {
      logger.log(`   🎭 Asignando permisos a rol: ${rol}`);
      
      for (const permissionCode of permissionCodes) {
        try {
          const permiso = await permisosService.getPermisoByCodigo(permissionCode);
          
          await permisosService.assignPermissionToRole({
            rol: rol as RolEnum,
            permiso_id: permiso.id,
            activo: true,
            observaciones: 'Asignación inicial del sistema',
          });
          
          totalAssignments++;
        } catch (error) {
          if (error.message.includes('ya está asignado')) {
            // Permiso ya asignado - continuar
            continue;
          } else if (error.message.includes('no encontrado')) {
            logger.warn(`   ⚠️ Permiso ${permissionCode} no encontrado - omitiendo`);
          } else {
            logger.error(`   ❌ Error asignando ${permissionCode} a ${rol}: ${error.message}`);
          }
        }
      }
    }

    logger.log(`✅ ${totalAssignments} asignaciones de permisos completadas`);

    // 4. Verificar asignaciones
    logger.log('\n🔍 4. VERIFICANDO ASIGNACIONES...');
    
    const rolesWithPermissions = await permisosService.getAllRolesWithPermissions();
    for (const { rol, permisos } of rolesWithPermissions) {
      logger.log(`   🎭 ${rol}: ${permisos.length} permisos asignados`);
    }

    // 5. Estadísticas finales
    logger.log('\n📊 5. ESTADÍSTICAS FINALES:');
    const finalStats = await permisosService.getPermissionStats();
    logger.log(`   📊 Total permisos: ${finalStats.totalPermisos}`);
    logger.log(`   ✅ Permisos activos: ${finalStats.permisosActivos}`);
    logger.log(`   🔗 Total asignaciones: ${finalStats.asignaciones}`);
    logger.log(`   🏷️ Categorías: ${finalStats.categorias.join(', ')}`);
    logger.log(`   📦 Módulos: ${finalStats.modulos.join(', ')}`);

    logger.log('\n🎉 INICIALIZACIÓN COMPLETADA EXITOSAMENTE');
    logger.log('\n📋 CARACTERÍSTICAS DEL SISTEMA:');
    logger.log('   ✅ Permisos dinámicos almacenados en base de datos');
    logger.log('   ✅ Permisos editables por administradores');
    logger.log('   ✅ Asignación flexible de permisos a roles');
    logger.log('   ✅ Auditoría completa de cambios');
    logger.log('   ✅ Compatibilidad con sistema anterior mantenida');
    logger.log('   ✅ Fallback automático a permisos hardcodeados');
    logger.log('\n💡 PRÓXIMOS PASOS:');
    logger.log('   🔧 Los administradores pueden modificar permisos vía API');
    logger.log('   📝 Los permisos se pueden asignar/remover dinámicamente');
    logger.log('   🎯 El sistema funciona híbrido (DB + hardcoded fallback)');

  } catch (error) {
    logger.error('❌ Error durante la inicialización:', error);
  } finally {
    await app.close();
  }
}

// Ejecutar la inicialización
initializePermissionsSystem()
  .then(() => {
    console.log('🏁 Inicialización finalizada');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error fatal:', error);
    process.exit(1);
  });