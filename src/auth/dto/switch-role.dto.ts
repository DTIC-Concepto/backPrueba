import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { RolEnum } from '../../common/enums/rol.enum';

export class SwitchRoleDto {
  @ApiProperty({
    description: 'Nuevo rol a activar para la sesión',
    enum: RolEnum,
    example: RolEnum.COORDINADOR,
  })
  @IsNotEmpty()
  @IsEnum(RolEnum)
  nuevoRol: RolEnum;
}