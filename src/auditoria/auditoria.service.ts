import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { AuditoriaEventoModel } from './models/auditoria-evento.model';
import { EventoTipoEnum } from './enums/evento-tipo.enum';

export interface RegistrarEventoDto {
  usuarioId: number;
  tipoEvento: EventoTipoEnum;
  descripcion: string;
  entidad?: string;
  entidadId?: number;
  metadatos?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuditoriaService {
  constructor(
    @InjectModel(AuditoriaEventoModel)
    private readonly auditoriaEventoModel: typeof AuditoriaEventoModel,
  ) {}

  async registrarEvento(datos: RegistrarEventoDto): Promise<AuditoriaEventoModel | null> {
    try {
      return await this.auditoriaEventoModel.create({
        usuarioId: datos.usuarioId,
        tipoEvento: datos.tipoEvento,
        descripcion: datos.descripcion,
        entidad: datos.entidad || null,
        entidadId: datos.entidadId || null,
        metadatos: datos.metadatos || {},
        ipAddress: datos.ipAddress || null,
        userAgent: datos.userAgent || null,
      } as any);
    } catch (error) {
      console.error('Error al registrar evento de auditoría:', error);
      // No lanzamos error para que no afecte el flujo principal
      return null;
    }
  }

  // Métodos de conveniencia para eventos específicos
  async registrarLoginExitoso(usuarioId: number, correo: string, ipAddress?: string, userAgent?: string) {
    return this.registrarEvento({
      usuarioId,
      tipoEvento: EventoTipoEnum.LOGIN_EXITOSO,
      descripcion: `Login exitoso del usuario ${correo}`,
      metadatos: { correo },
      ipAddress,
      userAgent,
    });
  }

  async registrarFacultadCreada(usuarioId: number, facultadId: number, nombreFacultad: string) {
    return this.registrarEvento({
      usuarioId,
      tipoEvento: EventoTipoEnum.FACULTAD_CREADA,
      descripcion: `Facultad '${nombreFacultad}' creada`,
      entidad: 'facultad',
      entidadId: facultadId,
      metadatos: { nombre: nombreFacultad },
    });
  }

  async registrarFacultadActualizada(usuarioId: number, facultadId: number, nombreFacultad: string) {
    return this.registrarEvento({
      usuarioId,
      tipoEvento: EventoTipoEnum.FACULTAD_ACTUALIZADA,
      descripcion: `Facultad '${nombreFacultad}' actualizada`,
      entidad: 'facultad',
      entidadId: facultadId,
      metadatos: { nombre: nombreFacultad },
    });
  }

  async registrarCarreraActualizada(usuarioId: number, carreraId: number, nombreCarrera: string) {
    return this.registrarEvento({
      usuarioId,
      tipoEvento: EventoTipoEnum.CARRERA_ACTUALIZADA,
      descripcion: `Carrera '${nombreCarrera}' actualizada`,
      entidad: 'carrera',
      entidadId: carreraId,
      metadatos: { nombre: nombreCarrera },
    });
  }

  async registrarInformeRevisado(usuarioId: number, informeId: number, tipoInforme: string) {
    return this.registrarEvento({
      usuarioId,
      tipoEvento: EventoTipoEnum.INFORME_REVISADO,
      descripcion: `Informe de ${tipoInforme} revisado`,
      entidad: 'informe',
      entidadId: informeId,
      metadatos: { tipo: tipoInforme },
    });
  }

  async registrarUsuarioCreado(usuarioId: number, nuevoUsuarioId: number, nombreCompleto: string) {
    return this.registrarEvento({
      usuarioId,
      tipoEvento: EventoTipoEnum.USUARIO_CREADO,
      descripcion: `Usuario '${nombreCompleto}' registrado`,
      entidad: 'usuario',
      entidadId: nuevoUsuarioId,
      metadatos: { nombre: nombreCompleto },
    });
  }

  async registrarRolAsignado(usuarioId: number, usuarioAfectadoId: number, rol: string, nombreUsuario: string) {
    return this.registrarEvento({
      usuarioId,
      tipoEvento: EventoTipoEnum.ROL_ASIGNADO,
      descripcion: `Rol '${rol}' asignado a ${nombreUsuario}`,
      entidad: 'usuario',
      entidadId: usuarioAfectadoId,
      metadatos: { rol, usuario: nombreUsuario },
    });
  }
}