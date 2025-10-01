import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum } from 'class-validator';
import { RolEnum } from '../../common/enums/rol.enum';

export class SearchUsuarioDto {
  @ApiPropertyOptional({
    description: 'Término de búsqueda para nombres, apellidos o correo electrónico',
    example: 'Carlos Rodriguez',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por rol específico',
    enum: RolEnum,
    example: RolEnum.DECANO,
  })
  @IsOptional()
  @IsEnum(RolEnum)
  rol?: RolEnum;
}