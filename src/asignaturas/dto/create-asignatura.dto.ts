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
  IsArray,
  ArrayMinSize,
} from 'class-validator';
import { TipoAsignaturaEnum } from '../../common/enums/tipo-asignatura.enum';
import { UnidadCurricularEnum } from '../../common/enums/unidad-curricular.enum';

export class CreateAsignaturaDto {
  @ApiProperty({
    description: 'Código único de la asignatura',
    example: 'ISWD414',
    minLength: 2,
    maxLength: 20,
  })
  @IsString()
  @IsNotEmpty()
  @Length(2, 20)
  @Matches(/^[A-Z0-9]+$/, {
    message: 'El código debe contener solo letras mayúsculas y números',
  })
  codigo: string;

  @ApiProperty({
    description: 'Nombre de la asignatura',
    example: 'Ingeniería de Software y Requerimientos',
    minLength: 3,
    maxLength: 200,
  })
  @IsString()
  @IsNotEmpty()
  @Length(3, 200)
  nombre: string;

  @ApiProperty({
    description: 'Número de créditos de la asignatura',
    example: 3,
    minimum: 1,
    maximum: 10,
  })
  @IsNumber()
  @IsPositive()
  @Min(1)
  @Max(10)
  creditos: number;

  @ApiProperty({
    description: 'Descripción de la asignatura',
    example: 'Asignatura que cubre conceptos fundamentales de ingeniería de software',
    required: false,
  })
  @IsString()
  @IsOptional()
  descripcion?: string;

  @ApiProperty({
    description: 'Tipo de asignatura',
    enum: TipoAsignaturaEnum,
    example: TipoAsignaturaEnum.OBLIGATORIA,
  })
  @IsEnum(TipoAsignaturaEnum, {
    message: `El tipo de asignatura debe ser uno de: ${Object.values(TipoAsignaturaEnum).join(', ')}`,
  })
  tipoAsignatura: TipoAsignaturaEnum;

  @ApiProperty({
    description: 'Unidad curricular a la que pertenece',
    enum: UnidadCurricularEnum,
    example: UnidadCurricularEnum.UNIDAD_PROFESIONAL,
  })
  @IsEnum(UnidadCurricularEnum, {
    message: `La unidad curricular debe ser una de: ${Object.values(UnidadCurricularEnum).join(', ')}`,
  })
  unidadCurricular: UnidadCurricularEnum;

  @ApiProperty({
    description: 'Período académico (pénsum)',
    example: 2023,
    minimum: 2000,
    maximum: 2100,
  })
  @IsNumber()
  @IsPositive()
  @Min(2000)
  @Max(2100)
  pensum: number;

  @ApiProperty({
    description: 'Nivel referencial de la asignatura (semestre)',
    example: 1,
    minimum: 1,
    maximum: 20,
  })
  @IsNumber()
  @IsPositive()
  @Min(1)
  @Max(20)
  nivelReferencial: number;

  @ApiProperty({
    description: 'IDs de las carreras a las que pertenece la asignatura',
    example: [1, 2],
    type: [Number],
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'La asignatura debe pertenecer al menos a una carrera' })
  @IsNumber({}, { each: true })
  @IsPositive({ each: true })
  carreraIds: number[];

  @ApiProperty({
    description: 'Estado activo de la asignatura',
    example: true,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  estadoActivo?: boolean = true;
}
