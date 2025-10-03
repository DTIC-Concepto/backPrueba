import {
  Controller,
  Get,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolEnum } from '../common/enums/rol.enum';
import { RolesPermissionsService } from '../common/services/roles-permissions.service';
import { ErrorResponseDto } from '../common/dto/error-response.dto';

// DTOs para las respuestas
export class PermissionDto {
  permiso: string;
  descripcion: string;
  categoria: string;
}

export class RoleWithPermissionsDto {
  rol: RolEnum;
  descripcion: string;
  permisos: string[];
  nivelAutoridad: number;
  categoria: string;
  activo: boolean;
}

export class AllPermissionsResponseDto {
  permisos: PermissionDto[];
  totalPermisos: number;
  categorias: string[];
}

export class AllRolesResponseDto {
  roles: RoleWithPermissionsDto[];
  totalRoles: number;
  sistemaMultiRol: boolean;
}

@ApiTags('Roles y Permisos')
@ApiBearerAuth('bearer')
@Controller('roles')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RolEnum.ADMINISTRADOR) // Solo administradores pueden gestionar roles
export class RolesController {
  constructor(
    private readonly rolesPermissionsService: RolesPermissionsService,
  ) {}

  @Get('permissions')
  @ApiOperation({
    summary: 'Listar todos los permisos disponibles (HU5114 - Tarea 5273)',
    description: `
      Permite al administrador obtener una lista completa de todos los permisos disponibles 
      que se pueden asociar a los roles en el sistema.
      
      **Funcionalidad principal:**
      - 📋 **Lista completa**: Muestra todos los permisos disponibles en el sistema
      - 🏷️ **Categorización**: Permisos organizados por categorías funcionales
      - 📊 **Información detallada**: Incluye descripción y contexto de cada permiso
      - 🔍 **Fácil consulta**: Formato optimizado para administración
      
      **Categorías de permisos:**
      - **Gestión de usuarios**: Crear, actualizar, eliminar usuarios
      - **Gestión académica**: Facultades, carreras, coordinadores
      - **Dashboards**: Acceso a diferentes vistas de dashboard
      - **Reportes**: Generación de informes y estadísticas
      - **Sistema**: Configuración y administración del sistema
      - **Perfil**: Gestión de perfil personal
      
      **Casos de uso:**
      - Configurar permisos de nuevos roles
      - Auditar permisos disponibles en el sistema
      - Verificar capacidades antes de asignar roles
      - Documentar funcionalidades del sistema
    `
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de permisos obtenida exitosamente',
    type: AllPermissionsResponseDto,
    example: {
      permisos: [
        {
          permiso: 'manage_users',
          descripcion: 'Gestionar usuarios del sistema (crear, actualizar, eliminar)',
          categoria: 'Gestión de Usuarios'
        },
        {
          permiso: 'create_faculties',
          descripcion: 'Crear nuevas facultades en el sistema',
          categoria: 'Gestión Académica'
        },
        {
          permiso: 'view_all_dashboards',
          descripcion: 'Acceso a todos los dashboards del sistema',
          categoria: 'Dashboards'
        }
      ],
      totalPermisos: 25,
      categorias: ['Gestión de Usuarios', 'Gestión Académica', 'Dashboards', 'Reportes', 'Sistema', 'Perfil']
    }
  })
  @ApiUnauthorizedResponse({
    description: 'Solo administradores pueden acceder a esta funcionalidad',
    type: ErrorResponseDto,
    example: {
      statusCode: 401,
      timestamp: '2024-12-08T21:30:00.000Z',
      path: '/roles/permissions',
      message: 'Acceso denegado. Se requiere rol de administrador.',
      error: 'Unauthorized'
    }
  })
  async getAllPermissions(): Promise<AllPermissionsResponseDto> {
    const permisosModels = await this.rolesPermissionsService.getAllPermissions();
    
    const categorias = new Set<string>();
    const permisos = permisosModels.map(permiso => {
      categorias.add(permiso.categoria);
      return {
        permiso: permiso.codigo,
        descripcion: permiso.descripcion,
        categoria: permiso.categoria,
      };
    }).sort((a, b) => a.categoria.localeCompare(b.categoria) || a.permiso.localeCompare(b.permiso));

    return {
      permisos,
      totalPermisos: permisos.length,
      categorias: Array.from(categorias).sort(),
    };
  }

