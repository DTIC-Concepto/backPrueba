import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, Min, Max, IsEnum } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { RolEnum } from '../../common/enums/rol.enum';

export class SearchPaginatedUsuarioDto {
  @ApiProperty({
    description: 'Palabra clave para buscar usuarios por email, nombre, apellidos o cédula',
    type: String,
    example: 'juan.perez',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'La palabra clave debe ser una cadena de texto' })
  @Transform(({ value }) => value?.trim())
  search?: string;

  @ApiProperty({
    description: 'Número de página (empezando desde 1)',
    type: Number,
    example: 1,
    default: 1,
    minimum: 1,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'La página debe ser un número' })
  @Min(1, { message: 'La página debe ser mayor a 0' })
  page?: number = 1;

  @ApiProperty({
    description: 'Número de elementos por página (máximo 50)',
    type: Number,
    example: 10,
    default: 10,
    minimum: 1,
    maximum: 50,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'El límite debe ser un número' })
  @Min(1, { message: 'El límite debe ser mayor a 0' })
  @Max(50, { message: 'El límite no puede ser mayor a 50' })
  limit?: number = 10;

  @ApiProperty({
    description: 'Filtrar usuarios por rol específico (incluye rol principal y roles adicionales)',
    enum: RolEnum,
    example: RolEnum.PROFESOR,
    required: false,
  })
  @IsOptional()
  @IsEnum(RolEnum, { message: 'El rol debe ser un valor válido' })
  rol?: RolEnum;

  @ApiProperty({
    description: 'Filtrar por facultad específica (ID de la facultad)',
    example: 1,
    type: 'integer',
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'El ID de facultad debe ser un número' })
  @Min(1, { message: 'El ID de facultad debe ser mayor a 0' })
  facultadId?: number;
}