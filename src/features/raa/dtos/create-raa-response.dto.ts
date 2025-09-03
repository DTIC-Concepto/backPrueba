import { ApiProperty } from '@nestjs/swagger';

export class CreateRaaResponseDto {
  @ApiProperty({
    description: 'Indica si la creación fue exitosa',
    example: true,
  })
  exitoso: boolean;

  @ApiProperty({
    description: 'Mensaje descriptivo del resultado',
    example: 'RAA registrado exitosamente',
  })
  mensaje: string;

  @ApiProperty({
    description: 'Datos del RAA creado',
    example: {
      id: 1,
      codigo: 'RAA-001',
      descripcion: 'El estudiante será capaz de...',
      asignaturaId: 1,
      tipoRaaId: 1,
      estadoActivo: true,
      creadoEn: '2025-09-02T00:00:00.000Z',
      actualizadoEn: '2025-09-02T00:00:00.000Z'
    }
  })
  raa: {
    id: number;
    codigo: string;
    descripcion: string;
    asignaturaId: number;
    tipoRaaId: number;
    estadoActivo: boolean;
    creadoEn: Date;
    actualizadoEn: Date;
  };

  @ApiProperty({
    description: 'Información adicional sobre el registro',
    example: {
      codigoGenerado: true,
      relacionesCreadas: ['asignatura', 'tipoRaa']
    },
    required: false,
  })
  detalles?: {
    codigoGenerado: boolean;
    relacionesCreadas: string[];
    advertencias?: string[];
  };
}

export class ValidacionErrorDto {
  @ApiProperty({
    description: 'Campo que contiene el error',
    example: 'codigo',
  })
  campo: string;

  @ApiProperty({
    description: 'Valor proporcionado',
    example: '',
  })
  valor: any;

  @ApiProperty({
    description: 'Reglas de validación que fallaron',
    example: ['isNotEmpty', 'isString'],
  })
  errores: string[];

  @ApiProperty({
    description: 'Mensaje descriptivo del error',
    example: 'El código del RAA es obligatorio',
  })
  mensaje: string;
}

export class CreateRaaErrorResponseDto {
  @ApiProperty({
    description: 'Indica que la creación falló',
    example: false,
  })
  exitoso: boolean;

  @ApiProperty({
    description: 'Mensaje general del error',
    example: 'Error al registrar el RAA',
  })
  mensaje: string;

  @ApiProperty({
    description: 'Código de error HTTP',
    example: 400,
  })
  codigoEstado: number;

  @ApiProperty({
    description: 'Detalles específicos de los errores de validación',
    type: [ValidacionErrorDto],
    required: false,
  })
  erroresValidacion?: ValidacionErrorDto[];

  @ApiProperty({
    description: 'Error técnico detallado',
    example: 'Ya existe un RAA con el código RAA-001',
    required: false,
  })
  errorTecnico?: string;
}
