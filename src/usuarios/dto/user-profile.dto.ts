import { ApiProperty } from '@nestjs/swagger';
import { RolEnum } from '../../common/enums/rol.enum';

export class FacultadProfileDto {
  @ApiProperty({
    description: 'ID de la facultad',
    type: Number,
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Nombre de la facultad',
    type: String,
    example: 'Facultad de Ingeniería de Sistemas',
  })
  nombre: string;

  @ApiProperty({
    description: 'Código de la facultad',
    type: String,
    example: 'FIS',
  })
  codigo: string;
}

export class UserProfileDto {
  @ApiProperty({
    description: 'ID único del usuario',
    type: Number,
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Nombres del usuario',
    type: String,
    example: 'Juan Carlos',
  })
  nombres: string;

  @ApiProperty({
    description: 'Apellidos del usuario',
    type: String,
    example: 'Pérez González',
  })
  apellidos: string;

  @ApiProperty({
    description: 'Número de cédula de identidad',
    type: String,
    example: '1234567890',
  })
  cedula: string;

  @ApiProperty({
    description: 'Correo electrónico institucional',
    type: String,
    example: 'juan.perez@epn.edu.ec',
  })
  correo: string;

  @ApiProperty({
    description: 'Rol activo del usuario en la sesión actual',
    enum: RolEnum,
    example: RolEnum.PROFESOR,
  })
  rol: RolEnum;

  @ApiProperty({
    description: 'Rol principal del usuario en el sistema',
    enum: RolEnum,
    example: RolEnum.PROFESOR,
    required: false,
  })
  rolPrincipal?: RolEnum;

  @ApiProperty({
    description: 'Todos los roles disponibles para el usuario',
    type: [String],
    example: ['PROFESOR', 'COORDINADOR'],
    required: false,
  })
  rolesDisponibles?: string[];

  @ApiProperty({
    description: 'Estado activo del usuario',
    type: Boolean,
    example: true,
  })
  estadoActivo: boolean;

  @ApiProperty({
    description: 'Información de la facultad asociada al usuario',
    type: FacultadProfileDto,
    required: false,
  })
  facultad?: FacultadProfileDto;

  @ApiProperty({
    description: 'Fecha de creación de la cuenta',
    type: String,
    format: 'date-time',
    example: '2024-01-15T10:30:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Fecha de última actualización del perfil',
    type: String,
    format: 'date-time',
    example: '2024-01-20T15:45:00.000Z',
  })
  updatedAt: Date;
}