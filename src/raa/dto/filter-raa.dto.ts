import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsNumber,
  IsPositive,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TipoRaaEnum } from '../../common/enums/tipo-raa.enum';

export class FilterRaaDto {
  @ApiPropertyOptional({
    description: 'Búsqueda por código o descripción del RAA',
    example: '1.1',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por ID de la relación carrera-asignatura',
    example: 2,
    type: 'integer',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  carreraAsignaturaId?: number;

  @ApiPropertyOptional({
    description: 'Filtrar por ID de asignatura',
    example: 1,
    type: 'integer',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  asignaturaId?: number;

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
    description: 'Filtrar por tipo de RAA',
    enum: TipoRaaEnum,
    example: TipoRaaEnum.CONOCIMIENTOS,
  })
  @IsOptional()
  @IsEnum(TipoRaaEnum)
  tipo?: TipoRaaEnum;
}
