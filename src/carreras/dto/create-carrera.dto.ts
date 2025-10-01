import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsBoolean,
  IsOptional,
  Length,
  Matches,
  IsEnum,
  Min,
  Max,
} from 'class-validator';
import { ModalidadEnum } from '../../common/enums/modalidad.enum';

export class CreateCarreraDto {
  @ApiProperty({
    description: 'Código único de la carrera',
    example: 'ING-SIS',
    minLength: 2,
    maxLength: 20,
  })
  @IsString()
  @IsNotEmpty()
  @Length(2, 20)
  @Matches(/^[A-Z0-9-]+$/, {
    message: 'El código debe contener solo letras mayúsculas, números y guiones',
  })
  codigo: string;

  @ApiProperty({
    description: 'Nombre completo de la carrera',
    example: 'Ingeniería en Sistemas Informáticos y de Computación',
    minLength: 5,
    maxLength: 200,
  })
  @IsString()
  @IsNotEmpty()
  @Length(5, 200)
  nombre: string;

  @ApiProperty({
    description: 'ID de la facultad a la que pertenece la carrera',
    example: 1,
    minimum: 1,
  })
  @IsNumber()
  @IsPositive()
  facultadId: number;

  @ApiProperty({
    description: 'ID del coordinador de la carrera',
    example: 2,
    minimum: 1,
  })
  @IsNumber()
  @IsPositive()
  coordinadorId: number;

  @ApiProperty({
    description: 'Duración de la carrera en semestres',
    example: 10,
    minimum: 1,
    maximum: 20,
    default: 10,
  })
  @IsNumber()
  @IsPositive()
  @Min(1)
  @Max(20)
  @IsOptional()
  duracion?: number = 10;

  @ApiProperty({
    description: 'Modalidad de la carrera',
    enum: ModalidadEnum,
    example: ModalidadEnum.PRESENCIAL,
    default: ModalidadEnum.PRESENCIAL,
  })
  @IsEnum(ModalidadEnum)
  @IsOptional()
  modalidad?: ModalidadEnum = ModalidadEnum.PRESENCIAL;

  @ApiProperty({
    description: 'Estado activo de la carrera',
    example: true,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  estadoActivo?: boolean = true;
}