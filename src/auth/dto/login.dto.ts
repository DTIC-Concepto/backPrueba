import { IsEmail, IsNotEmpty, IsString, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { RolEnum } from '../../common/enums/rol.enum';

export class LoginDto {
  @ApiProperty({
    description: 'Correo electrónico del usuario',
    example: 'admin@epn.edu.ec',
    format: 'email',
  })
  @IsNotEmpty()
  @IsEmail()
  correo: string;

  @ApiProperty({
    description: 'Contraseña del usuario',
    example: 'admin123',
    minLength: 6,
  })
  @IsNotEmpty()
  @IsString()
  contrasena: string;

  @ApiProperty({
    description: 'Rol seleccionado para la autenticación',
    enum: RolEnum,
    example: RolEnum.ADMINISTRADOR,
    required: true,
  })
  @IsNotEmpty()
  @IsEnum(RolEnum)
  rol: RolEnum;
}