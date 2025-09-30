import { IsOptional, IsEnum, IsBoolean, IsString } from 'class-validator';
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
  })
  @IsOptional()
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