import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, IsBoolean } from 'class-validator';

/**
 * DTO para catálogo de OPPs por programa
 * Usado en GET /programs/{programId}/opps?lang=es
 */
export class ProgramOppCatalogDto {
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
    example: 'Capacidad para diseñar y desarrollar sistemas de software escalables y mantenibles utilizando metodologías ágiles',
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
 * DTO para catálogo de RAs por programa
 * Usado en GET /programs/{programId}/learning-outcomes?lang=es
 */
export class ProgramRaCatalogDto {
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
    example: 'Aplicar métodos de análisis y diseño orientado a objetos para crear soluciones de software eficientes y mantenibles',
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
 * DTO de respuesta para catálogo de OPPs
 */
export class ProgramOppsCatalogResponseDto {
  @ApiProperty({
    description: 'Lista de OPPs del programa',
    type: [ProgramOppCatalogDto],
  })
  opps: ProgramOppCatalogDto[];

  @ApiProperty({
    description: 'ID del programa',
    example: 1,
  })
  @IsNumber()
  programId: number;

  @ApiProperty({
    description: 'Nombre del programa',
    example: 'Ingeniería en Sistemas Computacionales',
  })
  @IsString()
  programName: string;

  @ApiProperty({
    description: 'Total de OPPs en el programa',
    example: 7,
  })
  @IsNumber()
  totalOpps: number;
}

/**
 * DTO de respuesta para catálogo de RAs
 */
export class ProgramRasCatalogResponseDto {
  @ApiProperty({
    description: 'Lista de RAs del programa',
    type: [ProgramRaCatalogDto],
  })
  learningOutcomes: ProgramRaCatalogDto[];

  @ApiProperty({
    description: 'ID del programa',
    example: 1,
  })
  @IsNumber()
  programId: number;

  @ApiProperty({
    description: 'Nombre del programa',
    example: 'Ingeniería en Sistemas Computacionales',
  })
  @IsString()
  programName: string;

  @ApiProperty({
    description: 'Total de RAs en el programa',
    example: 12,
  })
  @IsNumber()
  totalLearningOutcomes: number;

  @ApiProperty({
    description: 'Distribución por tipo',
    example: {
      GENERAL: 4,
      ESPECIFICO: 8
    },
  })
  distributionByType: {
    GENERAL: number;
    ESPECIFICO: number;
  };
}