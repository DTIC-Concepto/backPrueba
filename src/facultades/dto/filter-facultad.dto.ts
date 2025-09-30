import { IsOptional, IsBoolean, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

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
    description: 'Buscar por nombre, código o descripción',
    example: 'ingeniería',
  })
  @IsOptional()
  @IsString()
  search?: string;
}