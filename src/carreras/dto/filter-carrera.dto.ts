import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsBoolean, IsNumber, IsPositive, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';
import { ModalidadEnum } from '../../common/enums/modalidad.enum';

export class FilterCarreraDto {
  @ApiPropertyOptional({
    description: 'Filtrar por ID de facultad',
    example: 1,
    type: 'integer',
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @IsPositive()
  facultadId?: number;

  @ApiPropertyOptional({
    description: 'Filtrar por estado activo de la carrera',
    example: true,
    type: 'boolean',
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  estadoActivo?: boolean;

  @ApiPropertyOptional({
    description: 'Buscar por código o nombre de carrera',
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
}