import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsPositive, IsOptional, IsBoolean, IsEnum } from 'class-validator';
import { NivelAporteEnum } from '../../common/enums/nivel-aporte.enum';

export class FilterRaaRaMappingsDto {
  @ApiPropertyOptional({
    description: 'Filtrar por ID de RAA',
    example: 1,
    type: 'integer',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  raaId?: number;

  @ApiPropertyOptional({
    description: 'Filtrar por ID de Resultado de Aprendizaje',
    example: 5,
    type: 'integer',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  resultadoAprendizajeId?: number;

  @ApiPropertyOptional({
    description: 'Filtrar por ID de asignatura',
    example: 2,
    type: 'integer',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  asignaturaId?: number;

  @ApiPropertyOptional({
    description: 'Filtrar por ID de carrera',
    example: 1,
    type: 'integer',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  carreraId?: number;

  @ApiPropertyOptional({
    description: 'Filtrar por nivel de aporte',
    enum: NivelAporteEnum,
    example: NivelAporteEnum.ALTO,
  })
  @IsOptional()
  @IsEnum(NivelAporteEnum)
  nivelAporte?: NivelAporteEnum;

  @ApiPropertyOptional({
    description: 'Filtrar por estado activo',
    example: true,
    type: 'boolean',
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  estadoActivo?: boolean;
}
