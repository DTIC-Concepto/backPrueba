import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { FacultadesService } from '../src/facultades/facultades.service';
import { CreateFacultadDto } from '../src/facultades/dto/create-facultad.dto';

async function seedFacultades() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const facultadesService = app.get(FacultadesService);

  const facultadesEjemplo: CreateFacultadDto[] = [
    {
      codigo: 'FIEEC',
      nombre: 'Facultad de Ingeniería Eléctrica y Electrónica',
      descripcion: 'Facultad enfocada en la formación de ingenieros eléctricos y electrónicos, telecomunicaciones, control y sistemas de potencia.',
      estadoActivo: true,
    },
    {
      codigo: 'FIS',
      nombre: 'Facultad de Ingeniería de Sistemas',
      descripcion: 'Facultad especializada en la formación de ingenieros en sistemas computacionales, informática y tecnologías de la información.',
      estadoActivo: true,
    },
    {
      codigo: 'FIC',
      nombre: 'Facultad de Ingeniería Civil y Ambiental',
      descripcion: 'Facultad dedicada a la formación de ingenieros civiles y ambientales, con enfoque en infraestructura sostenible.',
      estadoActivo: true,
    },
    {
      codigo: 'FIM',
      nombre: 'Facultad de Ingeniería Mecánica',
      descripcion: 'Facultad especializada en ingeniería mecánica, mecatrónica, procesos industriales y energías renovables.',
      estadoActivo: true,
    },
    {
      codigo: 'FIQ',
      nombre: 'Facultad de Ingeniería Química y Agroindustria',
      descripcion: 'Facultad dedicada a la ingeniería química, de alimentos, biotecnología y procesos agroindustriales.',
      estadoActivo: true,
    },
    {
      codigo: 'FIGEMPA',
      nombre: 'Facultad de Ingeniería en Geología y Petróleos',
      descripcion: 'Facultad especializada en ingeniería geológica, de petróleos, minas y recursos naturales.',
      estadoActivo: true,
    },
    {
      codigo: 'FCH',
      nombre: 'Facultad de Ciencias Humanas y Sociales',
      descripcion: 'Facultad enfocada en ciencias humanas, sociales, educación y desarrollo comunitario.',
      estadoActivo: true,
    },
    {
      codigo: 'FCE',
      nombre: 'Facultad de Ciencias Exactas y Naturales',
      descripcion: 'Facultad dedicada a las ciencias exactas, naturales, matemáticas y estadística aplicada.',
      estadoActivo: true,
    },
    {
      codigo: 'FAR',
      nombre: 'Facultad de Arquitectura y Urbanismo',
      descripcion: 'Facultad especializada en arquitectura, urbanismo, diseño y planificación territorial.',
      estadoActivo: true,
    },
    {
      codigo: 'FCA',
      nombre: 'Facultad de Ciencias Administrativas',
      descripcion: 'Facultad enfocada en administración de empresas, economía, finanzas y gestión organizacional.',
      estadoActivo: true,
    },
    {
      codigo: 'ESFOT',
      nombre: 'Escuela de Formación de Tecnólogos',
      descripcion: 'Escuela especializada en la formación de tecnólogos en diversas áreas técnicas y tecnológicas.',
      estadoActivo: true,
    },
    {
      codigo: 'DGIP',
      nombre: 'Dirección General de Investigación y Posgrado',
      descripcion: 'Unidad académica encargada de coordinar programas de posgrado e investigación institucional.',
      estadoActivo: true,
    },
  ];

  try {
    console.log('🏫 Iniciando seeding de facultades...');
    
    for (const facultadData of facultadesEjemplo) {
      try {
        // Verificar si ya existe
        const existingFacultad = await facultadesService.findByCode(facultadData.codigo);
        
        if (existingFacultad) {
          console.log(`⚠️  Facultad ${facultadData.codigo} ya existe - ${facultadData.nombre}`);
          continue;
        }

        await facultadesService.create(facultadData);
        console.log(`✅ Facultad creada: ${facultadData.codigo} - ${facultadData.nombre}`);
        
      } catch (error) {
        console.error(`❌ Error al crear facultad ${facultadData.codigo}:`, error.message);
      }
    }
    
    console.log('🎉 Seeding de facultades completado');
    
  } catch (error) {
    console.error('❌ Error general en el seeding:', error.message);
  } finally {
    await app.close();
  }
}

seedFacultades();