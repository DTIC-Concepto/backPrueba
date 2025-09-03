import { IsNotEmpty, IsString, IsOptional, IsInt, IsBoolean, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateRaaRequestDto {
  @ApiProperty({
    description: 'Código único del RAA',
    example: 'RAA-001',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'El código debe ser una cadena de texto' })
  codigo?: string;

  @ApiProperty({
    description: 'Descripción del Resultado de Aprendizaje de Asignatura',
    example: 'El estudiante será capaz de...',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'La descripción debe ser una cadena de texto' })
  descripcion?: string;

  @ApiProperty({
    description: 'ID de la asignatura a la que pertenece el RAA',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsInt({ message: 'El ID de la asignatura debe ser un número entero' })
  @Min(1, { message: 'El ID de la asignatura debe ser mayor a 0' })
  @Type(() => Number)
  asignaturaId?: number;

  @ApiProperty({
    description: 'ID del tipo de RAA',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsInt({ message: 'El ID del tipo de RAA debe ser un número entero' })
  @Min(1, { message: 'El ID del tipo de RAA debe ser mayor a 0' })
  @Type(() => Number)
  tipoRaaId?: number;

  @ApiProperty({
    description: 'Estado activo del RAA',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'El estado activo debe ser un valor booleano' })
  estadoActivo?: boolean;
}

export class UpdateRaaResponseDto {
  @ApiProperty({
    description: 'Indica si la actualización fue exitosa',
    example: true,
  })
  exitoso: boolean;

  @ApiProperty({
    description: 'Mensaje descriptivo del resultado',
    example: 'RAA actualizado correctamente',
  })
  mensaje: string;

  @ApiProperty({
    description: 'RAA actualizado',
    type: Object, // Se reemplazará con RaaModel en el controlador
  })
  raa: any;

  @ApiProperty({
    description: 'Campos que fueron modificados',
    example: ['descripcion', 'estadoActivo'],
    required: false,
  })
  camposModificados?: string[];

  @ApiProperty({
    description: 'Valores anteriores de los campos modificados',
    example: {
      descripcion: 'Descripción anterior',
      estadoActivo: false,
    },
    required: false,
  })
  valoresAnteriores?: Record<string, any>;
}
