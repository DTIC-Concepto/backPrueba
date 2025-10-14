import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, IsBoolean, IsOptional } from 'class-validator';

/**
 * DTO para representar un OPP en la matriz
 */
export class MatrixOppDto {
  @ApiProperty({
    description: 'ID único del OPP',
    example: 1,
  })
  @IsNumber()
  id: number;

  @ApiProperty({
    description: 'Código del OPP',
    example: 'OPP001',
  })
  @IsString()
  code: string;

  @ApiProperty({
    description: 'Nombre del OPP',
    example: 'Diseñar sistemas de software',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Descripción detallada del OPP',
    example: 'Capacidad para diseñar y desarrollar sistemas de software escalables y mantenibles',
  })
  @IsString()
  description: string;

  @ApiProperty({
    description: 'Estado activo del OPP',
    example: true,
  })
  @IsBoolean()
  active: boolean;
}

/**
 * DTO para representar un RA en la matriz
 */
export class MatrixRaDto {
  @ApiProperty({
    description: 'ID único del RA',
    example: 1,
  })
  @IsNumber()
  id: number;

  @ApiProperty({
    description: 'Código del RA',
    example: 'RA001',
  })
  @IsString()
  code: string;

  @ApiProperty({
    description: 'Nombre del RA',
    example: 'Análisis y diseño de software',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Descripción detallada del RA',
    example: 'Aplicar métodos de análisis y diseño para crear soluciones de software eficientes',
  })
  @IsString()
  description: string;

  @ApiProperty({
    description: 'Estado activo del RA',
    example: true,
  })
  @IsBoolean()
  active: boolean;

  @ApiProperty({
    description: 'Tipo del RA',
    example: 'ESPECIFICO',
    enum: ['GENERAL', 'ESPECIFICO'],
  })
  @IsString()
  type: string;
}

/**
 * DTO para representar una celda de la matriz (mapeo)
 */
export class MatrixMappingDto {
  @ApiProperty({
    description: 'ID del OPP',
    example: 1,
  })
  @IsNumber()
  oppId: number;

  @ApiProperty({
    description: 'ID del RA',
    example: 1,
  })
  @IsNumber()
  raId: number;

  @ApiProperty({
    description: 'Indica si existe mapeo entre OPP y RA',
    example: true,
  })
  @IsBoolean()
  hasMaping: boolean;

