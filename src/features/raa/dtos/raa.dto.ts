import { IsNotEmpty, IsString, IsOptional, IsInt, IsBoolean, Min } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRaaDto {
  @ApiProperty({
    description: 'Código único del RAA',
    example: 'RAA-001',
  })
  @IsNotEmpty({ message: 'El código del RAA es obligatorio' })
  @IsString({ message: 'El código debe ser una cadena de texto' })
  codigo: string;

  @ApiProperty({
    description: 'Descripción del Resultado de Aprendizaje de Asignatura',
    example: 'El estudiante será capaz de...',
  })
  @IsNotEmpty({ message: 'La descripción del RAA es obligatoria' })
  @IsString({ message: 'La descripción debe ser una cadena de texto' })
  descripcion: string;

  @ApiProperty({
    description: 'ID de la asignatura a la que pertenece el RAA',
    example: 1,
  })
  @IsNotEmpty({ message: 'El ID de la asignatura es obligatorio' })
  @IsInt({ message: 'El ID de la asignatura debe ser un número entero' })
  @Min(1, { message: 'El ID de la asignatura debe ser mayor a 0' })
  @Type(() => Number)
  asignaturaId: number;

  @ApiProperty({
    description: 'ID del tipo de RAA',
    example: 1,
  })
  @IsNotEmpty({ message: 'El ID del tipo de RAA es obligatorio' })
  @IsInt({ message: 'El ID del tipo de RAA debe ser un número entero' })
  @Min(1, { message: 'El ID del tipo de RAA debe ser mayor a 0' })
  @Type(() => Number)
  tipoRaaId: number;

  @ApiProperty({
    description: 'Estado activo del RAA',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'El estado activo debe ser un valor booleano' })
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  estadoActivo?: boolean;
}

export class UpdateRaaDto {
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

export class FilterRaaDto {
  @ApiProperty({
    description: 'Código del RAA para filtrar',
    example: 'RAA-001',
    required: false,
  })
  @IsOptional()
  @IsString()
  codigo?: string;

  @ApiProperty({
    description: 'ID de la asignatura para filtrar',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  asignaturaId?: number;

  @ApiProperty({
    description: 'ID del tipo de RAA para filtrar',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  tipoRaaId?: number;

  @ApiProperty({
    description: 'Estado activo del RAA para filtrar',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'El estado activo debe ser un valor booleano' })
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  estadoActivo?: boolean;
}
