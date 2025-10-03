import { ApiProperty } from '@nestjs/swagger';
import { UsuarioModel } from '../models/usuario.model';

export class PaginationMetaDto {
  @ApiProperty({
    description: 'Página actual',
    type: Number,
    example: 1,
  })
  currentPage: number;

  @ApiProperty({
    description: 'Número de elementos por página',
    type: Number,
    example: 10,
  })
  pageSize: number;

  @ApiProperty({
    description: 'Total de elementos encontrados',
    type: Number,
    example: 25,
  })
  totalItems: number;

  @ApiProperty({
    description: 'Total de páginas disponibles',
    type: Number,
    example: 3,
  })
  totalPages: number;

  @ApiProperty({
    description: 'Indica si hay una página anterior',
    type: Boolean,
    example: false,
  })
  hasPreviousPage: boolean;

  @ApiProperty({
    description: 'Indica si hay una página siguiente',
    type: Boolean,
    example: true,
  })
  hasNextPage: boolean;

  @ApiProperty({
    description: 'Palabra clave utilizada en la búsqueda',
    type: String,
    example: 'juan.perez',
    required: false,
  })
  searchTerm?: string;
}

export class UsuarioPaginatedResponseDto {
  @ApiProperty({
    description: 'Lista de usuarios encontrados en la página actual',
    type: [UsuarioModel],
  })
  data: UsuarioModel[];

  @ApiProperty({
    description: 'Metadatos de la paginación y búsqueda',
    type: PaginationMetaDto,
  })
  meta: PaginationMetaDto;
}