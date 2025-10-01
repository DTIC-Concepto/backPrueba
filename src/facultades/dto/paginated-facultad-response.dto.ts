import { ApiProperty } from '@nestjs/swagger';
import { FacultadListResponseDto } from './facultad-list-response.dto';

export class PaginatedFacultadResponseDto {
  @ApiProperty({
    description: 'Array de facultades en la página actual',
    type: [FacultadListResponseDto],
  })
  data: FacultadListResponseDto[];

  @ApiProperty({
    description: 'Número total de facultades que coinciden con los filtros',
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
    description: 'Número total de páginas disponibles',
    example: 3,
  })
  totalPages: number;

  @ApiProperty({
    description: 'Indica si hay una página siguiente disponible',
    example: true,
  })
  hasNext: boolean;

  @ApiProperty({
    description: 'Indica si hay una página anterior disponible',
    example: false,
  })
  hasPrev: boolean;

  @ApiProperty({
    description: 'Metadatos adicionales de la paginación',
    type: 'object',
    properties: {
      startIndex: { type: 'number', example: 1, description: 'Índice del primer elemento en la página actual' },
      endIndex: { type: 'number', example: 10, description: 'Índice del último elemento en la página actual' },
      hasData: { type: 'boolean', example: true, description: 'Indica si la página actual tiene datos' },
    },
  })
  meta: {
    startIndex: number;
    endIndex: number;
    hasData: boolean;
  };
}