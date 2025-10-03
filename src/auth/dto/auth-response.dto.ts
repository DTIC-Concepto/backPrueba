import { ApiProperty } from '@nestjs/swagger';
import { RolEnum } from '../../common/enums/rol.enum';

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