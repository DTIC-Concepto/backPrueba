import { IsNotEmpty, IsString, IsOptional, IsInt, IsBoolean, Min, MaxLength, MinLength, Matches, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRaaRequestDto {
  @ApiProperty({
    description: 'Código único del RAA (opcional - se puede generar automáticamente)',
    example: 'RAA-001',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'El código debe ser una cadena de texto' })
  @MinLength(3, { message: 'El código debe tener al menos 3 caracteres' })
  @MaxLength(50, { message: 'El código no puede tener más de 50 caracteres' })
  @Matches(/^[A-Z0-9\-_]+$/, { message: 'El código solo puede contener letras mayúsculas, números, guiones y guiones bajos' })
  codigo?: string;

  @ApiProperty({
    description: 'Nombre o título del RAA',
    example: 'Aplicación de principios de programación',
  })
  @IsNotEmpty({ message: 'El nombre del RAA es obligatorio' })
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @MinLength(5, { message: 'El nombre debe tener al menos 5 caracteres' })
  @MaxLength(200, { message: 'El nombre no puede tener más de 200 caracteres' })
  nombre: string;

  @ApiProperty({
    description: 'Descripción detallada del Resultado de Aprendizaje de Asignatura',
    example: 'El estudiante será capaz de aplicar principios fundamentales de programación orientada a objetos para resolver problemas computacionales de mediana complejidad.',
  })
  @IsNotEmpty({ message: 'La descripción del RAA es obligatoria' })
  @IsString({ message: 'La descripción debe ser una cadena de texto' })
  @MinLength(20, { message: 'La descripción debe tener al menos 20 caracteres' })
  @MaxLength(1000, { message: 'La descripción no puede tener más de 1000 caracteres' })
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
    description: 'Nivel del RAA',
    example: 'INTERMEDIO',
    enum: ['BASICO', 'INTERMEDIO', 'AVANZADO'],
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'El nivel debe ser una cadena de texto' })
  @IsIn(['BASICO', 'INTERMEDIO', 'AVANZADO'], { 
    message: 'El nivel debe ser uno de: BASICO, INTERMEDIO, AVANZADO' 
  })
  nivel?: string;

  @ApiProperty({
    description: 'Estado activo del RAA',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'El estado activo debe ser un valor booleano' })
  estadoActivo?: boolean;

  @ApiProperty({
    description: 'Generar código automáticamente basado en la asignatura',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'La opción de generar código debe ser un valor booleano' })
  generarCodigoAutomatico?: boolean;

  @ApiProperty({
    description: 'Prefijo personalizado para el código generado automáticamente',
    example: 'RAA',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'El prefijo debe ser una cadena de texto' })
  @MaxLength(10, { message: 'El prefijo no puede tener más de 10 caracteres' })
  @Matches(/^[A-Z]+$/, { message: 'El prefijo solo puede contener letras mayúsculas' })
  prefijoPersonalizado?: string;
}
