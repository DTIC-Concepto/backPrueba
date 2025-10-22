import { 
  IsEmail, 
  IsEnum, 
  IsNotEmpty, 
  IsString, 
  MinLength, 
  IsBoolean, 
  IsOptional, 
  IsNumber, 
  IsPositive, 
  IsArray, 
  ArrayMinSize,
  ValidateNested,
  IsUrl
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { RolEnum } from '../../common/enums/rol.enum';

class RolAsignacionDto {
  @ApiProperty({
    description: 'Rol a asignar al usuario',
    enum: RolEnum,
    example: RolEnum.PROFESOR,
  })
  @IsNotEmpty()
  @IsEnum(RolEnum)
  rol: RolEnum;

  @ApiProperty({
    description: 'Observaciones para esta asignación de rol',
    example: 'Asignado como coordinador de carrera de Sistemas',
    required: false,
  })
  @IsOptional()
  @IsString()
  observaciones?: string;
}

export class CreateUsuarioMultiRolDto {
  @ApiProperty({
    description: 'Nombres del usuario',
    example: 'María Elena',
    maxLength: 100,
  })
  @IsNotEmpty()
  @IsString()
  nombres: string;

  @ApiProperty({
    description: 'Apellidos del usuario',
    example: 'García Rodríguez',
    maxLength: 100,
  })
  @IsNotEmpty()
  @IsString()
  apellidos: string;

  @ApiProperty({
    description: 'Número de cédula',
    example: '1765432109',
    maxLength: 20,
  })
  @IsNotEmpty()
  @IsString()
  cedula: string;

  @ApiProperty({
    description: 'Correo electrónico institucional',
    example: 'maria.garcia@epn.edu.ec',
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
    example: 'https://example.com/photos/maria-garcia.jpg',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsUrl({}, { message: 'La foto debe ser una URL válida' })
  foto?: string;

  @ApiProperty({
    description: 'Rol principal del usuario (para compatibilidad con sistema anterior). Este rol también debe estar incluido en la lista de roles.',
    enum: RolEnum,
    example: RolEnum.PROFESOR,
  })
  @IsNotEmpty()
  @IsEnum(RolEnum)
  rolPrincipal: RolEnum;

  @ApiProperty({
    description: 'Lista de roles a asignar al usuario. Debe incluir al menos el rol principal.',
    type: [RolAsignacionDto],
    example: [
      {
        rol: RolEnum.PROFESOR,
        observaciones: 'Rol principal como docente'
      },
      {
        rol: RolEnum.COORDINADOR,
        observaciones: 'Coordinador de la carrera de Sistemas'
      }
    ],
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'Debe asignar al menos un rol' })
  @ValidateNested({ each: true })
  @Type(() => RolAsignacionDto)
  roles: RolAsignacionDto[];

  @ApiProperty({
    description: 'ID de la facultad a la que pertenece el usuario. OBLIGATORIO para roles DECANO, SUBDECANO y JEFE_DEPARTAMENTO.',
    example: 1,
    required: false,
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

  @ApiProperty({
    description: 'Usuario administrador que realiza la asignación',
    example: 'admin@universidad.edu',
    required: false,
  })
  @IsOptional()
  @IsString()
  asignadoPor?: string;
}