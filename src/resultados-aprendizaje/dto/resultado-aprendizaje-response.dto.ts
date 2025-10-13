import { ApiProperty } from '@nestjs/swagger';
import { TipoRA } from '../models/resultado-aprendizaje.model';

export class ResultadoAprendizajeResponseDto {
  @ApiProperty({
    description: 'ID único del Resultado de Aprendizaje',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Código único del RA',
    example: 'RA1',
  })
  codigo: string;

  @ApiProperty({
    description: 'Descripción del RA',
    example: 'Analizar y sintetizar problemas complejos de ingeniería aplicando principios de matemáticas, ciencias naturales e ingeniería.',
  })
  descripcion: string;

  @ApiProperty({
    description: 'Tipo del RA',
    enum: TipoRA,
    example: TipoRA.GENERAL,
  })
  tipo: TipoRA;

  @ApiProperty({
    description: 'ID de la carrera',
    example: 1,
  })
  carreraId: number;

  @ApiProperty({
    description: 'Fecha de creación',
    example: '2025-10-13T05:05:36.333Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Fecha de última actualización',
    example: '2025-10-13T05:05:36.333Z',
  })
  updatedAt: Date;
}