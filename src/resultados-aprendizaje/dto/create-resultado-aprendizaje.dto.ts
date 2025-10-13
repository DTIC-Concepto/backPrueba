import { IsNotEmpty, IsString, IsEnum, IsInt, MaxLength, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TipoRA } from '../models/resultado-aprendizaje.model';

export class CreateResultadoAprendizajeDto {
  @ApiProperty({
    description: 'Código único del Resultado de Aprendizaje dentro del tipo y carrera. Si no se proporciona, se genera automáticamente (RA1, RA2... para GENERAL; RAE1, RAE2... para ESPECIFICO)',
    example: 'RA1',
    maxLength: 50,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50, { message: 'El código no puede exceder 50 caracteres' })
  codigo?: string;

  @ApiProperty({
    description: 'Descripción detallada del Resultado de Aprendizaje',
    example: 'Analizar y sintetizar problemas complejos de ingeniería aplicando principios de matemáticas, ciencias naturales e ingeniería.',
  })
  @IsNotEmpty({ message: 'La descripción es obligatoria' })
  @IsString()
  descripcion: string;

  @ApiProperty({
    description: 'Tipo de Resultado de Aprendizaje',
    enum: TipoRA,
    example: TipoRA.GENERAL,
  })
  @IsNotEmpty({ message: 'El tipo es obligatorio' })
  @IsEnum(TipoRA, { message: 'El tipo debe ser GENERAL o ESPECIFICO' })
  tipo: TipoRA;

  @ApiProperty({
    description: 'ID de la carrera a la que pertenece el RA',
    example: 1,
  })
  @IsNotEmpty({ message: 'El ID de carrera es obligatorio' })
  @IsInt({ message: 'El ID de carrera debe ser un número entero' })
  carreraId: number;
}