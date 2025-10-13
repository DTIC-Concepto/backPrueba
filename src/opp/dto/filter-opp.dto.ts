import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, IsPositive, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class FilterOppDto {
  @ApiProperty({
    description: 'Filtro por código del OPP (búsqueda parcial)',
    example: 'OPP1',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'El código debe ser una cadena de texto' })
  search?: string;

  @ApiProperty({
    description: 'Número de página (empezando desde 1)',
    example: 1,
    default: 1,
    minimum: 1,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'La página debe ser un número entero' })
  @Min(1, { message: 'La página debe ser mayor a 0' })
  page?: number = 1;

  @ApiProperty({
    description: 'Cantidad de elementos por página',
    example: 10,
    default: 10,
    minimum: 1,
    maximum: 100,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El límite debe ser un número entero' })
  @IsPositive({ message: 'El límite debe ser un número positivo' })
  limit?: number = 10;

  @ApiProperty({
    description: 'ID de la carrera para filtrar OPPs (opcional)',
    example: 1,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El ID de la carrera debe ser un número entero' })
  @IsPositive({ message: 'El ID de la carrera debe ser un número positivo' })
  carreraId?: number;
}