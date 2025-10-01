import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsBoolean, IsNumber, IsPositive, IsEnum, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';
import { ModalidadEnum } from '../../common/enums/modalidad.enum';

export class CarreraPaginatedFilterDto {
  // Filtros específicos de carreras
  @ApiPropertyOptional({
    description: 'Filtrar por ID de facultad específica (HU5110)',
    example: 1,
    type: 'integer',
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @IsPositive()
  facultadId?: number;

  @ApiPropertyOptional({
    description: 'Filtrar por estado activo de la carrera (HU5106)',
    example: true,
    type: 'boolean',
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  estadoActivo?: boolean;

  @ApiPropertyOptional({
    description: 'Buscar por código o nombre de carrera (HU5105)',
    example: 'Ingeniería',
    type: 'string',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por modalidad de la carrera',
    enum: ModalidadEnum,
    example: ModalidadEnum.PRESENCIAL,
  })
  @IsOptional()
  @IsEnum(ModalidadEnum)
  modalidad?: ModalidadEnum;

  @ApiPropertyOptional({
    description: 'Filtrar por duración mínima en semestres',
    example: 8,
    type: 'integer',
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @IsPositive()
  duracionMin?: number;

  @ApiPropertyOptional({
    description: 'Filtrar por duración máxima en semestres',
    example: 12,
    type: 'integer',
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @IsPositive()
  duracionMax?: number;

  // Parámetros de paginación (HU5109)
  @ApiPropertyOptional({
    description: 'Número de página (empezando desde 1) - HU5109',
    example: 1,
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @IsPositive()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Número de elementos por página - HU5109',
    example: 10,
    minimum: 1,
    maximum: 50,
    default: 10,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @IsPositive()
  @Min(1)
  @Max(50)
  limit?: number = 10;
}