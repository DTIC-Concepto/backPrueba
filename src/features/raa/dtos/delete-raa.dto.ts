import { IsNotEmpty, IsString, IsOptional, IsBoolean, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class DeleteRaaDto {
  @ApiProperty({
    description: 'ID del RAA a eliminar',
    example: 1,
  })
  @IsNotEmpty({ message: 'El ID del RAA es obligatorio' })
  @IsInt({ message: 'El ID debe ser un número entero' })
  @Min(1, { message: 'El ID debe ser mayor a 0' })
  @Type(() => Number)
  id: number;

  @ApiProperty({
    description: 'Confirmación de eliminación',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'La confirmación debe ser un valor booleano' })
  confirmarEliminacion?: boolean;

  @ApiProperty({
    description: 'Forzar eliminación física en lugar de soft delete',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'El parámetro de forzar eliminación debe ser un valor booleano' })
  forzarEliminacion?: boolean;
}

export class DeleteRaaResponseDto {
  @ApiProperty({
    description: 'Indica si la eliminación fue exitosa',
    example: true,
  })
  exitoso: boolean;

  @ApiProperty({
    description: 'Mensaje descriptivo del resultado',
    example: 'RAA eliminado correctamente',
  })
  mensaje: string;

  @ApiProperty({
    description: 'ID del RAA eliminado',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Código del RAA eliminado',
    example: 'RAA-001',
  })
  codigo: string;

  @ApiProperty({
    description: 'Tipo de eliminación realizada',
    example: 'soft_delete',
    enum: ['soft_delete', 'hard_delete', 'inactivated'],
  })
  tipoEliminacion: 'soft_delete' | 'hard_delete' | 'inactivated';

  @ApiProperty({
    description: 'Advertencias sobre relaciones existentes',
    example: [],
    required: false,
  })
  advertencias?: string[];
}
