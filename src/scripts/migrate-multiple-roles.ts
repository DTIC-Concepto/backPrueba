import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { UsuarioModel } from '../usuarios/models/usuario.model';
import { UsuarioRolModel } from '../common/models/usuario-rol.model';
import { Sequelize } from 'sequelize-typescript';
import { Op, QueryTypes } from 'sequelize';

/**
 * Script de migración para agregar soporte de múltiples roles por usuario
 * Mantiene compatibilidad con el sistema existente
 */
async function migrateMultipleRoles() {
  console.log('🚀 Iniciando migración de múltiples roles...');
  
  const app = await NestFactory.createApplicationContext(AppModule);
  const sequelize = app.get(Sequelize);

  try {
    // 1. Crear la tabla usuario_roles si no existe
    console.log('📋 Creando tabla usuario_roles...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS usuario_roles (
        id SERIAL PRIMARY KEY,
        usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
        rol VARCHAR(50) NOT NULL CHECK (rol IN (
          'ADMINISTRADOR', 'DGIP', 'PROFESOR', 'DECANO', 
          'SUBDECANO', 'JEFE_DEPARTAMENTO', 'COORDINADOR', 'CEI'
        )),
        activo BOOLEAN NOT NULL DEFAULT true,
        observaciones TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(usuario_id, rol)
      );
    `);
    console.log('✅ Tabla usuario_roles creada exitosamente');

    // 2. Crear índices para optimizar consultas
    console.log('📊 Creando índices...');
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_usuario_roles_usuario_id ON usuario_roles(usuario_id);
      CREATE INDEX IF NOT EXISTS idx_usuario_roles_rol ON usuario_roles(rol);
      CREATE INDEX IF NOT EXISTS idx_usuario_roles_activo ON usuario_roles(activo);
    `);
    console.log('✅ Índices creados exitosamente');

    // 3. Migrar roles existentes de la tabla usuarios a usuario_roles
    console.log('📥 Migrando roles existentes...');
    const usuariosExistentes = await UsuarioModel.findAll();

    console.log(`📊 Encontrados ${usuariosExistentes.length} usuarios con roles`);

    for (const usuario of usuariosExistentes) {
      try {
        // Verificar si ya existe el rol en la tabla intermedia
        const rolExistente = await sequelize.query(`
          SELECT id FROM usuario_roles 
          WHERE usuario_id = :usuarioId AND rol = :rol
        `, {
          replacements: { usuarioId: usuario.id, rol: usuario.rol },
          type: QueryTypes.SELECT
        }) as any[];

        if (rolExistente.length === 0) {
          // Insertar el rol en la tabla intermedia
          await sequelize.query(`
            INSERT INTO usuario_roles (usuario_id, rol, activo, observaciones, created_at, updated_at)
            VALUES (:usuarioId, :rol, true, 'Migrado automáticamente desde rol principal', NOW(), NOW())
          `, {
            replacements: { 
              usuarioId: usuario.id, 
              rol: usuario.rol 
            }
          });
          
          console.log(`  ✅ Migrado usuario ${usuario.id} con rol ${usuario.rol}`);
        } else {
          console.log(`  ⏭️  Usuario ${usuario.id} ya tiene rol ${usuario.rol} en tabla intermedia`);
        }
      } catch (error) {
        console.error(`  ❌ Error migrando usuario ${usuario.id}:`, error.message);
      }
    }

    console.log('✅ Migración de roles existentes completada');

    // 4. Crear trigger para mantener sincronización (opcional)
    console.log('🔄 Creando trigger de sincronización...');
    await sequelize.query(`
      CREATE OR REPLACE FUNCTION sync_usuario_rol()
      RETURNS TRIGGER AS $$
      BEGIN
        -- Si se actualiza el rol principal, actualizar en usuario_roles
        IF TG_OP = 'UPDATE' AND OLD.rol IS DISTINCT FROM NEW.rol THEN
          -- Desactivar el rol anterior si existe
          IF OLD.rol IS NOT NULL THEN
            UPDATE usuario_roles 
            SET activo = false, updated_at = NOW()
            WHERE usuario_id = NEW.id AND rol = OLD.rol;
          END IF;
          
          -- Insertar o activar el nuevo rol
          IF NEW.rol IS NOT NULL THEN
            INSERT INTO usuario_roles (usuario_id, rol, activo, observaciones, created_at, updated_at)
            VALUES (NEW.id, NEW.rol, true, 'Actualizado desde rol principal', NOW(), NOW())
            ON CONFLICT (usuario_id, rol) DO UPDATE SET 
              activo = true, 
              observaciones = 'Reactivado desde rol principal',
              updated_at = NOW();
          END IF;
        END IF;
        
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      DROP TRIGGER IF EXISTS trigger_sync_usuario_rol ON usuarios;
      CREATE TRIGGER trigger_sync_usuario_rol
        AFTER UPDATE ON usuarios
        FOR EACH ROW
        EXECUTE FUNCTION sync_usuario_rol();
    `);
    console.log('✅ Trigger de sincronización creado');

    // 5. Sincronizar modelos con Sequelize
    console.log('🔄 Sincronizando modelos de Sequelize...');
    await UsuarioRolModel.sync({ alter: true });
    console.log('✅ Modelos sincronizados');

    console.log('🎉 Migración de múltiples roles completada exitosamente!');
    console.log('');
    console.log('📋 Resumen:');
    console.log('  • Tabla usuario_roles creada');
    console.log('  • Índices optimizados agregados');
    console.log(`  • ${usuariosExistentes.length} roles migrados`);
    console.log('  • Trigger de sincronización activado');
    console.log('  • Compatibilidad con código existente mantenida');

  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    throw error;
  } finally {
    await app.close();
  }
}

// Ejecutar la migración si el script se ejecuta directamente
if (require.main === module) {
  migrateMultipleRoles()
    .then(() => {
      console.log('✅ Migración completada exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error en la migración:', error);
      process.exit(1);
    });
}

export { migrateMultipleRoles };