import { IsOptional, IsBoolean, IsString, IsNumber, IsPositive, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';

export class FilterFacultadDto {
  @ApiPropertyOptional({
    description: 'Filtrar por estado activo',
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  estadoActivo?: boolean;

  @ApiPropertyOptional({
    description: 'Buscar por código o nombre de facultad (búsqueda parcial insensible a mayúsculas)',
    example: 'FIEC',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filtrar facultades que tengan al menos este número de carreras',
    example: 3,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  numeroCarrerasMin?: number;

  @ApiPropertyOptional({
    description: 'Filtrar facultades que tengan como máximo este número de carreras',
    example: 10,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  numeroCarrerasMax?: number;

  @ApiPropertyOptional({
    description: 'Número de página (empezando desde 1)',
    example: 1,
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Número de elementos por página',
    example: 10,
    minimum: 1,
    maximum: 100,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}