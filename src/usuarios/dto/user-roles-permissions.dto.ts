import { ApiProperty } from '@nestjs/swagger';
import { RolEnum } from '../../common/enums/rol.enum';

export class RolPermissionDto {
  @ApiProperty({
    description: 'Nombre del rol',
    enum: RolEnum,
    example: RolEnum.PROFESOR,
  })
  rol: RolEnum;

  @ApiProperty({
    description: 'Descripción detallada del rol',
    type: String,
    example: 'Profesor universitario con acceso a funciones académicas básicas',
  })
  descripcion: string;

  @ApiProperty({
    description: 'Estado del rol (activo/inactivo)',
    type: Boolean,
    example: true,
  })
  activo: boolean;

  @ApiProperty({
    description: 'Permisos específicos del rol',
    type: [String],
    example: ['view_profile', 'update_profile', 'view_courses', 'submit_reports'],
  })
  permisos: string[];

  @ApiProperty({
    description: 'Nivel de autoridad del rol (1-10, donde 10 es máximo)',
    type: Number,
    example: 5,
  })
  nivelAutoridad: number;

  @ApiProperty({
    description: 'Indica si este es el rol principal del usuario (para compatibilidad)',
    type: Boolean,
    example: true,
  })
  esPrincipal: boolean;

  @ApiProperty({
    description: 'Fecha de asignación del rol',
    type: Date,
    example: '2024-01-15T10:30:00.000Z',
  })
  fechaAsignacion: Date;



  @ApiProperty({
    description: 'Observaciones sobre la asignación del rol',
    type: String,
    required: false,
    example: 'Rol asignado por el decano de facultad',
  })
  observaciones?: string;
}

export class UserRolesPermissionsDto {
  @ApiProperty({
    description: 'ID del usuario',
    type: Number,
    example: 5,
  })
  usuarioId: number;

  @ApiProperty({
    description: 'Nombre completo del usuario',
    type: String,
    example: 'Carlos Eduardo Rodríguez Silva',
  })
  nombreCompleto: string;

  @ApiProperty({
    description: 'Rol principal del usuario (para compatibilidad)',
    enum: RolEnum,
    example: RolEnum.PROFESOR,
  })
  rolPrincipal: RolEnum;

  @ApiProperty({
    description: 'Lista de todos los roles activos del usuario con sus permisos',
    type: [RolPermissionDto],
  })
  roles: RolPermissionDto[];

  @ApiProperty({
    description: 'Lista consolidada de todos los permisos únicos del usuario',
    type: [String],
    example: ['view_profile', 'update_profile', 'view_courses', 'submit_reports', 'manage_students'],
  })
  permisosConsolidados: string[];

  @ApiProperty({
    description: 'Nivel máximo de autoridad entre todos los roles',
    type: Number,
    example: 7,
  })
  nivelMaximoAutoridad: number;

  @ApiProperty({
    description: 'Facultad asociada al usuario',
    type: Object,
    required: false,
    example: {
      id: 1,
      nombre: 'Facultad de Ingeniería de Sistemas',
      codigo: 'FIS'
    },
  })
  facultad?: {
    id: number;
    nombre: string;
    codigo: string;
  };

  @ApiProperty({
    description: 'Resumen de capacidades del usuario',
    type: Object,
    example: {
      puedeGestionarUsuarios: false,
      puedeCrearCarreras: false,
      puedeVerDashboard: true,
      puedeGenerarReportes: true,
      esAdministrador: false,
      esDecano: false,
      esCoordinador: true
    },
  })
  capacidades: {
    puedeGestionarUsuarios: boolean;
    puedeCrearCarreras: boolean;
    puedeVerDashboard: boolean;
    puedeGenerarReportes: boolean;
    esAdministrador: boolean;
    esDecano: boolean;
    esCoordinador: boolean;
  };
}