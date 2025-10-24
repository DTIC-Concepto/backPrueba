import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsPositive,
  IsEnum,
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  IsBoolean,
} from 'class-validator';
import { NivelAporteEnum } from '../../common/enums/nivel-aporte.enum';

export class CreateRaaRaMappingDto {
  @ApiProperty({
    description: 'ID del RAA (Resultado de Aprendizaje de Asignatura)',
    example: 1,
    type: 'integer',
  })
  @IsInt()
  @IsPositive()
  raaId: number;

  @ApiProperty({
    description: 'ID del RA (Resultado de Aprendizaje de Carrera)',
    example: 5,
    type: 'integer',
  })
  @IsInt()
  @IsPositive()
  resultadoAprendizajeId: number;

  @ApiProperty({
    description: 'Nivel de aporte del RA al RAA',
    enum: NivelAporteEnum,
    example: NivelAporteEnum.ALTO,
  })
  @IsEnum(NivelAporteEnum, {
    message: `El nivel de aporte debe ser uno de: ${Object.values(NivelAporteEnum).join(', ')}`,
  })
  nivelAporte: NivelAporteEnum;

  @ApiProperty({
    description: 'Justificación de la relación RAA-RA',
    example:
      'Este RA contribuye significativamente al desarrollo de las competencias específicas definidas en el RAA',
    minLength: 10,
    maxLength: 1000,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(10, {
    message: 'La justificación debe tener al menos 10 caracteres',
  })
  @MaxLength(1000, {
    message: 'La justificación no puede exceder los 1000 caracteres',
  })
  justificacion?: string;

  @ApiProperty({
    description: 'Estado activo de la relación',
    example: true,
    default: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  estadoActivo?: boolean;
}
