import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, ValidateNested, ArrayMinSize } from 'class-validator';
import { CreateRaaRaMappingDto } from './create-raa-ra-mapping.dto';

export class CreateBatchRaaRaMappingsDto {
  @ApiProperty({
    description:
      'Array de relaciones RAA-RA a crear en lote. ' +
      'Cada elemento debe contener raaId, resultadoAprendizajeId, nivelAporte y opcionalmente justificación.',
    type: [CreateRaaRaMappingDto],
    example: [
      {
        raaId: 1,
        resultadoAprendizajeId: 5,
        nivelAporte: 'Alto',
        justificacion:
          'El RA de análisis matemático es fundamental para el desarrollo del RAA de álgebra lineal',
      },
      {
        raaId: 1,
        resultadoAprendizajeId: 6,
        nivelAporte: 'Medio',
        justificacion: 'Este RA complementa parcialmente las competencias del RAA',
      },
    ],
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'Debe proporcionar al menos una relación para crear' })
  @ValidateNested({ each: true })
  @Type(() => CreateRaaRaMappingDto)
  mappings: CreateRaaRaMappingDto[];
}
