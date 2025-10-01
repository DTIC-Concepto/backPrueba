import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, IsBoolean, IsOptional } from 'class-validator';

export class FacultadListResponseDto {
  @ApiProperty({
    description: 'ID único de la facultad',
    example: 1,
  })
  @IsNumber()
  id: number;

  @ApiProperty({
    description: 'Código único de la facultad',
    example: 'FIEC',
    maxLength: 20,
  })
  @IsString()
  codigo: string;

  @ApiProperty({
    description: 'Nombre completo de la facultad',
    example: 'Facultad de Ingeniería Eléctrica y Computación',
    maxLength: 255,
  })
  @IsString()
  nombre: string;

  @ApiProperty({
    description: 'Descripción de la facultad',
    example: 'Facultad especializada en ingeniería eléctrica, electrónica y computación',
    required: false,
  })
  @IsOptional()
  @IsString()
  descripcion?: string;

  @ApiProperty({
    description: 'Número total de carreras en la facultad',
    example: 5,
    minimum: 0,
  })
  @IsNumber()
  numeroCarreras: number;

  @ApiProperty({
    description: 'Información del decano de la facultad',
    type: 'object',
    properties: {
      id: { type: 'number', example: 3 },
      nombres: { type: 'string', example: 'Carlos Eduardo' },
      apellidos: { type: 'string', example: 'Rodríguez Silva' },
      correo: { type: 'string', example: 'carlos.rodriguez@epn.edu.ec' },
    },
    nullable: true,
  })
  @IsOptional()
  decano?: {
    id: number;
    nombres: string;
    apellidos: string;
    correo: string;
  } | null;

  @ApiProperty({
    description: 'Estado activo de la facultad',
    example: true,
  })
  @IsBoolean()
  estadoActivo: boolean;

  @ApiProperty({
    description: 'Fecha de creación de la facultad',
    example: '2024-01-15T10:30:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Fecha de última actualización',
    example: '2024-01-20T15:45:00.000Z',
  })
  updatedAt: Date;
}