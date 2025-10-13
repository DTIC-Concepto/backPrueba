import { IsOptional, IsString, IsEnum, IsInt, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { TipoRA } from '../models/resultado-aprendizaje.model';

export class FilterResultadoAprendizajeDto {
  @ApiPropertyOptional({
    description: 'Filtrar por código del RA (búsqueda parcial)',
    example: 'RA1',
  })
  @IsOptional()
  @IsString()
  codigo?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por descripción del RA (búsqueda parcial)',
    example: 'análisis',
  })
  @IsOptional()
  @IsString()
  descripcion?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por tipo de RA',
    enum: TipoRA,
    example: TipoRA.GENERAL,
  })
  @IsOptional()
  @IsEnum(TipoRA, { message: 'El tipo debe ser GENERAL o ESPECIFICO' })
  tipo?: TipoRA;

  @ApiPropertyOptional({
    description: 'Filtrar por ID de carrera',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  carreraId?: number;

  @ApiPropertyOptional({
    description: 'Búsqueda general en código y descripción',
    example: 'problemas complejos',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Número de página (empezando desde 1)',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Número de elementos por página',
    example: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}