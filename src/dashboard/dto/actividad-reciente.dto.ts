import { ApiProperty } from '@nestjs/swagger';
import { EventoTipoEnum } from '../../auditoria/enums/evento-tipo.enum';

export class ActividadRecenteDto {
  @ApiProperty({
    description: 'Tiempo relativo del evento',
    example: 'Hace 5 min',
  })
  hora: string;

  @ApiProperty({
    description: 'Correo del usuario que realizó la acción',
    example: 'admin@epn.edu.ec',
  })
  usuario: string;

  @ApiProperty({
    description: 'Descripción formateada de la acción realizada',
    example: "Creó nueva facultad 'FIEC'",
  })
  accion: string;

  @ApiProperty({
    description: 'Tipo de evento registrado',
    enum: EventoTipoEnum,
    example: EventoTipoEnum.FACULTAD_CREADA,
  })
  tipoEvento: EventoTipoEnum;

  @ApiProperty({
    description: 'Fecha y hora exacta del evento',
    example: '2024-09-30T15:30:00.000Z',
  })
  fechaEvento: Date;
}