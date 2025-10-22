import { IsEmail, IsEnum, IsNotEmpty, IsString, MinLength, IsBoolean, IsOptional, IsNumber, IsPositive, IsUrl } from 'class-validator';
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
    description: 'URL de la foto de perfil del usuario',
    example: 'https://example.com/photos/juan-perez.jpg',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsUrl({}, { message: 'La foto debe ser una URL válida' })
  foto?: string;

  @ApiProperty({
    description: 'Rol del usuario en el sistema. IMPORTANTE: Los roles DECANO y SUBDECANO requieren facultadId y solo puede haber uno por facultad.',
    enum: RolEnum,
    example: RolEnum.PROFESOR,
    examples: {
      administrador: {
        summary: 'Administrador del sistema',
        value: RolEnum.ADMINISTRADOR,
      },
      decano: {
        summary: 'Decano de facultad (requiere facultadId, máximo 1 por facultad)',
        value: RolEnum.DECANO,
      },
      subdecano: {
        summary: 'Subdecano de facultad (requiere facultadId, máximo 1 por facultad)',
        value: RolEnum.SUBDECANO,
      },
      profesor: {
        summary: 'Profesor general',
        value: RolEnum.PROFESOR,
      },
    },
  })
  @IsNotEmpty()
  @IsEnum(RolEnum)
  rol: RolEnum;

  @ApiProperty({
    description: 'ID de la facultad a la que pertenece el usuario. OBLIGATORIO para roles DECANO, SUBDECANO y JEFE_DEPARTAMENTO. Opcional para otros roles.',
    example: 1,
    required: false,
    examples: {
      ingenieria: {
        summary: 'Facultad de Ingeniería',
        value: 1,
      },
      medicina: {
        summary: 'Facultad de Medicina',
        value: 2,
      },
    },
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  facultadId?: number;

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