import { ApiProperty } from '@nestjs/swagger';
import { 
  IsArray, 
  IsString, 
  IsNumber, 
  IsNotEmpty, 
  Length, 
  ValidateNested,
  ArrayMinSize,
  ArrayMaxSize 
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO para representar una relación individual RA-EURACE
 */
export class RaEuraceRelationDto {
  @ApiProperty({
    description: 'ID del Resultado de Aprendizaje',
    example: 1,
  })
  @IsNumber()
  @IsNotEmpty({ message: 'El ID del Resultado de Aprendizaje es obligatorio' })
  resultadoAprendizajeId: number;

  @ApiProperty({
    description: 'ID del criterio EUR-ACE',
    example: 2,
  })
  @IsNumber()
  @IsNotEmpty({ message: 'El ID del criterio EUR-ACE es obligatorio' })
  eurAceId: number;

  @ApiProperty({
    description: 'Justificación de la relación entre el RA y el criterio EUR-ACE',
    example: 'Este resultado de aprendizaje contribuye al criterio EUR-ACE mediante el desarrollo de competencias específicas en análisis de sistemas complejos, permitiendo que los estudiantes adquieran la capacidad de evaluar, diseñar y optimizar soluciones de ingeniería.',
    minLength: 10,
    maxLength: 1000,
  })
  @IsString()
  @IsNotEmpty({ message: 'La justificación es obligatoria' })
  @Length(10, 1000, { 
    message: 'La justificación debe tener entre 10 y 1000 caracteres' 
  })
  justificacion: string;
}

/**
 * DTO principal para creación en lote de relaciones RA-EURACE
 */
export class CreateBatchRaEuraceMappingsDto {
  @ApiProperty({
    description: 'Array de relaciones RA-EURACE a crear',
    type: [RaEuraceRelationDto],
    example: [
      {
        resultadoAprendizajeId: 1,
        eurAceId: 2,
        justificacion: 'Este RA contribuye al criterio EUR-ACE mediante desarrollo de competencias técnicas específicas.',
      },
      {
        resultadoAprendizajeId: 3,
        eurAceId: 2,
        justificacion: 'El RA fortalece el criterio EUR-ACE a través de la aplicación práctica de metodologías de análisis.',
      },
    ],
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'Debe incluir al menos una relación' })
  @ArrayMaxSize(50, { message: 'No se pueden procesar más de 50 relaciones a la vez' })
  @ValidateNested({ each: true })
  @Type(() => RaEuraceRelationDto)
  mappings: RaEuraceRelationDto[];
}

/**
 * DTO para filtrar relaciones RA-EURACE
 */
export class FilterRaEuraceMappingsDto {
  @ApiProperty({
    description: 'Filtrar por carrera ID',
    example: 1,
    required: false,
  })
  @IsNumber()
  @Type(() => Number)
  carreraId?: number;

  @ApiProperty({
    description: 'Filtrar por ID de Resultado de Aprendizaje',
    example: 1,
    required: false,
  })
  @IsNumber()
  @Type(() => Number)
  resultadoAprendizajeId?: number;

  @ApiProperty({
    description: 'Filtrar por ID de criterio EUR-ACE',
    example: 2,
    required: false,
  })
  @IsNumber()
  @Type(() => Number)
  eurAceId?: number;

  @ApiProperty({
    description: 'Filtrar por estado activo',
    example: true,
    required: false,
  })
  @Type(() => Boolean)
  estadoActivo?: boolean;
}

/**
 * DTO para respuesta de operación en lote
 */
export class BatchRaEuraceOperationResultDto {
  @ApiProperty({
    description: 'Total de relaciones solicitadas para crear',
    example: 3,
  })
  totalSolicitadas: number;

  @ApiProperty({
    description: 'Número de relaciones creadas exitosamente',
    example: 2,
  })
  exitosas: number;

  @ApiProperty({
    description: 'Número de relaciones que fallaron',
    example: 1,
  })
  fallidas: number;

  @ApiProperty({
    description: 'Lista de errores ocurridos durante la operación',
    type: [String],
    example: [
      'El Resultado de Aprendizaje con ID 999 no existe',
      'Ya existe una relación entre el RA ID 1 y el criterio EUR-ACE ID 2',
    ],
  })
  errores: string[];

  @ApiProperty({
    description: 'IDs de las relaciones creadas exitosamente',
    type: [Number],
    example: [15, 16],
  })
  relacionesCreadas: number[];
}