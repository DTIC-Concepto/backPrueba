import { IsNotEmpty, IsString, MaxLength, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFacultadDto {
  @ApiProperty({
    description: 'Nombre de la facultad',
    example: 'Facultad de Ingeniería de Sistemas',
    maxLength: 255,
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  nombre: string;

  @ApiProperty({
    description: 'Código único identificador de la facultad',
    example: 'FIS',
    maxLength: 20,
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(20)
  codigo: string;

  @ApiPropertyOptional({
    description: 'Descripción detallada de la facultad',
    example: 'Facultad especializada en la formación de ingenieros en sistemas computacionales',
  })
  @IsOptional()
  @IsString()
  descripcion?: string;

  @ApiPropertyOptional({
    description: 'Estado activo de la facultad',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  estadoActivo?: boolean = true;
}