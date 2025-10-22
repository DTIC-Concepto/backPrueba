import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsBoolean,
  IsOptional,
  Length,
  IsEnum,
  MinLength,
  MaxLength,
} from 'class-validator';
import { TipoRaaEnum } from '../../common/enums/tipo-raa.enum';

export class CreateRaaDto {
  @ApiProperty({
    description: 'Código del RAA (único por carrera-asignatura)',
    example: '1.1',
    minLength: 1,
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 50)
  codigo: string;

  @ApiProperty({
    description: 'Tipo de RAA',
    enum: TipoRaaEnum,
    example: TipoRaaEnum.CONOCIMIENTOS,
  })
  @IsEnum(TipoRaaEnum, {
    message: `El tipo de RAA debe ser uno de: ${Object.values(TipoRaaEnum).join(', ')}`,
  })
  tipo: TipoRaaEnum;

  @ApiProperty({
    description: 'Descripción del resultado de aprendizaje',
    example:
      'Reconocer las estructuras de espacios y subespacios vectoriales',
    minLength: 10,
    maxLength: 5000,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(5000)
  descripcion: string;

  @ApiProperty({
    description: 'ID de la asignatura a la que pertenece el RAA',
    example: 5,
    minimum: 1,
  })
  @IsNumber()
  @IsPositive()
  asignaturaId: number;

  @ApiProperty({
    description: 'Estado activo del RAA',
    example: true,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  estadoActivo?: boolean = true;
}
