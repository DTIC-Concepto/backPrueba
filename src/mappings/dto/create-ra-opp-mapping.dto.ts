import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsNumber, IsArray, ArrayMinSize, ValidateNested, Length } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateRaOppMappingDto {
  @ApiProperty({
    description: 'ID del Resultado de Aprendizaje',
    example: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  resultadoAprendizajeId: number;

  @ApiProperty({
    description: 'ID del Objetivo de Perfil Profesional',
    example: 2,
  })
  @IsNumber()
  @IsNotEmpty()
  oppId: number;

  @ApiProperty({
    description: 'Justificación de la relación entre el RA y el OPP (mínimo 10 caracteres)',
    example: 'Este RA contribuye directamente al cumplimiento del OPP mediante el desarrollo de competencias técnicas específicas',
    required: true,
  })
  @IsString()
  @IsNotEmpty({ message: 'Debe completar el campo de justificación' })
  @Length(10, 1000, { message: 'La justificación debe tener entre 10 y 1000 caracteres' })
  justificacion: string;
}

export class CreateBatchRaOppMappingsDto {
  @ApiProperty({
    description: 'Lista de relaciones RA-OPP a crear',
    type: [CreateRaOppMappingDto],
    example: [
      {
        resultadoAprendizajeId: 1,
        oppId: 2,
        justificacion: 'Contribuye al desarrollo de competencias técnicas'
      },
      {
        resultadoAprendizajeId: 1,
        oppId: 3,
        justificacion: 'Fortalece habilidades de análisis y síntesis'
      }
    ],
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'Debe incluir al menos una relación' })
  @ValidateNested({ each: true })
  @Type(() => CreateRaOppMappingDto)
  mappings: CreateRaOppMappingDto[];
}

export class FilterRaOppMappingsDto {
  @ApiProperty({
    description: 'ID de la carrera para filtrar mappings',
    required: false,
    example: 1,
  })
  @IsNumber()
  @IsOptional()
  carreraId?: number;

  @ApiProperty({
    description: 'ID del Resultado de Aprendizaje',
    required: false,
    example: 1,
  })
  @IsNumber()
  @IsOptional()
  resultadoAprendizajeId?: number;

  @ApiProperty({
    description: 'ID del OPP',
    required: false,
    example: 2,
  })
  @IsNumber()
  @IsOptional()
  oppId?: number;

  @ApiProperty({
    description: 'Estado activo del mapping',
    required: false,
    example: true,
  })
  @IsOptional()
  estadoActivo?: boolean;
}

export class BatchOperationResultDto {
  @ApiProperty({
    description: 'Número total de operaciones solicitadas',
    example: 5,
  })
  totalSolicitadas: number;

  @ApiProperty({
    description: 'Número de relaciones creadas exitosamente',
    example: 3,
  })
  exitosas: number;

  @ApiProperty({
    description: 'Número de relaciones que fallaron',
    example: 2,
  })
  fallidas: number;

  @ApiProperty({
    description: 'Lista de errores encontrados',
    example: [
      'El RA con ID 5 no existe',
      'Ya existe una relación entre RA 1 y OPP 2'
    ],
  })
  errores: string[];

  @ApiProperty({
    description: 'Lista de IDs de las relaciones creadas',
    example: [1, 2, 3],
  })
  relacionesCreadas: number[];
}