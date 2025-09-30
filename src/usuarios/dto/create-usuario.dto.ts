import { IsEmail, IsEnum, IsNotEmpty, IsString, MinLength, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { RolEnum } from '../../common/enums/rol.enum';

export class CreateUsuarioDto {
  @ApiProperty({
    description: 'Nombres del usuario',
    example: 'Juan Carlos',
    maxLength: 100,
  })
  @IsNotEmpty()
  @IsString()
  nombres: string;

  @ApiProperty({
    description: 'Apellidos del usuario',
    example: 'Pérez González',
    maxLength: 100,
  })
  @IsNotEmpty()
  @IsString()
  apellidos: string;

  @ApiProperty({
    description: 'Número de cédula',
    example: '1234567890',
    maxLength: 20,
  })
  @IsNotEmpty()
  @IsString()
  cedula: string;

  @ApiProperty({
    description: 'Correo electrónico institucional',
    example: 'juan.perez@epn.edu.ec',
    format: 'email',
  })
  @IsNotEmpty()
  @IsEmail()
  correo: string;

  @ApiProperty({
    description: 'Contraseña del usuario',
    example: 'password123',
    minLength: 6,
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  contrasena: string;

  @ApiProperty({
    description: 'Rol del usuario en el sistema',
    enum: RolEnum,
    example: RolEnum.PROFESOR,
  })
  @IsNotEmpty()
  @IsEnum(RolEnum)
  rol: RolEnum;

  @ApiProperty({
    description: 'Estado activo del usuario',
    example: true,
    default: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  estadoActivo?: boolean = true;
}