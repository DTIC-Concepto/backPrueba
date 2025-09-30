import { ApiProperty } from '@nestjs/swagger';
import { RolEnum } from '../../common/enums/rol.enum';

export class UsuarioListResponseDto {
  @ApiProperty({ 
    description: 'ID único del usuario', 
    example: 1 
  })
  id: number;

  @ApiProperty({ 
    description: 'Nombres del usuario', 
    example: 'Juan Carlos' 
  })
  nombres: string;

  @ApiProperty({ 
    description: 'Apellidos del usuario', 
    example: 'Pérez González' 
  })
  apellidos: string;

  @ApiProperty({ 
    description: 'Correo electrónico del usuario', 
    example: 'juan.perez@epn.edu.ec' 
  })
  correo: string;

  @ApiProperty({ 
    description: 'Rol del usuario en el sistema', 
    enum: RolEnum,
    example: RolEnum.PROFESOR 
  })
  rol: RolEnum;

  @ApiProperty({ 
    description: 'Estado activo del usuario', 
    example: true 
  })
  estadoActivo: boolean;

  @ApiProperty({ 
    description: 'Fecha de creación del usuario', 
    example: '2024-01-15T10:30:00.000Z' 
  })
  createdAt: Date;

  @ApiProperty({ 
    description: 'Fecha de última actualización del usuario', 
    example: '2024-01-20T15:45:00.000Z' 
  })
  updatedAt: Date;
}