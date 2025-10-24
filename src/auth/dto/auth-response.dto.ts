import { ApiProperty } from '@nestjs/swagger';
import { RolEnum } from '../../common/enums/rol.enum';

class CarreraInfoDto {
  @ApiProperty({ description: 'ID de la carrera', example: 1 })
  id: number;

  @ApiProperty({ description: 'Código de la carrera', example: 'ING-SIS' })
  codigo: string;

  @ApiProperty({ description: 'Nombre de la carrera', example: 'Ingeniería en Sistemas' })
  nombre: string;

  @ApiProperty({ description: 'Duración en semestres', example: 10 })
  duracion: number;

  @ApiProperty({ description: 'Modalidad de la carrera', example: 'PRESENCIAL' })
  modalidad: string;

  @ApiProperty({ 
    description: 'Indica si el usuario es coordinador de esta carrera', 
    example: true,
    required: false 
  })
  esCoordinador?: boolean;
}

class UserResponseDto {
  @ApiProperty({ description: 'ID único del usuario', example: 1 })
  id: number;

  @ApiProperty({ description: 'Nombres del usuario', example: 'Juan Carlos' })
  nombres: string;

  @ApiProperty({ description: 'Apellidos del usuario', example: 'Pérez González' })
  apellidos: string;

  @ApiProperty({ description: 'Correo electrónico', example: 'juan.perez@epn.edu.ec' })
  correo: string;

  @ApiProperty({ 
    description: 'Rol activo en la sesión actual', 
    enum: RolEnum,
    example: RolEnum.ADMINISTRADOR 
  })
  rol: RolEnum;

  @ApiProperty({ 
    description: 'Rol principal del usuario (rol original)', 
    enum: RolEnum,
    example: RolEnum.PROFESOR 
  })
  rolPrincipal: RolEnum;

  @ApiProperty({ 
    description: 'Lista de todos los roles disponibles para el usuario',
    enum: RolEnum,
    isArray: true,
    example: [RolEnum.PROFESOR, RolEnum.COORDINADOR]
  })
  rolesDisponibles: RolEnum[];

  @ApiProperty({ description: 'Estado activo del usuario', example: true })
  estadoActivo: boolean;

  @ApiProperty({ 
    description: 'Información de la carrera principal (primera o la de coordinador) - LEGACY',
    type: CarreraInfoDto,
    required: false
  })
  carrera?: CarreraInfoDto;

  @ApiProperty({ 
    description: 'Lista de todas las carreras asignadas al usuario (como profesor o coordinador)',
    type: [CarreraInfoDto],
    required: false
  })
  carreras?: CarreraInfoDto[];
}

export class AuthResponseDto {
  @ApiProperty({
    description: 'Token JWT para autenticación',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  access_token: string;

  @ApiProperty({
    description: 'Información del usuario autenticado',
    type: UserResponseDto,
  })
  user: UserResponseDto;
}