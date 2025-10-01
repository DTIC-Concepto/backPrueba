import { IsOptional, IsEnum, IsBoolean, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
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
}