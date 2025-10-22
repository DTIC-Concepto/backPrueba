import { ApiProperty } from '@nestjs/swagger';

export class BatchRaaRaOperationResultDto {
  @ApiProperty({
    description: 'Número total de relaciones RAA-RA solicitadas para crear',
    example: 5,
  })
  totalSolicitadas: number;

  @ApiProperty({
    description: 'Número de relaciones RAA-RA creadas exitosamente',
    example: 4,
  })
  exitosas: number;

  @ApiProperty({
    description: 'Número de relaciones RAA-RA que fallaron',
    example: 1,
  })
  fallidas: number;

  @ApiProperty({
    description: 'Array de mensajes de error para relaciones que fallaron',
    example: [
      'Ya existe una relación entre RAA ID 1 y RA ID 5',
    ],
    type: [String],
  })
  errores: string[];

  @ApiProperty({
    description: 'IDs de las relaciones RAA-RA creadas exitosamente',
    example: [15, 16, 17, 18],
    type: [Number],
  })
  relacionesCreadas: number[];
}
