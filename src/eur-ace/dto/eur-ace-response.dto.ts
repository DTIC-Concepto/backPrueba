import { ApiProperty } from '@nestjs/swagger';

export class EurAceResponseDto {
  @ApiProperty({
    description: 'ID único del criterio EUR-ACE',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Código único del criterio EUR-ACE',
    example: '5.4.6',
  })
  codigo: string;

  @ApiProperty({
    description: 'Descripción detallada del criterio EUR-ACE',
    example: 'Gestión de proyectos de ingeniería complejos aplicando metodologías modernas, considerando restricciones técnicas, económicas y de recursos humanos.',
  })
  descripcion: string;

  @ApiProperty({
    description: 'Fecha de creación del criterio',
    example: '2025-10-12T18:30:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Fecha de última actualización del criterio',
    example: '2025-10-12T18:30:00.000Z',
  })
  updatedAt: Date;
}