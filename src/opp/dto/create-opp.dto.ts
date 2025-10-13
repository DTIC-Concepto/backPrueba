import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length, IsInt, IsPositive } from 'class-validator';

export class CreateOppDto {
  @ApiProperty({
    description: 'Código único del Objetivo de Programa (debe ser único por carrera)',
    example: 'OPP1',
    minLength: 1,
    maxLength: 50,
    pattern: '^OPP[0-9]+$',
  })
  @IsNotEmpty({ message: 'El código es obligatorio' })
  @IsString({ message: 'El código debe ser una cadena de texto' })
  @Length(1, 50, { message: 'El código debe tener entre 1 y 50 caracteres' })
  codigo: string;

  @ApiProperty({
    description: 'Descripción detallada del Objetivo de Programa',
    example: 'Comprender los principios fundamentales de la ingeniería de software.',
  })
  @IsNotEmpty({ message: 'La descripción es obligatoria' })
  @IsString({ message: 'La descripción debe ser una cadena de texto' })
  descripcion: string;

  @ApiProperty({
    description: 'ID de la carrera a la que pertenece el OPP',
    example: 1,
  })
  @IsNotEmpty({ message: 'El ID de la carrera es obligatorio' })
  @IsInt({ message: 'El ID de la carrera debe ser un número entero' })
  @IsPositive({ message: 'El ID de la carrera debe ser un número positivo' })
  carreraId: number;
}