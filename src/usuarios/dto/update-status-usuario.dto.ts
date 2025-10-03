import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateStatusUsuarioDto {
  @ApiProperty({
    description: 'Nuevo estado del usuario (true para activo, false para inactivo)',
    type: Boolean,
    example: true,
    required: true,
  })
  @IsNotEmpty({ message: 'El estado activo es obligatorio' })
  @IsBoolean({ message: 'El estado activo debe ser un valor booleano' })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return value;
  })
  estadoActivo: boolean;
}