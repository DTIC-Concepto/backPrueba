import { ApiProperty } from '@nestjs/swagger';
import { ModalidadEnum } from '../../common/enums/modalidad.enum';

export class CarreraListResponseDto {
  @ApiProperty({
    description: 'ID único de la carrera',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Código único de la carrera',
    example: 'ING-SIS',
  })
  codigo: string;

  @ApiProperty({
    description: 'Nombre completo de la carrera',
    example: 'Ingeniería en Sistemas Informáticos y de Computación',
  })
  nombre: string;

  @ApiProperty({
    description: 'Duración de la carrera en semestres',
    example: 10,
  })
  duracion: number;

  @ApiProperty({
    description: 'Modalidad de la carrera',
    enum: ModalidadEnum,
    example: ModalidadEnum.PRESENCIAL,
  })
  modalidad: ModalidadEnum;

  @ApiProperty({
    description: 'Estado activo de la carrera',
    example: true,
  })
  estadoActivo: boolean;

  @ApiProperty({
    description: 'Información de la facultad a la que pertenece',
    type: 'object',
    properties: {
      id: { type: 'number', example: 1 },
      codigo: { type: 'string', example: 'FIEEC' },
      nombre: { type: 'string', example: 'Facultad de Ingeniería Eléctrica y Electrónica' },
    },
  })
  facultad: {
    id: number;
    codigo: string;
    nombre: string;
  };

  @ApiProperty({
    description: 'Información del coordinador de la carrera',
    type: 'object',
    properties: {
      id: { type: 'number', example: 2 },
      nombres: { type: 'string', example: 'María Elena' },
      apellidos: { type: 'string', example: 'García López' },
      correo: { type: 'string', example: 'maria.garcia@epn.edu.ec' },
      rol: { type: 'string', example: 'COORDINADOR' },
    },
  })
  coordinador: {
    id: number;
    nombres: string;
    apellidos: string;
    correo: string;
    rol: string;
  };

  @ApiProperty({
    description: 'Fecha de creación del registro',
    example: '2024-01-15T10:30:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Fecha de última actualización del registro',
    example: '2024-01-20T15:45:00.000Z',
  })
  updatedAt: Date;
}