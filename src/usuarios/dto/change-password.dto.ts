import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength, MaxLength, Matches } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({
    description: 'Contraseña actual del usuario para verificación de identidad',
    type: String,
    example: 'ContraseñaActual123!',
    required: true,
  })
  @IsNotEmpty({ message: 'La contraseña actual es obligatoria' })
  @IsString({ message: 'La contraseña actual debe ser una cadena de texto' })
  contrasenaActual: string;

  @ApiProperty({
    description: 'Nueva contraseña que cumple con las políticas de seguridad establecidas',
    type: String,
    example: 'NuevaContraseña456#',
    required: true,
    minLength: 8,
    maxLength: 50,
  })
  @IsNotEmpty({ message: 'La nueva contraseña es obligatoria' })
  @IsString({ message: 'La nueva contraseña debe ser una cadena de texto' })
  @MinLength(8, { message: 'La nueva contraseña debe tener al menos 8 caracteres' })
  @MaxLength(50, { message: 'La nueva contraseña no puede exceder 50 caracteres' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    {
      message: 'La nueva contraseña debe contener al menos: una letra minúscula, una mayúscula, un número y un carácter especial (@$!%*?&)'
    }
  )
  contrasenaNueva: string;

  @ApiProperty({
    description: 'Confirmación de la nueva contraseña para evitar errores de digitación',
    type: String,
    example: 'NuevaContraseña456#',
    required: true,
  })
  @IsNotEmpty({ message: 'La confirmación de contraseña es obligatoria' })
  @IsString({ message: 'La confirmación de contraseña debe ser una cadena de texto' })
  confirmarContrasena: string;
}