import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsNumber,
  IsPositive,
  IsEnum,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TipoAsignaturaEnum } from '../../common/enums/tipo-asignatura.enum';
import { UnidadCurricularEnum } from '../../common/enums/unidad-curricular.enum';

export class FilterAsignaturaDto {
  @ApiPropertyOptional({
    description: 'Búsqueda por código o descripción de la asignatura',
    example: 'Software',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por ID de carrera',
    example: 1,
    type: 'integer',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  carreraId?: number;

  @ApiPropertyOptional({
    description: 'Filtrar por nivel referencial específico',
    example: 1,
    minimum: 1,
    maximum: 20,
    type: 'integer',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(20)
  nivelReferencial?: number;

  @ApiPropertyOptional({
    description: 'Filtrar por número de créditos',
    example: 3,
    minimum: 1,
    maximum: 10,
    type: 'integer',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(10)
  creditos?: number;

  @ApiPropertyOptional({
    description: 'Filtrar por tipo de asignatura',
    enum: TipoAsignaturaEnum,
    example: TipoAsignaturaEnum.OBLIGATORIA,
  })
  @IsOptional()
  @IsEnum(TipoAsignaturaEnum)
  tipoAsignatura?: TipoAsignaturaEnum;

  @ApiPropertyOptional({
    description: 'Filtrar por unidad curricular',
    enum: UnidadCurricularEnum,
    example: UnidadCurricularEnum.UNIDAD_PROFESIONAL,
  })
  @IsOptional()
  @IsEnum(UnidadCurricularEnum)
  unidadCurricular?: UnidadCurricularEnum;

  @ApiPropertyOptional({
    description: 'Filtrar por pénsum (período académico)',
    example: 2023,
    minimum: 2000,
    maximum: 2100,
    type: 'integer',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(2000)
  @Max(2100)
  pensum?: number;
}
