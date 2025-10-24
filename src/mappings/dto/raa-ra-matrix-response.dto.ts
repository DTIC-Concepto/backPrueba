import { ApiProperty } from '@nestjs/swagger';

class RaaItemDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: '1.1' })
  code: string;

  @ApiProperty({ example: 'Reconocer estructuras de espacios vectoriales' })
  description: string;

  @ApiProperty({ example: 'Conocimientos' })
  tipo: string;

  @ApiProperty({ example: true })
  active: boolean;
}

class RaItemDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'RA001' })
  code: string;

  @ApiProperty({ example: 'Análisis matemático avanzado' })
  name: string;

  @ApiProperty({ example: 'GENERAL' })
  type: string;

  @ApiProperty({ example: true })
  active: boolean;
}

class RaaRaMappingItemDto {
  @ApiProperty({ example: 1 })
  raaId: number;

  @ApiProperty({ example: 5 })
  raId: number;

  @ApiProperty({ example: true })
  hasMapping: boolean;

  @ApiProperty({ example: 12, required: false })
  mappingId?: number;

  @ApiProperty({ example: 'Alto', required: false })
  nivelAporte?: string;

  @ApiProperty({
    example: 'El RA contribuye significativamente al RAA',
    required: false,
  })
  justification?: string;
}

class MatrixStatsDto {
  @ApiProperty({ example: 15 })
  totalRaas: number;

  @ApiProperty({ example: 12 })
  totalRas: number;

  @ApiProperty({ example: 28 })
  totalMappings: number;

  @ApiProperty({ example: 75.5 })
  coveragePercentage: number;
}

export class RaaRaMatrixResponseDto {
  @ApiProperty({ type: [RaaItemDto] })
  raas: RaaItemDto[];

  @ApiProperty({ type: [RaItemDto] })
  ras: RaItemDto[];

  @ApiProperty({ type: [RaaRaMappingItemDto] })
  mappings: RaaRaMappingItemDto[];

  @ApiProperty({ example: 2 })
  asignaturaId: number;

  @ApiProperty({ example: 'Álgebra Lineal' })
  asignaturaName: string;

  @ApiProperty({ example: 1 })
  carreraId: number;

  @ApiProperty({ example: 'Ingeniería de Software' })
  carreraName: string;

  @ApiProperty({ type: MatrixStatsDto })
  stats: MatrixStatsDto;
}
