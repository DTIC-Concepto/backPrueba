import { ApiProperty } from '@nestjs/swagger';
import { CarreraListResponseDto } from './carrera-list-response.dto';

export class PaginationMetaDto {
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
    description: 'Total de elementos',
    example: 25,
  })
  total: number;

  @ApiProperty({
    description: 'Total de páginas',
    example: 3,
  })
  totalPages: number;

  @ApiProperty({
    description: 'Hay página siguiente',
    example: true,
  })
  hasNextPage: boolean;

  @ApiProperty({
    description: 'Hay página anterior',
    example: false,
  })
  hasPrevPage: boolean;
}

export class FilterAppliedDto {
  @ApiProperty({
    description: 'Filtros aplicados en la consulta',
    example: {
      facultadId: 1,
      estadoActivo: true,
      search: 'Ingeniería',
      modalidad: 'PRESENCIAL',
    },
  })
  filters: Record<string, any>;
}

export class CarreraPaginatedResponseDto {
  @ApiProperty({
    description: 'Lista de carreras',
    type: [CarreraListResponseDto],
  })
  data: CarreraListResponseDto[];

  @ApiProperty({
    description: 'Metadatos de paginación',
    type: PaginationMetaDto,
  })
  pagination: PaginationMetaDto;

  @ApiProperty({
    description: 'Filtros aplicados',
    type: FilterAppliedDto,
  })
  filters: FilterAppliedDto;
}