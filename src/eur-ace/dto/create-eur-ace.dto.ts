import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEurAceDto {
  @ApiProperty({
    description: 'Código único del criterio EUR-ACE',
    example: '5.4.6',
    maxLength: 50,
  })
  @IsNotEmpty({ message: 'El código es obligatorio' })
  @IsString()
  @MaxLength(50, { message: 'El código no puede exceder 50 caracteres' })
  codigo: string;

  @ApiProperty({
    description: 'Descripción detallada del criterio EUR-ACE',
    example: 'Gestión de proyectos de ingeniería complejos aplicando metodologías modernas, considerando restricciones técnicas, económicas y de recursos humanos.',
  })
  @IsNotEmpty({ message: 'La descripción es obligatoria' })
  @IsString()
  descripcion: string;
}