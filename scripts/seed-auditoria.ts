import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { AuditoriaService } from '../src/auditoria/auditoria.service';
import { EventoTipoEnum } from '../src/auditoria/enums/evento-tipo.enum';

async function seedAuditoriaData() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const auditoriaService = app.get(AuditoriaService);

  console.log('🌱 Sembrando datos de auditoría...');

  // Datos de ejemplo que coinciden con la imagen del prototipo
  // Usando solo los usuarios disponibles: ID 5 (admin) y ID 6 (profesor)
  const eventosEjemplo = [
    {
      usuarioId: 5, // admin@epn.edu.ec
      tipoEvento: EventoTipoEnum.FACULTAD_CREADA,
      descripcion: "Creó nueva facultad 'FIEC'",
      entidad: 'facultad',
      entidadId: 1,
      metadatos: { nombre: 'FIEC' },
      createdAt: new Date(Date.now() - 5 * 60 * 1000), // Hace 5 min
    },
    {
      usuarioId: 6, // profesor@epn.edu.ec
      tipoEvento: EventoTipoEnum.CARRERA_ACTUALIZADA,
      descripcion: "Actualizó datos de carrera 'Ingeniería Civil'",
      entidad: 'carrera',
      entidadId: 1,
      metadatos: { nombre: 'Ingeniería Civil' },
      createdAt: new Date(Date.now() - 15 * 60 * 1000), // Hace 15 min
    },
    {
      usuarioId: 6, // profesor@epn.edu.ec
      tipoEvento: EventoTipoEnum.INFORME_REVISADO,
      descripcion: 'Revisó informe de acreditación',
      entidad: 'informe',
      entidadId: 1,
      metadatos: { tipo: 'acreditación' },
      createdAt: new Date(Date.now() - 30 * 60 * 1000), // Hace 30 min
    },
    {
      usuarioId: 5, // admin@epn.edu.ec
      tipoEvento: EventoTipoEnum.ROL_ASIGNADO,
      descripcion: "Asignó rol a 'profesor@epn.edu.ec'",
      entidad: 'usuario',
      entidadId: 6,
      metadatos: { rol: 'PROFESOR', usuario: 'profesor@epn.edu.ec' },
      createdAt: new Date(Date.now() - 60 * 60 * 1000), // Hace 1 hora
    },
    {
      usuarioId: 5, // admin@epn.edu.ec
      tipoEvento: EventoTipoEnum.USUARIO_CREADO,
      descripcion: "Registró nuevo profesor 'Juan Pérez'",
      entidad: 'usuario',
      entidadId: 6,
      metadatos: { nombre: 'Juan Pérez' },
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // Hace 2 horas
    },
    // Eventos adicionales para el profesor
    {
      usuarioId: 6, // profesor@epn.edu.ec
      tipoEvento: EventoTipoEnum.LOGIN_EXITOSO,
      descripcion: "Login exitoso del usuario profesor@epn.edu.ec",
      metadatos: { correo: 'profesor@epn.edu.ec' },
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // Hace 3 horas
    },
    {
      usuarioId: 6, // profesor@epn.edu.ec
      tipoEvento: EventoTipoEnum.DOCUMENTO_SUBIDO,
      descripcion: "Subió documento de evaluación",
      entidad: 'documento',
      entidadId: 1,
      metadatos: { tipo: 'evaluación', nombre: 'eval_sistemas.pdf' },
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // Hace 4 horas
    },
    // Eventos adicionales para el admin
    {
      usuarioId: 5, // admin@epn.edu.ec
      tipoEvento: EventoTipoEnum.LOGIN_EXITOSO,
      descripcion: "Login exitoso del usuario admin@epn.edu.ec",
      metadatos: { correo: 'admin@epn.edu.ec' },
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // Hace 6 horas
    },
  ];

  for (const evento of eventosEjemplo) {
    try {
      await auditoriaService.registrarEvento(evento);
      console.log(`✅ Evento creado: ${evento.descripcion}`);
    } catch (error) {
      console.error(`❌ Error creando evento: ${evento.descripcion}`, error);
    }
  }

  console.log('🎉 Datos de auditoría sembrados exitosamente');
  await app.close();
}

seedAuditoriaData().catch((error) => {
  console.error('Error sembrando datos:', error);
  process.exit(1);
});