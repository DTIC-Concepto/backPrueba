import { ApiProperty } from '@nestjs/swagger';
import { RolEnum } from '../../common/enums/rol.enum';

export class UsuarioSearchResponseDto {
  @ApiProperty({
    description: 'ID único del usuario',
    example: 7,
  })
  id: number;

  @ApiProperty({
    description: 'Nombres del usuario',
    example: 'Carlos Eduardo',
  })
  nombres: string;

  @ApiProperty({
    description: 'Apellidos del usuario',
    example: 'Rodríguez Silva',
  })
  apellidos: string;

  @ApiProperty({
    description: 'Correo electrónico del usuario',
    example: 'carlos.rodriguez@epn.edu.ec',
  })
  correo: string;

  @ApiProperty({
    description: 'Rol del usuario en el sistema',
    enum: RolEnum,
    example: RolEnum.DECANO,
  })
  rol: RolEnum;

  @ApiProperty({
    description: 'Estado activo del usuario',
    example: true,
  })
  estadoActivo: boolean;

  @ApiProperty({
    description: 'Nombre completo del usuario (nombres + apellidos)',
    example: 'Carlos Eduardo Rodríguez Silva',
  })
  nombreCompleto: string;
}