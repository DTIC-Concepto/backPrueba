import { ApiProperty } from '@nestjs/swagger';
import { ResultadoAprendizajeResponseDto } from './resultado-aprendizaje-response.dto';

export class ResultadoAprendizajePaginatedResponseDto {
  @ApiProperty({
    description: 'Lista de Resultados de Aprendizaje',
    type: [ResultadoAprendizajeResponseDto],
  })
  data: ResultadoAprendizajeResponseDto[];

  @ApiProperty({
    description: 'Número total de elementos',
    example: 25,
  })
  total: number;

  @ApiProperty({
    description: 'Página actual',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: 'Elementos por página',
    example: 10,
  })
  limit: number;

  @ApiProperty({
    description: 'Total de páginas',
    example: 3,
  })
  totalPages: number;

  @ApiProperty({
    description: 'Indica si hay página anterior',
    example: false,
  })
  hasPrevious: boolean;

  @ApiProperty({
    description: 'Indica si hay página siguiente',
    example: true,
  })
  hasNext: boolean;
}