  @ApiProperty({
    description: 'ID del mapeo si existe',
    example: 15,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  mappingId?: number;

  @ApiProperty({
    description: 'Justificación del mapeo si existe',
    example: 'Este RA contribuye al OPP mediante el desarrollo de competencias específicas en análisis',
    required: false,
  })
  @IsOptional()
  @IsString()
  justification?: string;
}

/**
 * DTO principal para la respuesta de la matriz OPP-RA
 */
export class OppRaMatrixResponseDto {
  @ApiProperty({
    description: 'Lista de OPPs para las filas de la matriz',
    type: [MatrixOppDto],
  })
  opps: MatrixOppDto[];

  @ApiProperty({
    description: 'Lista de RAs para las columnas de la matriz',
    type: [MatrixRaDto],
  })
  ras: MatrixRaDto[];

  @ApiProperty({
    description: 'Mapeos existentes entre OPPs y RAs',
    type: [MatrixMappingDto],
  })
  mappings: MatrixMappingDto[];

  @ApiProperty({
    description: 'ID de la carrera/programa',
    example: 1,
  })
  @IsNumber()
  programId: number;

  @ApiProperty({
    description: 'Nombre de la carrera/programa',
    example: 'Ingeniería en Sistemas Computacionales',
  })
  @IsString()
  programName: string;

  @ApiProperty({
    description: 'Estadísticas de la matriz',
    example: {
      totalOpps: 7,
      totalRas: 12,
      totalMappings: 15,
      coveragePercentage: 65.5
    },
  })
  stats: {
    totalOpps: number;
    totalRas: number;
    totalMappings: number;
    coveragePercentage: number;
  };
}

/**
 * DTO para filtros de la matriz
 */
export class MatrixFiltersDto {
  @ApiProperty({
    description: 'Filtrar por tipo de RA',
    example: 'ESPECIFICO',
    enum: ['GENERAL', 'ESPECIFICO'],
    required: false,
  })
  @IsOptional()
  @IsString()
  raType?: string;

  @ApiProperty({
    description: 'Incluir solo elementos activos',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  activeOnly?: boolean;

  @ApiProperty({
    description: 'Incluir estadísticas detalladas',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  includeStats?: boolean;
}

// ========== DTOs para Matriz RA-EURACE (HU7758) ==========

/**
 * DTO para representar un criterio EUR-ACE en la matriz
 */
export class MatrixEurAceDto {
  @ApiProperty({
    description: 'ID único del criterio EUR-ACE',
    example: 1,
  })
  @IsNumber()
  id: number;

  @ApiProperty({
    description: 'Código del criterio EUR-ACE',
    example: 'EA1.1',
  })
  @IsString()
  code: string;

  @ApiProperty({
    description: 'Nombre del criterio EUR-ACE',
    example: 'Conocimiento y comprensión',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Descripción detallada del criterio EUR-ACE',
    example: 'Conocimiento y comprensión de los principios científicos y matemáticos',
  })
  @IsString()
  description: string;

  @ApiProperty({
    description: 'Estado activo del criterio EUR-ACE',
    example: true,
  })
  @IsBoolean()
  active: boolean;
}

/**
 * DTO para representar una celda de la matriz RA-EURACE (mapeo)
 */
export class MatrixRaEuraceMappingDto {
  @ApiProperty({
    description: 'ID del RA',
    example: 1,
  })
  @IsNumber()
  raId: number;

  @ApiProperty({
    description: 'ID del criterio EUR-ACE',
    example: 1,
  })
  @IsNumber()
  eurAceId: number;

  @ApiProperty({
    description: 'Indica si existe mapeo entre RA y EUR-ACE',
    example: true,
  })
  @IsBoolean()
  hasMapping: boolean;

  @ApiProperty({
    description: 'ID del mapeo si existe',
    example: 25,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  mappingId?: number;

  @ApiProperty({
    description: 'Justificación del mapeo si existe',
    example: 'Este RA contribuye al criterio EUR-ACE mediante el desarrollo de conocimientos técnicos especializados',
    required: false,
  })
  @IsOptional()
  @IsString()
  justification?: string;
}

/**
 * DTO principal para la respuesta de la matriz RA-EURACE
 */
export class RaEuraceMatrixResponseDto {
  @ApiProperty({
    description: 'Lista de RAs para las filas de la matriz',
    type: [MatrixRaDto],
  })
  ras: MatrixRaDto[];

  @ApiProperty({
    description: 'Lista de criterios EUR-ACE para las columnas de la matriz',
    type: [MatrixEurAceDto],
  })
  eurAceCriteria: MatrixEurAceDto[];

  @ApiProperty({
    description: 'Mapeos existentes entre RAs y criterios EUR-ACE',
    type: [MatrixRaEuraceMappingDto],
  })
  mappings: MatrixRaEuraceMappingDto[];

  @ApiProperty({
    description: 'ID de la carrera/programa',
    example: 1,
  })
  @IsNumber()
  programId: number;

  @ApiProperty({
    description: 'Nombre de la carrera/programa',
    example: 'Ingeniería en Sistemas Computacionales',
  })
  @IsString()
  programName: string;

  @ApiProperty({
    description: 'Estadísticas de la matriz RA-EURACE',
    example: {
      totalRas: 12,
      totalEurAceCriteria: 8,
      totalMappings: 18,
      coveragePercentage: 72.3
    },
  })
  stats: {
    totalRas: number;
    totalEurAceCriteria: number;
    totalMappings: number;
    coveragePercentage: number;
  };
}