import { IsOptional, IsEnum, IsBoolean, IsString, IsInt, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { RolEnum } from '../../common/enums/rol.enum';

export class FilterUsuarioDto {
  @ApiPropertyOptional({
    description: 'Filtrar por rol específico',
    enum: RolEnum,
    example: RolEnum.PROFESOR,
  })
  @IsOptional()
  @IsEnum(RolEnum)
  rol?: RolEnum;

  @ApiPropertyOptional({
    description: 'Filtrar por estado activo',
    example: true,
    type: Boolean,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  })
  @IsBoolean()
  estadoActivo?: boolean;

  @ApiPropertyOptional({
    description: 'Buscar por nombres, apellidos o correo',
    example: 'Juan',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por facultad específica (ID de la facultad)',
    example: 1,
    type: 'integer',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  facultadId?: number;
}