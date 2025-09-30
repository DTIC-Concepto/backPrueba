import {
  Table,
  Column,
  Model,
  DataType,
  CreatedAt,
  UpdatedAt,
  ForeignKey,
  BelongsTo,
  Index,
} from 'sequelize-typescript';
import { UsuarioModel } from '../../usuarios/models/usuario.model';
import { EventoTipoEnum } from '../enums/evento-tipo.enum';

@Table({
  tableName: 'auditoria_eventos',
  timestamps: true,
})
export class AuditoriaEventoModel extends Model<AuditoriaEventoModel> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  declare id: number;

  @ForeignKey(() => UsuarioModel)
  @Index('auditoria_eventos_usuario_id_idx')
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare usuarioId: number;

  @BelongsTo(() => UsuarioModel)
  declare usuario: UsuarioModel;

  @Index('auditoria_eventos_tipo_idx')
  @Column({
    type: DataType.ENUM(...Object.values(EventoTipoEnum)),
    allowNull: false,
  })
  declare tipoEvento: EventoTipoEnum;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  declare descripcion: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: true,
  })
  declare entidad: string | null; // Ej: 'facultad', 'usuario', 'carrera'

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  declare entidadId: number | null; // ID de la entidad afectada

  @Column({
    type: DataType.JSONB,
    allowNull: true,
  })
  declare metadatos: Record<string, any>; // Datos adicionales del evento

  @Column({
    type: DataType.INET,
    allowNull: true,
  })
  declare ipAddress: string | null;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare userAgent: string | null;

  @Index('auditoria_eventos_created_at_idx')
  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;

  // Método para formatear la descripción para el dashboard
  getDescripcionFormateada(): string {
    switch (this.tipoEvento) {
      case EventoTipoEnum.FACULTAD_CREADA:
        return `Creó nueva facultad '${this.metadatos?.nombre || 'Sin nombre'}'`;
      case EventoTipoEnum.FACULTAD_ACTUALIZADA:
        return `Actualizó datos de facultad '${this.metadatos?.nombre || 'Sin nombre'}'`;
      case EventoTipoEnum.CARRERA_ACTUALIZADA:
        return `Actualizó datos de carrera '${this.metadatos?.nombre || 'Sin nombre'}'`;
      case EventoTipoEnum.INFORME_REVISADO:
        return `Revisó informe de acreditación`;
      case EventoTipoEnum.ROL_ASIGNADO:
        return `Asignó rol a '${this.metadatos?.usuario || 'usuario'}'`;
      case EventoTipoEnum.USUARIO_CREADO:
        return `Registró nuevo profesor '${this.metadatos?.nombre || 'Sin nombre'}'`;
      case EventoTipoEnum.LOGIN_EXITOSO:
        return `Inició sesión en el sistema`;
      default:
        return this.descripcion;
    }
  }

  // Método para obtener el tiempo relativo (hace X min/horas)
  getTiempoRelativo(): string {
    const ahora = new Date();
    const diferencia = ahora.getTime() - this.createdAt.getTime();
    
    const minutos = Math.floor(diferencia / (1000 * 60));
    const horas = Math.floor(diferencia / (1000 * 60 * 60));
    const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));

    if (minutos < 60) {
      return `Hace ${minutos} min`;
    } else if (horas < 24) {
      return `Hace ${horas} hora${horas > 1 ? 's' : ''}`;
    } else {
      return `Hace ${dias} día${dias > 1 ? 's' : ''}`;
    }
  }
}