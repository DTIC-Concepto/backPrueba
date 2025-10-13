import { ApiProperty } from '@nestjs/swagger';
import { EurAceResponseDto } from './eur-ace-response.dto';

export class EurAcePaginatedResponseDto {
  @ApiProperty({
    description: 'Lista de criterios EUR-ACE',
    type: [EurAceResponseDto],
  })
  data: EurAceResponseDto[];

  @ApiProperty({
    description: 'Número total de criterios que cumplen los filtros',
    example: 25,
  })
  total: number;

  @ApiProperty({
    description: 'Página actual',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: 'Número de elementos por página',
    example: 10,
  })
  limit: number;

  @ApiProperty({
    description: 'Total de páginas disponibles',
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