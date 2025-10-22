/**
 * Script de migración: Migrar coordinadores a usuario_carreras
 * 
 * Este script:
 * 1. Crea la tabla usuario_carreras si no existe
 * 2. Migra todos los coordinadores existentes de la tabla carreras
 *    a la tabla usuario_carreras con esCoordinador = true
 * 3. No elimina la columna coordinadorId para mantener compatibilidad
 * 
 * Ejecutar con: npx ts-node scripts/migrate-coordinadores.ts
 */

import { Sequelize } from 'sequelize';
import * as dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

async function migrateCoordinadores() {
  // Configurar conexión a la base de datos usando Sequelize básico
  const sequelize = new Sequelize(
    process.env.DB_NAME || 'poliacredita_db',
    process.env.DB_USER || 'postgres',
    process.env.DB_PASS || 'postgres',
    {
      dialect: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      logging: console.log,
    }
  );

  try {
    console.log('🔄 Iniciando migración de coordinadores...\n');

    // Crear tabla usuario_carreras si no existe
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS usuario_carreras (
        id SERIAL PRIMARY KEY,
        usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
        carrera_id INTEGER NOT NULL REFERENCES carreras(id),
        es_coordinador BOOLEAN NOT NULL DEFAULT false,
        estado_activo BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Tabla usuario_carreras creada/verificada\n');

    // Obtener todas las carreras con coordinadores
    const [carreras]: any = await sequelize.query(`
      SELECT id, codigo, nombre, "coordinadorId"
      FROM carreras
      WHERE "coordinadorId" IS NOT NULL
    `);

    console.log(`📊 Total de carreras con coordinador: ${carreras.length}\n`);

    if (carreras.length === 0) {
      console.log('⚠️  No hay coordinadores para migrar');
      await sequelize.close();
      return;
    }

    let migrados = 0;
    let existentes = 0;
    let errores = 0;

    // Migrar cada coordinador
    for (const carrera of carreras) {
      try {
        // Verificar si ya existe la relación
        const [existing]: any = await sequelize.query(`
          SELECT id FROM usuario_carreras
          WHERE usuario_id = ${carrera.coordinadorId}
            AND carrera_id = ${carrera.id}
            AND es_coordinador = true
          LIMIT 1
        `);

        if (existing && existing.length > 0) {
          console.log(`⏭️  [${carrera.codigo}] Ya existe relación para coordinador ${carrera.coordinadorId}`);
          existentes++;
          continue;
        }

        // Crear la relación en usuario_carreras
        await sequelize.query(`
          INSERT INTO usuario_carreras (usuario_id, carrera_id, es_coordinador, estado_activo, created_at, updated_at)
          VALUES (${carrera.coordinadorId}, ${carrera.id}, true, true, NOW(), NOW())
        `);

        console.log(`✅ [${carrera.codigo}] Coordinador ${carrera.coordinadorId} migrado exitosamente`);
        migrados++;
      } catch (error: any) {
        console.error(`❌ [${carrera.codigo}] Error al migrar coordinador:`, error.message);
        errores++;
      }
    }

    console.log('\n📈 Resumen de migración:');
    console.log(`  ✅ Migrados exitosamente: ${migrados}`);
    console.log(`  ⏭️  Ya existían: ${existentes}`);
    console.log(`  ❌ Errores: ${errores}`);
    console.log(`  📊 Total procesados: ${carreras.length}\n`);

    // Verificar resultados
    const [result]: any = await sequelize.query(`
      SELECT COUNT(*) as count FROM usuario_carreras WHERE es_coordinador = true
    `);
    const totalRelaciones = result[0].count;

    console.log(`🎯 Total de relaciones coordinador en usuario_carreras: ${totalRelaciones}`);
    console.log('\n✅ Migración completada exitosamente');
    console.log('⚠️  NOTA: La columna coordinadorId en la tabla carreras NO fue eliminada para mantener compatibilidad\n');

  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    throw error;
  } finally {
    await sequelize.close();
    console.log('🔌 Conexión a la base de datos cerrada');
  }
}

// Ejecutar migración
migrateCoordinadores()
  .then(() => {
    console.log('\n🎉 Proceso completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Error fatal:', error);
    process.exit(1);
  });
