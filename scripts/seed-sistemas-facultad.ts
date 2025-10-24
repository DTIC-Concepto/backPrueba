/**
 * Script de seed: Crear Facultad de Sistemas con carreras, coordinadores, profesores, RA y OPP
 * 
 * Este script:
 * 1. Crea la facultad "Sistemas"
 * 2. Crea 4 carreras: Software, Computación, Ciencia de datos, IA
 * 3. Asigna coordinadores y profesores a cada carrera
 * 4. Para Software: crea RAs (Generales y Específicos) y OPPs
 * 5. Mantiene los IDs creados para relaciones correctas
 * 
 * Ejecutar con: npx ts-node scripts/seed-sistemas-facultad.ts
 */

import { Sequelize } from 'sequelize';
import * as dotenv from 'dotenv';
import * as bcrypt from 'bcrypt';

dotenv.config();

// Interfaces para almacenar IDs creados
interface FacultadData {
  id: number;
  nombre: string;
}

interface CarreraData {
  id: number;
  codigo: string;
  nombre: string;
  coordinadorId: number;
}

interface UsuarioData {
  id: number;
  nombres: string;
  apellidos: string;
  correo: string;
}

async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
}

async function seedSistemasFacultad() {
  const sequelize = new Sequelize(
    process.env.DB_NAME || 'poliacredita_db',
    process.env.DB_USER || 'postgres',
    process.env.DB_PASS || 'postgres',
    {
      dialect: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      logging: false, // Desactivar logs para mayor claridad
    }
  );

  try {
    console.log('🚀 Iniciando seed de Facultad de Sistemas...\n');

    // ==================== 1. CREAR FACULTAD ====================
    console.log('📚 Creando Facultad de Sistemas...');
    const [facultadResult]: any = await sequelize.query(`
      INSERT INTO facultades (nombre, codigo, descripcion, "estadoActivo", "createdAt", "updatedAt")
      VALUES (
        'Sistemas',
        'FISIS',
        'Facultad de Ingeniería en Sistemas Informáticos',
        true,
        NOW(),
        NOW()
      )
      RETURNING id, nombre
    `);
    const facultad: FacultadData = facultadResult[0];
    console.log(`✅ Facultad creada: ${facultad.nombre} (ID: ${facultad.id})\n`);

    // ==================== 2. CREAR COORDINADORES ====================
    console.log('👥 Creando coordinadores para las carreras...');
    
    const coordinadores = [
      { nombres: 'María Elena', apellidos: 'Rodríguez Castro', correo: 'maria.rodriguez.sistemas@epn.edu.ec', cedula: '0420567890' },
      { nombres: 'Carlos Alberto', apellidos: 'Mendoza Flores', correo: 'carlos.mendoza.sistemas@epn.edu.ec', cedula: '0421678901' },
      { nombres: 'Ana Patricia', apellidos: 'Vargas Luna', correo: 'ana.vargas.sistemas@epn.edu.ec', cedula: '0422789012' },
      { nombres: 'Roberto Xavier', apellidos: 'Sánchez Torres', correo: 'roberto.sanchez.sistemas@epn.edu.ec', cedula: '0423890123' },
    ];

    const coordinadoresCreados: UsuarioData[] = [];
    const passwordHash = await hashPassword('Coordinador2024!');

    for (const coord of coordinadores) {
      const [userResult]: any = await sequelize.query(`
        INSERT INTO usuarios (nombres, apellidos, cedula, correo, contrasena, rol, "facultadId", "estadoActivo", "createdAt", "updatedAt")
        VALUES (
          '${coord.nombres}',
          '${coord.apellidos}',
          '${coord.cedula}',
          '${coord.correo}',
          '${passwordHash}',
          'COORDINADOR',
          ${facultad.id},
          true,
          NOW(),
          NOW()
        )
        RETURNING id, nombres, apellidos, correo
      `);
      coordinadoresCreados.push(userResult[0]);
      
      // Crear rol en usuario_roles
      await sequelize.query(`
        INSERT INTO usuario_roles (usuario_id, rol, activo, created_at, updated_at)
        VALUES (${userResult[0].id}, 'COORDINADOR', true, NOW(), NOW())
      `);
      
      console.log(`  ✅ Coordinador: ${userResult[0].nombres} ${userResult[0].apellidos} (ID: ${userResult[0].id})`);
    }

    console.log('\n');

    // ==================== 3. CREAR CARRERAS ====================
    console.log('🎓 Creando carreras...');
    
    const carrerasData = [
      { codigo: 'ISW', nombre: 'Software', duracion: 10, modalidad: 'PRESENCIAL' },
      { codigo: 'ICC', nombre: 'Computación', duracion: 10, modalidad: 'PRESENCIAL' },
      { codigo: 'ICD', nombre: 'Ciencia de datos', duracion: 10, modalidad: 'PRESENCIAL' },
      { codigo: 'IIA', nombre: 'Inteligencia Artificial', duracion: 10, modalidad: 'PRESENCIAL' },
    ];

    const carrerasCreadas: CarreraData[] = [];

    for (let i = 0; i < carrerasData.length; i++) {
      const carrera = carrerasData[i];
      const coordinador = coordinadoresCreados[i];
      
      const [carreraResult]: any = await sequelize.query(`
        INSERT INTO carreras (codigo, nombre, "facultadId", "coordinadorId", duracion, modalidad, "estadoActivo", "createdAt", "updatedAt")
        VALUES (
          '${carrera.codigo}',
          '${carrera.nombre}',
          ${facultad.id},
          ${coordinador.id},
          ${carrera.duracion},
          '${carrera.modalidad}',
          true,
          NOW(),
          NOW()
        )
        RETURNING id, codigo, nombre, "coordinadorId"
      `);
      
      carrerasCreadas.push(carreraResult[0]);
      
      // Crear relación en usuario_carreras (coordinador)
      await sequelize.query(`
        INSERT INTO usuario_carreras (usuario_id, carrera_id, es_coordinador, estado_activo, created_at, updated_at)
        VALUES (${coordinador.id}, ${carreraResult[0].id}, true, true, NOW(), NOW())
      `);
      
      console.log(`  ✅ Carrera: ${carreraResult[0].nombre} (ID: ${carreraResult[0].id}) - Coordinador: ${coordinador.nombres} ${coordinador.apellidos}`);
    }

    console.log('\n');

    // ==================== 4. CREAR PROFESORES ====================
    console.log('👨‍🏫 Creando profesores...');
    
    const profesoresData = [
      // Profesores para Software (incluyendo uno principal para login)
      { nombres: 'Juan Carlos', apellidos: 'Pérez González', correo: 'juan.perez.software@epn.edu.ec', cedula: '0408901234', carreras: ['Software'] },
      { nombres: 'Laura Fernanda', apellidos: 'Morales Ruiz', correo: 'laura.morales.software@epn.edu.ec', cedula: '0409012345', carreras: ['Software', 'Computación'] },
      { nombres: 'Diego Andrés', apellidos: 'Ramírez Silva', correo: 'diego.ramirez.software@epn.edu.ec', cedula: '0410123456', carreras: ['Software'] },
      
      // Profesores para Computación
      { nombres: 'Sofía Valentina', apellidos: 'Castro Herrera', correo: 'sofia.castro.comp@epn.edu.ec', cedula: '0411234567', carreras: ['Computación'] },
      { nombres: 'Miguel Ángel', apellidos: 'Ortiz Paredes', correo: 'miguel.ortiz.comp@epn.edu.ec', cedula: '0412345678', carreras: ['Computación', 'Ciencia de datos'] },
      
      // Profesores para Ciencia de datos
      { nombres: 'Gabriela Andrea', apellidos: 'López Vásquez', correo: 'gabriela.lopez.datos@epn.edu.ec', cedula: '0413456789', carreras: ['Ciencia de datos'] },
      { nombres: 'Fernando José', apellidos: 'Gutiérrez Mora', correo: 'fernando.gutierrez.datos@epn.edu.ec', cedula: '0414567890', carreras: ['Ciencia de datos', 'Inteligencia Artificial'] },
      
      // Profesores para Inteligencia Artificial
      { nombres: 'Carolina Isabel', apellidos: 'Navarro Chávez', correo: 'carolina.navarro.ia@epn.edu.ec', cedula: '0415678901', carreras: ['Inteligencia Artificial'] },
      { nombres: 'Andrés Felipe', apellidos: 'Rojas Medina', correo: 'andres.rojas.ia@epn.edu.ec', cedula: '0416789012', carreras: ['Inteligencia Artificial', 'Software'] },
    ];

    const passwordProfesor = await hashPassword('Profesor2024!');
    const profesoresCreados: (UsuarioData & { carrerasAsignadas: string[] })[] = [];

    for (const prof of profesoresData) {
      const [profResult]: any = await sequelize.query(`
        INSERT INTO usuarios (nombres, apellidos, cedula, correo, contrasena, rol, "facultadId", "estadoActivo", "createdAt", "updatedAt")
        VALUES (
          '${prof.nombres}',
          '${prof.apellidos}',
          '${prof.cedula}',
          '${prof.correo}',
          '${passwordProfesor}',
          'PROFESOR',
          ${facultad.id},
          true,
          NOW(),
          NOW()
        )
        RETURNING id, nombres, apellidos, correo
      `);
      
      // Crear rol en usuario_roles
      await sequelize.query(`
        INSERT INTO usuario_roles (usuario_id, rol, activo, created_at, updated_at)
        VALUES (${profResult[0].id}, 'PROFESOR', true, NOW(), NOW())
      `);
      
      // Asignar a carreras mediante usuario_carreras
      for (const carreraNombre of prof.carreras) {
        const carrera = carrerasCreadas.find(c => c.nombre === carreraNombre);
        if (carrera) {
          await sequelize.query(`
            INSERT INTO usuario_carreras (usuario_id, carrera_id, es_coordinador, estado_activo, created_at, updated_at)
            VALUES (${profResult[0].id}, ${carrera.id}, false, true, NOW(), NOW())
          `);
        }
      }
      
      profesoresCreados.push({ ...profResult[0], carrerasAsignadas: prof.carreras });
      console.log(`  ✅ Profesor: ${profResult[0].nombres} ${profResult[0].apellidos} - Carreras: ${prof.carreras.join(', ')}`);
    }

    console.log('\n');

    // ==================== 5. CREAR RAs PARA SOFTWARE ====================
    const carreraSoftware = carrerasCreadas.find(c => c.nombre === 'Software')!;
    console.log(`📝 Creando Resultados de Aprendizaje para ${carreraSoftware.nombre}...\n`);

    // RAs Generales
    const rasGenerales = [
      'Ser capaz de identificar las necesidades de los sectores estratégicos públicos o privados del país, que requieren una solución a través de productos de software eficientes y costo-efectivos.',
      'Demostrar hábitos de trabajo efectivos, el liderazgo, la buena comunicación, el respeto al medio ambiente, la ética profesional, que le permita trabajar individualmente y como parte de un equipo.',
      'Fomentar el desarrollo profesional continuo y vanguardista acorde a nuevos modelos, técnicas y tecnologías que van surgiendo en la industria del software.',
    ];

    console.log('📌 Creando RAs Generales...');
    for (let i = 0; i < rasGenerales.length; i++) {
      const [raResult]: any = await sequelize.query(`
        INSERT INTO resultados_aprendizaje (codigo, descripcion, tipo, "carreraId", "estadoActivo", "createdAt", "updatedAt")
        VALUES (
          'RG${i + 1}',
          '${rasGenerales[i].replace(/'/g, "''")}',
          'GENERAL',
          ${carreraSoftware.id},
          true,
          NOW(),
          NOW()
        )
        RETURNING id, codigo
      `);
      console.log(`  ✅ RA General: ${raResult[0].codigo}`);
    }

    // RAs Específicos
    const rasEspecificos = [
      'Aplicar teorías, metodologías, estándares y tecnologías apropiadas, para crear soluciones de software, mediante el análisis, diseño, desarrollo, implementación, verificación, documentación y gestión.',
      'Evaluar aspectos interdisciplinares, de infraestructuras tecnológicas existentes, de tecnología emergente, legales, éticos, económicos, ambientales y sociales, para diseñar soluciones de Software de Calidad.',
      'Emplear principios y herramientas de investigación, para generar nuevas formas de aplicación de la Ingeniería de Software en los sectores industriales y académicos estratégicos del país.',
      'Construir un sistema de aprendizaje autónomo mediante el aprendizaje activo, motivado, participativo, modelado, necesario, y crítico de la diversidad de fuentes y tipo de información, considerando que la Ingeniería de Software es parte de un campo que cambia muy rápidamente.',
      'Desarrollar la creatividad y emprendimiento a través de la investigación de nuevas formas de aplicación de la Ingeniería de Software para satisfacer las necesidades de transformación en los sectores estratégicos nacionales.',
      'Emplear los fundamentos de comunicación profesional, técnica y científica, para transferir efectivamente los conocimientos adquiridos durante el auto aprendizaje, la investigación y el ejercicio profesional.',
      'Crear sistemas de Software, aplicando la Ingeniería de Software y los estándares más adecuados, asegurando la calidad del proceso y del producto de software; tomando en cuenta cuestiones legales y sociales, y practicando los hábitos de trabajo ético y efectivo.',
      'Demostrar capacidad de trabajo individual y en equipo logrando la conciliación de objetivos conflictivos en un entorno típico de desarrollo de Software, compromisos aceptables dentro de las limitaciones de costo, tiempo, conocimiento, sistemas existentes, entre otros.',
      'Utilizar técnicas, herramientas y estándares que permitan auditar el desempeño y cumplimiento de soluciones de Software.',
    ];

    console.log('📌 Creando RAs Específicos...');
    for (let i = 0; i < rasEspecificos.length; i++) {
      const [raResult]: any = await sequelize.query(`
        INSERT INTO resultados_aprendizaje (codigo, descripcion, tipo, "carreraId", "estadoActivo", "createdAt", "updatedAt")
        VALUES (
          'RE${i + 1}',
          '${rasEspecificos[i].replace(/'/g, "''")}',
          'ESPECIFICO',
          ${carreraSoftware.id},
          true,
          NOW(),
          NOW()
        )
        RETURNING id, codigo
      `);
      console.log(`  ✅ RA Específico: ${raResult[0].codigo}`);
    }

    console.log('\n');

    // ==================== 6. CREAR OPPs PARA SOFTWARE ====================
    console.log('🎯 Creando Objetivos del Programa (OPP) para Software...\n');

    const opps = [
      'Verificación, validación y aseguramiento de la calidad del Software.',
      'Administración de proyectos de Software.',
      'Investigación aplicada en proyectos de conceptualización, desarrollo, innovación y transferencia de Software.',
      'Ingeniería de Software para el desarrollo de Sistemas de Información y Sistemas Inteligentes.',
      'Emprendimiento de empresas de investigación, innovación, desarrollo y comercialización de Software.',
    ];

    for (let i = 0; i < opps.length; i++) {
      const [oppResult]: any = await sequelize.query(`
        INSERT INTO opps (codigo, descripcion, "carreraId", "estadoActivo", "createdAt", "updatedAt")
        VALUES (
          'OPP${i + 1}',
          '${opps[i].replace(/'/g, "''")}',
          ${carreraSoftware.id},
          true,
          NOW(),
          NOW()
        )
        RETURNING id, codigo
      `);
      console.log(`  ✅ OPP: ${oppResult[0].codigo} - ${opps[i].substring(0, 50)}...`);
    }

    console.log('\n');

    // ==================== RESUMEN ====================
    console.log('📊 =============== RESUMEN ===============\n');
    console.log(`✅ Facultad creada: ${facultad.nombre} (ID: ${facultad.id})`);
    console.log(`✅ Carreras creadas: ${carrerasCreadas.length}`);
    carrerasCreadas.forEach(c => {
      console.log(`   - ${c.nombre} (ID: ${c.id}) - Código: ${c.codigo}`);
    });
    console.log(`✅ Coordinadores creados: ${coordinadoresCreados.length}`);
    console.log(`✅ Profesores creados: ${profesoresCreados.length}`);
    console.log(`✅ RAs creados para Software: ${rasGenerales.length + rasEspecificos.length} (${rasGenerales.length} Generales + ${rasEspecificos.length} Específicos)`);
    console.log(`✅ OPPs creados para Software: ${opps.length}\n`);

    console.log('🔑 =============== CREDENCIALES ===============\n');
    console.log('📌 COORDINADORES (password: Coordinador2024!):');
    coordinadoresCreados.forEach((coord, i) => {
      console.log(`   ${coord.correo} - ${carrerasCreadas[i].nombre}`);
    });
    
    console.log('\n📌 PROFESORES (password: Profesor2024!):');
    profesoresCreados.forEach(prof => {
      console.log(`   ${prof.correo} - Carreras: ${prof.carrerasAsignadas.join(', ')}`);
    });
    
    console.log('\n🎯 PROFESOR RECOMENDADO PARA LOGIN (Software):');
    const profesorSoftware = profesoresCreados[0]; // Juan Carlos Pérez
    console.log(`   Email: ${profesorSoftware.correo}`);
    console.log(`   Password: Profesor2024!`);
    console.log(`   Carreras asignadas: ${profesorSoftware.carrerasAsignadas.join(', ')}`);
    console.log(`   Rol: PROFESOR\n`);

    await sequelize.close();
    console.log('✅ Seed completado exitosamente\n');
    
  } catch (error: any) {
    console.error('❌ Error durante el seed:', error.message);
    console.error(error);
    throw error;
  }
}

// Ejecutar seed
seedSistemasFacultad()
  .then(() => {
    console.log('🎉 Proceso completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error fatal:', error);
    process.exit(1);
  });
