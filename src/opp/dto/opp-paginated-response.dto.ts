import { ApiProperty } from '@nestjs/swagger';
import { OppResponseDto } from './opp-response.dto';

export class OppPaginatedResponseDto {
  @ApiProperty({
    description: 'Lista de Objetivos de Programa',
    type: [OppResponseDto],
  })
  data: OppResponseDto[];

  @ApiProperty({
    description: 'Número total de OPPs que coinciden con los filtros',
    example: 25,
  })
  total: number;

  @ApiProperty({
    description: 'Página actual',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: 'Cantidad de elementos por página',
    example: 10,
  })
  limit: number;

  @ApiProperty({
    description: 'Número total de páginas',
    example: 3,
  })
  totalPages: number;

  @ApiProperty({
    description: 'Indica si hay una página anterior',
    example: false,
  })
  hasPrevious: boolean;

  @ApiProperty({
    description: 'Indica si hay una página siguiente',
    example: true,
  })
  hasNext: boolean;
}