  @Get()
  @ApiOperation({
    summary: 'Listar todos los roles con sus permisos (HU5114 - Tarea 5308)',
    description: `
      Permite al administrador visualizar la configuración actual de todos los roles 
      y sus permisos asociados en el sistema.
      
      **Información proporcionada:**
      - 🎭 **Roles completos**: Lista de todos los roles disponibles
      - 🔐 **Permisos detallados**: Permisos específicos de cada rol
      - 📊 **Niveles de autoridad**: Jerarquía de autoridad entre roles
      - 📝 **Descripciones**: Contexto y propósito de cada rol
      - ✅ **Estado actual**: Roles activos y configuración del sistema
      
      **Roles del sistema:**
      - **ADMINISTRADOR**: Acceso completo al sistema
      - **DGIP**: Director General de Investigación y Posgrado
      - **DECANO**: Autoridad sobre facultad específica
      - **SUBDECANO**: Autoridad delegada en facultad
      - **JEFE_DEPARTAMENTO**: Gestión de departamento
      - **COORDINADOR**: Coordinación de carrera específica
      - **PROFESOR**: Funciones académicas básicas
      - **CEI**: Comité de Ética de la Investigación
      
      **Casos de uso:**
      - Auditar configuración actual de roles y permisos
      - Verificar jerarquías de autoridad
      - Planificar cambios en permisos
      - Documentar estructura organizacional
      - Troubleshooting de accesos
    `
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de roles con permisos obtenida exitosamente',
    type: AllRolesResponseDto,
    example: {
      roles: [
        {
          rol: 'ADMINISTRADOR',
          descripcion: 'Administrador del sistema con acceso completo a todas las funcionalidades',
          permisos: [
            'manage_users', 'create_users', 'update_users', 'delete_users',
            'manage_faculties', 'create_faculties', 'update_faculties',
            'manage_careers', 'create_careers', 'update_careers',
            'view_all_dashboards', 'generate_all_reports', 'manage_system_settings'
          ],
          nivelAutoridad: 10,
          categoria: 'Administración',
          activo: true
        },
        {
          rol: 'DECANO',
          descripcion: 'Decano de facultad con autoridad sobre su facultad específica',
          permisos: [
            'manage_faculty_careers', 'create_careers', 'update_careers',
            'manage_faculty_users', 'assign_coordinators', 'assign_department_heads',
            'view_faculty_dashboard', 'generate_faculty_reports'
          ],
          nivelAutoridad: 8,
          categoria: 'Gestión Académica',
          activo: true
        }
      ],
      totalRoles: 8,
      sistemaMultiRol: true
    }
  })
  @ApiUnauthorizedResponse({
    description: 'Solo administradores pueden acceder a esta funcionalidad',
    type: ErrorResponseDto
  })
  async getAllRoles(): Promise<AllRolesResponseDto> {
    const rolesWithPermissions = await this.rolesPermissionsService.getAllRolesWithPermissions();
    
    const roles = rolesWithPermissions.map(rolInfo => ({
      rol: rolInfo.rol,
      descripcion: rolInfo.descripcion,
      permisos: rolInfo.permisos.map(p => p.codigo),
      nivelAutoridad: rolInfo.nivelAutoridad,
      categoria: this.getRoleCategory(rolInfo.rol),
      activo: true,
    }));

    return {
      roles,
      totalRoles: roles.length,
      sistemaMultiRol: true,
    };
  }

  private getRoleCategory(rol: string): string {
    switch (rol) {
      case 'ADMINISTRADOR':
        return 'Administración';
      case 'DGIP':
        return 'Dirección Académica';
      case 'DECANO':
      case 'SUBDECANO':
        return 'Gestión de Facultad';
      case 'JEFE_DEPARTAMENTO':
        return 'Gestión Departamental';
      case 'COORDINADOR':
        return 'Coordinación Académica';
      case 'PROFESOR':
        return 'Personal Académico';
      case 'CEI':
        return 'Comités Especializados';
      default:
        return 'General';
    }
  }
}