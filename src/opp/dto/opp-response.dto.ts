import { ApiProperty } from '@nestjs/swagger';

export class OppResponseDto {
  @ApiProperty({
    description: 'ID único del Objetivo de Programa',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Código único del Objetivo de Programa',
    example: 'OPP1',
  })
  codigo: string;

  @ApiProperty({
    description: 'Descripción detallada del Objetivo de Programa',
    example: 'Comprender los principios fundamentales de la ingeniería de software.',
  })
  descripcion: string;

  @ApiProperty({
    description: 'ID de la carrera a la que pertenece el OPP',
    example: 1,
  })
  carreraId: number;

  @ApiProperty({
    description: 'Fecha de creación del OPP',
    example: '2025-10-13T05:05:36.333Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Fecha de última actualización del OPP',
    example: '2025-10-13T05:05:36.333Z',
  })
  updatedAt: Date;
}