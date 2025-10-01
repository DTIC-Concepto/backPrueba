import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { UsuariosService } from '../src/usuarios/usuarios.service';
import { CreateUsuarioDto } from '../src/usuarios/dto/create-usuario.dto';
import { RolEnum } from '../src/common/enums/rol.enum';

async function seedDecanos() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const usuariosService = app.get(UsuariosService);

  const decanosEjemplo: CreateUsuarioDto[] = [
    {
      nombres: 'Carlos Eduardo',
      apellidos: 'Rodríguez Silva',
      cedula: '1701234567',
      correo: 'carlos.rodriguez@epn.edu.ec',
      contrasena: 'decano123',
      rol: RolEnum.DECANO,
      estadoActivo: true,
    },
    {
      nombres: 'María Elena',
      apellidos: 'García López',
      cedula: '1701234568',
      correo: 'maria.garcia@epn.edu.ec',
      contrasena: 'decano123',
      rol: RolEnum.DECANO,
      estadoActivo: true,
    },
    {
      nombres: 'Luis Fernando',
      apellidos: 'Martínez Vargas',
      cedula: '1701234569',
      correo: 'luis.martinez@epn.edu.ec',
      contrasena: 'decano123',
      rol: RolEnum.DECANO,
      estadoActivo: true,
    },
    {
      nombres: 'Ana Patricia',
      apellidos: 'Morales Castro',
      cedula: '1701234570',
      correo: 'ana.morales@epn.edu.ec',
      contrasena: 'decano123',
      rol: RolEnum.DECANO,
      estadoActivo: true,
    },
    {
      nombres: 'Jorge Alberto',
      apellidos: 'Sánchez Rivera',
      cedula: '1701234571',
      correo: 'jorge.sanchez@epn.edu.ec',
      contrasena: 'decano123',
      rol: RolEnum.DECANO,
      estadoActivo: true,
    },
    {
      nombres: 'Claudia Beatriz',
      apellidos: 'Herrera Núñez',
      cedula: '1701234572',
      correo: 'claudia.herrera@epn.edu.ec',
      contrasena: 'decano123',
      rol: RolEnum.DECANO,
      estadoActivo: true,
    },
    {
      nombres: 'Roberto Carlos',
      apellidos: 'Vásquez Mendoza',
      cedula: '1701234573',
      correo: 'roberto.vasquez@epn.edu.ec',
      contrasena: 'decano123',
      rol: RolEnum.DECANO,
      estadoActivo: true,
    },
    {
      nombres: 'Sandra Liliana',
      apellidos: 'Torres Guerrero',
      cedula: '1701234574',
      correo: 'sandra.torres@epn.edu.ec',
      contrasena: 'decano123',
      rol: RolEnum.DECANO,
      estadoActivo: true,
    },
    {
      nombres: 'Miguel Ángel',
      apellidos: 'Ramírez Fernández',
      cedula: '1701234575',
      correo: 'miguel.ramirez@epn.edu.ec',
      contrasena: 'decano123',
      rol: RolEnum.DECANO,
      estadoActivo: true,
    },
    {
      nombres: 'Patricia Isabel',
      apellidos: 'Jiménez Cordero',
      cedula: '1701234576',
      correo: 'patricia.jimenez@epn.edu.ec',
      contrasena: 'decano123',
      rol: RolEnum.DECANO,
      estadoActivo: true,
    },
    // Coordinadores para carreras
    {
      nombres: 'David Alexander',
      apellidos: 'Pérez Molina',
      cedula: '1701234577',
      correo: 'david.perez@epn.edu.ec',
      contrasena: 'coord123',
      rol: RolEnum.COORDINADOR,
      estadoActivo: true,
    },
    {
      nombres: 'Carmen Rosa',
      apellidos: 'López Salinas',
      cedula: '1701234578',
      correo: 'carmen.lopez@epn.edu.ec',
      contrasena: 'coord123',
      rol: RolEnum.COORDINADOR,
      estadoActivo: true,
    },
    {
      nombres: 'Francisco Javier',
      apellidos: 'Castillo Ruiz',
      cedula: '1701234579',
      correo: 'francisco.castillo@epn.edu.ec',
      contrasena: 'coord123',
      rol: RolEnum.COORDINADOR,
      estadoActivo: true,
    },
    {
      nombres: 'Lucía Esperanza',
      apellidos: 'Moreno Vega',
      cedula: '1701234580',
      correo: 'lucia.moreno@epn.edu.ec',
      contrasena: 'coord123',
      rol: RolEnum.COORDINADOR,
      estadoActivo: true,
    },
    {
      nombres: 'Andrés Felipe',
      apellidos: 'Gutiérrez Ramos',
      cedula: '1701234581',
      correo: 'andres.gutierrez@epn.edu.ec',
      contrasena: 'coord123',
      rol: RolEnum.COORDINADOR,
      estadoActivo: true,
    },
  ];

  try {
    console.log('👥 Iniciando seeding de decanos y coordinadores...');
    
    for (const usuarioData of decanosEjemplo) {
      try {
        // Verificar si ya existe
        const existingUser = await usuariosService.findByEmail(usuarioData.correo);
        
        if (existingUser) {
          console.log(`⚠️  Usuario ${usuarioData.correo} ya existe - ${usuarioData.nombres} ${usuarioData.apellidos}`);
          continue;
        }

        const usuario = await usuariosService.create(usuarioData);
        console.log(`✅ Usuario ${usuarioData.rol} creado (ID: ${usuario.id}): ${usuarioData.nombres} ${usuarioData.apellidos} - ${usuarioData.correo}`);
        
      } catch (error) {
        console.error(`❌ Error al crear usuario ${usuarioData.correo}:`, error.message);
      }
    }
    
    console.log('🎉 Seeding de decanos y coordinadores completado');
    console.log('📧 Correos creados con contraseña por defecto:');
    console.log('   - Decanos: "decano123"');
    console.log('   - Coordinadores: "coord123"');
    
  } catch (error) {
    console.error('❌ Error general en el seeding:', error.message);
  } finally {
    await app.close();
  }
}

seedDecanos();