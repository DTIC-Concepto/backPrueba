import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Put,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiNoContentResponse,
} from '@nestjs/swagger';
import { UsuariosService } from './usuarios.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { CreateUsuarioMultiRolDto } from './dto/create-usuario-multi-rol.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { UpdateStatusUsuarioDto } from './dto/update-status-usuario.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UserProfileDto } from './dto/user-profile.dto';
import { UserRolesPermissionsDto } from './dto/user-roles-permissions.dto';
import { SearchPaginatedUsuarioDto } from './dto/search-paginated-usuario.dto';
import { UsuarioPaginatedResponseDto } from './dto/usuario-paginated-response.dto';
import { FilterUsuarioDto } from './dto/filter-usuario.dto';
import { SearchUsuarioDto } from './dto/search-usuario.dto';
import { UsuarioListResponseDto } from './dto/usuario-list-response.dto';
import { UsuarioSearchResponseDto } from './dto/usuario-search-response.dto';
import { UsuarioModel } from './models/usuario.model';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { RolEnum } from '../common/enums/rol.enum';
import { ErrorResponseDto } from '../common/dto/error-response.dto';

@ApiTags('Usuarios')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard)
@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(RolesGuard)
  @Roles(RolEnum.ADMINISTRADOR)
  @ApiOperation({
    summary: 'Registrar nuevo usuario (HU5102)',
    description: 'Permite al administrador registrar un nuevo usuario en el sistema con validaciones de unicidad de cédula y email, asignación de roles y facultad. Solo accesible para usuarios con rol de Administrador.',
  })
  @ApiCreatedResponse({
    description: 'Usuario registrado exitosamente',
    type: UsuarioModel,
  })
  @ApiBadRequestResponse({
    description: 'Datos inválidos, correo/cédula ya registrados, o violación de restricciones de roles únicos por facultad',
    type: ErrorResponseDto,
    examples: {
      duplicateEmail: {
        summary: 'Email duplicado',
        value: {
          statusCode: 400,
          message: 'Ya existe un usuario con este correo electrónico',
          error: 'Bad Request',
        },
      },
      duplicateCedula: {
        summary: 'Cédula duplicada',
        value: {
          statusCode: 400,
          message: 'Ya existe un usuario con esta cédula',
          error: 'Bad Request',
        },
      },
      uniqueRoleViolation: {
        summary: 'Violación de rol único por facultad',
        value: {
          statusCode: 409,
          message: 'Ya existe un usuario con el rol DECANO en esta facultad: Juan Pérez',
          error: 'Conflict',
        },
      },
      missingFaculty: {
        summary: 'Falta facultad para rol específico',
        value: {
          statusCode: 400,
          message: 'El rol DECANO requiere asignación a una facultad específica',
          error: 'Bad Request',
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'No autorizado - Token JWT requerido',
    type: ErrorResponseDto,
  })
  create(@Body() createUsuarioDto: CreateUsuarioDto) {
    return this.usuariosService.create(createUsuarioDto);
  }

  @Post('multi-rol')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(RolesGuard)
  @Roles(RolEnum.ADMINISTRADOR)
  @ApiOperation({
    summary: 'Registrar nuevo usuario con múltiples roles',
    description: 'Permite al administrador registrar un nuevo usuario asignándole múltiples roles simultáneamente. El sistema valida que el rol principal esté incluido en la lista de roles, verifica unicidad de correo/cédula, y gestiona las restricciones de roles únicos por facultad. Solo accesible para usuarios con rol de Administrador.',
  })
  @ApiCreatedResponse({
    description: 'Usuario con múltiples roles registrado exitosamente',
    type: UsuarioModel,
  })
  @ApiBadRequestResponse({
    description: 'Datos inválidos, correo/cédula ya registrados, rol principal no incluido en lista, o violación de restricciones',
    type: ErrorResponseDto,
    examples: {
      rolPrincipalNoIncluido: {
        summary: 'Rol principal no incluido en lista',
        value: {
          statusCode: 400,
          message: 'El rol principal debe estar incluido en la lista de roles',
          error: 'Bad Request',
        },
      },
      facultadRequerida: {
        summary: 'Facultad requerida para ciertos roles',
        value: {
          statusCode: 400,
          message: 'Los roles DECANO, SUBDECANO requieren especificar una facultad',
          error: 'Bad Request',
        },
      },
      duplicateEmail: {
        summary: 'Email duplicado',
        value: {
          statusCode: 400,
          message: 'Ya existe un usuario con este correo electrónico',
          error: 'Bad Request',
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'No autorizado - Token JWT requerido',
    type: ErrorResponseDto,
  })
  createWithMultipleRoles(@Body() createUsuarioMultiRolDto: CreateUsuarioMultiRolDto) {
    return this.usuariosService.createWithMultipleRoles(createUsuarioMultiRolDto);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(RolEnum.ADMINISTRADOR)
  @ApiOperation({
    summary: 'Listar usuarios con filtros',
    description: 'Obtiene la lista de usuarios registrados en el sistema con filtros opcionales por rol, estado, facultad y búsqueda. Los administradores pueden filtrar por rol específico y facultad para gestionar permisos de manera eficiente. El resultado incluye todos los roles asignados a cada usuario (rol principal y roles adicionales). Solo accesible para usuarios con rol de Administrador.',
  })
  @ApiQuery({
    name: 'rol',
    required: false,
    description: 'Filtrar usuarios por rol específico',
    enum: RolEnum,
    example: RolEnum.PROFESOR,
  })
  @ApiQuery({
    name: 'estadoActivo',
    required: false,
    description: 'Filtrar usuarios por estado activo',
    type: Boolean,
    example: true,
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Buscar usuarios por nombres, apellidos o correo electrónico',
    type: String,
    example: 'Juan',
  })
  @ApiQuery({
    name: 'facultadId',
    required: false,
    description: 'Filtrar usuarios por facultad específica (ID de la facultad)',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de usuarios obtenida exitosamente. Si se aplica filtro por rol, solo retorna usuarios de ese rol específico. Si no hay coincidencias, retorna array vacío.',
    type: [UsuarioListResponseDto],
    examples: {
      allUsers: {
        summary: 'Todos los usuarios (sin filtros)',
        value: [
          {
            id: 1,
            nombres: 'Juan Carlos',
            apellidos: 'Pérez González',
            correo: 'juan.perez@epn.edu.ec',
            rol: 'PROFESOR',
            estadoActivo: true,
            createdAt: '2024-01-15T10:30:00.000Z',
            updatedAt: '2024-01-20T15:45:00.000Z'
          },
          {
            id: 2,
            nombres: 'María Elena',
            apellidos: 'García López',
            correo: 'maria.garcia@epn.edu.ec',
            rol: 'DECANO',
            estadoActivo: true,
            createdAt: '2024-01-16T09:15:00.000Z',
            updatedAt: '2024-01-18T14:20:00.000Z'
          }
        ]
      },
      filterByRole: {
        summary: 'Filtrado por rol PROFESOR (?rol=PROFESOR)',
        value: [
          {
            id: 1,
            nombres: 'Juan Carlos',
            apellidos: 'Pérez González',
            correo: 'juan.perez@epn.edu.ec',
            rol: 'PROFESOR',
            estadoActivo: true,
            createdAt: '2024-01-15T10:30:00.000Z',
            updatedAt: '2024-01-20T15:45:00.000Z'
          }
        ]
      },
      emptyResult: {
        summary: 'Sin coincidencias (?rol=CEI)',
        value: []
      }
    }
  })
  @ApiUnauthorizedResponse({
    description: 'No autorizado - Token inválido o usuario sin permisos de administrador',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: 'Unauthorized' },
        error: { type: 'string', example: 'Unauthorized' },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Filtros de búsqueda inválidos',
    type: ErrorResponseDto,
  })
  findAll(@Query() filterDto: FilterUsuarioDto): Promise<UsuarioModel[]> {
    return this.usuariosService.findAll(filterDto);
  }

  @Get('paginated')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RolEnum.ADMINISTRADOR)
  @ApiOperation({
    summary: 'Listar usuarios con búsqueda y paginación (HU5099 & HU5107)',
    description: `
      Permite a los administradores buscar y listar usuarios de manera paginada.
      
      **HU5099 - Búsqueda por palabra clave:**
      - 🔍 Buscar por **email**: encuentra coincidencias parciales en correos electrónicos
      - 👤 Buscar por **nombre**: encuentra coincidencias en nombres y apellidos
      - 🆔 Buscar por **cédula**: encuentra coincidencias exactas o parciales
      - 📝 **Búsqueda inteligente**: una sola palabra clave busca en todos los campos
      
      **HU5107 - Paginación:**
      - 📄 **Control de páginas**: Especifica página actual (empezando desde 1)
      - 📊 **Tamaño de página**: Define cuántos resultados mostrar (máximo 50)
      - 📈 **Metadatos completos**: Información de paginación y totales
      - 🔄 **Navegación**: Indicadores de página anterior/siguiente disponibles
      
      **Características adicionales:**
      - ✅ **Sin errores en búsquedas vacías**: Retorna lista vacía si no hay coincidencias
      - 🎯 **Búsqueda tolerante**: Ignora espacios en blanco y mayúsculas/minúsculas
      - 📋 **Ordenamiento**: Resultados ordenados alfabéticamente por apellidos
      - 🔗 **Relaciones**: Incluye información de la facultad asociada
      
      **Casos de uso:**
      - Buscar usuario específico por email o cédula
      - Navegar por listado completo de usuarios
      - Filtrar usuarios para tareas administrativas
      - Gestión eficiente de grandes volúmenes de datos
    `
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Palabra clave para buscar en email, nombres, apellidos o cédula del usuario',
    type: String,
    example: 'juan.perez@epn.edu.ec',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Número de página (empezando desde 1)',
    type: Number,
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Número de elementos por página (máximo 50)',
    type: Number,
    example: 10,
  })
  @ApiQuery({
    name: 'rol',
    required: false,
    description: 'Filtrar usuarios por rol específico (incluye rol principal y roles adicionales)',
    enum: RolEnum,
    example: RolEnum.PROFESOR,
  })
  @ApiQuery({
    name: 'facultadId',
    required: false,
    description: 'Filtrar usuarios por facultad específica (ID de la facultad)',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista paginada de usuarios obtenida exitosamente',
    type: UsuarioPaginatedResponseDto,
    examples: {
      searchResults: {
        summary: 'Búsqueda por palabra clave "juan"',
        value: {
          data: [
            {
              id: 1,
              nombres: 'Juan Carlos',
              apellidos: 'Pérez González',
              cedula: '1234567890',
              correo: 'juan.perez@epn.edu.ec',
              rol: 'PROFESOR',
              estadoActivo: true,
              facultadId: 1,
              facultad: {
                id: 1,
                nombre: 'Facultad de Ingeniería',
                codigo: 'FI'
              },
              createdAt: '2024-01-15T10:30:00.000Z',
              updatedAt: '2024-01-20T15:45:00.000Z'
            }
          ],
          meta: {
            currentPage: 1,
            pageSize: 10,
            totalItems: 1,
            totalPages: 1,
            hasPreviousPage: false,
            hasNextPage: false,
            searchTerm: 'juan'
          }
        }
      },
      paginatedResults: {
        summary: 'Listado paginado sin búsqueda (página 2)',
        value: {
          data: [
            {
              id: 11,
              nombres: 'María Elena',
              apellidos: 'García López',
              cedula: '0987654321',
              correo: 'maria.garcia@epn.edu.ec',
              rol: 'DECANO',
              estadoActivo: true,
              facultadId: 2,
              facultad: {
                id: 2,
                nombre: 'Facultad de Ciencias',
                codigo: 'FC'
              },
              createdAt: '2024-01-16T09:15:00.000Z',
              updatedAt: '2024-01-18T14:20:00.000Z'
            }
          ],
          meta: {
            currentPage: 2,
            pageSize: 10,
            totalItems: 25,
            totalPages: 3,
            hasPreviousPage: true,
            hasNextPage: true
          }
        }
      },
      emptyResults: {
        summary: 'Sin coincidencias para búsqueda',
        value: {
          data: [],
          meta: {
            currentPage: 1,
            pageSize: 10,
            totalItems: 0,
            totalPages: 0,
            hasPreviousPage: false,
            hasNextPage: false,
            searchTerm: 'usuarionoexiste'
          }
        }
      }
    }
  })
  @ApiUnauthorizedResponse({
    description: 'No autorizado - Token JWT inválido o usuario sin permisos de administrador',
    type: ErrorResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Parámetros de paginación inválidos',
    type: ErrorResponseDto,
    examples: {
      invalidPage: {
        summary: 'Número de página inválido',
        value: {
          statusCode: 400,
          message: ['La página debe ser mayor a 0'],
          error: 'Bad Request'
        }
      },
      invalidLimit: {
        summary: 'Límite fuera de rango',
        value: {
          statusCode: 400,
          message: ['El límite no puede ser mayor a 50'],
          error: 'Bad Request'
        }
      }
    }
  })
  findAllPaginated(@Query() searchDto: SearchPaginatedUsuarioDto): Promise<UsuarioPaginatedResponseDto> {
    return this.usuariosService.findAllPaginated(searchDto);
  }

  @Get('search')
  @UseGuards(RolesGuard)
  @Roles(RolEnum.ADMINISTRADOR)
  @ApiOperation({
    summary: 'Buscar usuarios para selección',
    description: 'Permite a los administradores buscar usuarios que puedan ser seleccionados como Decano, Subdecano o Jefe de Departamento para una nueva facultad. Busca por nombres, apellidos o correo electrónico y filtra por rol específico.',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Término de búsqueda para nombres, apellidos o correo electrónico',
    example: 'Carlos Rodriguez',
  })
  @ApiQuery({
    name: 'rol',
    required: false,
    description: 'Filtrar por rol específico (DECANO, SUBDECANO, JEFE_DEPARTAMENTO)',
    enum: RolEnum,
    example: RolEnum.DECANO,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de usuarios encontrados que coinciden con los criterios de búsqueda',
    type: [UsuarioSearchResponseDto],
    examples: {
      decanosSearch: {
        summary: 'Búsqueda de decanos (?rol=DECANO&search=Carlos)',
        value: [
          {
            id: 7,
            nombres: 'Carlos Eduardo',
            apellidos: 'Rodríguez Silva',
            correo: 'carlos.rodriguez@epn.edu.ec',
            rol: 'DECANO',
            estadoActivo: true,
            nombreCompleto: 'Carlos Eduardo Rodríguez Silva'
          }
        ]
      },
      allRoles: {
        summary: 'Búsqueda general (?search=María)',
        value: [
          {
            id: 8,
            nombres: 'María Elena',
            apellidos: 'García López',
            correo: 'maria.garcia@epn.edu.ec',
            rol: 'DECANO',
            estadoActivo: true,
            nombreCompleto: 'María Elena García López'
          }
        ]
      },
      emptyResult: {
        summary: 'Sin coincidencias (?search=NoExiste)',
        value: []
      }
    }
  })
  @ApiUnauthorizedResponse({
    description: 'No autorizado - Token inválido o usuario sin permisos de administrador',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: 'Unauthorized' },
        error: { type: 'string', example: 'Unauthorized' },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Parámetros de búsqueda inválidos',
    type: ErrorResponseDto,
  })
  async searchUsuarios(@Query() searchDto: SearchUsuarioDto): Promise<UsuarioSearchResponseDto[]> {
    const usuarios = await this.usuariosService.searchUsuarios(searchDto);
    
    return usuarios.map(usuario => ({
      id: usuario.id,
      nombres: usuario.nombres,
      apellidos: usuario.apellidos,
      correo: usuario.correo,
      rol: usuario.rol,
      estadoActivo: usuario.estadoActivo,
      nombreCompleto: `${usuario.nombres} ${usuario.apellidos}`,
    }));
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener usuario por ID',
    description: 'Obtiene un usuario específico por su ID',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del usuario',
    type: 'number',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Usuario encontrado',
    type: UsuarioModel,
  })
  @ApiNotFoundResponse({
    description: 'Usuario no encontrado',
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usuariosService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar usuario',
    description: 'Actualiza los datos de un usuario existente',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del usuario a actualizar',
    type: 'number',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Usuario actualizado exitosamente',
    type: UsuarioModel,
  })
  @ApiNotFoundResponse({
    description: 'Usuario no encontrado',
  })
  @ApiBadRequestResponse({
    description: 'Datos inválidos o correo/cédula ya registrados',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUsuarioDto: UpdateUsuarioDto,
  ) {
    return this.usuariosService.update(id, updateUsuarioDto);
  }

  @Get('debug/auth')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Debug - Verificar autenticación' })
  debugAuth(@GetUser() user: any) {
    return {
      message: 'Token válido',
      user: {
        id: user.id,
        nombres: user.nombres,
        apellidos: user.apellidos,
        rol: user.rol,
        estadoActivo: user.estadoActivo
      }
    };
  }

  @Put('me/password')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Cambiar contraseña personal (HU5115)',
    description: `
      Permite a cualquier usuario autenticado cambiar su propia contraseña de manera segura.
      
      **Características de seguridad:**
      - 🔐 **Verificación de identidad**: Requiere contraseña actual para confirmar identidad
      - 🛡️ **Políticas de seguridad**: Nueva contraseña debe cumplir requisitos de complejidad
      - 🔒 **Hashing seguro**: Contraseña almacenada con bcrypt y salt de 12 rounds
      - ✅ **Validación doble**: Confirmación de nueva contraseña para evitar errores
      - 🚫 **Prevención de reutilización**: La nueva contraseña debe ser diferente a la actual
      
      **Requisitos de la nueva contraseña:**
      - Mínimo 8 caracteres, máximo 50
      - Al menos una letra minúscula (a-z)
      - Al menos una letra mayúscula (A-Z) 
      - Al menos un número (0-9)
      - Al menos un carácter especial (@$!%*?&)
      
      **Casos de uso:**
      - Cambio periódico de contraseña por seguridad
      - Sospecha de compromiso de la cuenta
      - Actualización por políticas de seguridad institucional
    `
  })
  @ApiResponse({
    status: 200,
    description: 'Contraseña actualizada exitosamente',
    schema: {
      example: {
        message: 'Contraseña actualizada exitosamente'
      }
    }
  })
  @ApiBadRequestResponse({
    description: 'Errores de validación o contraseña actual incorrecta',
    type: ErrorResponseDto,
    examples: {
      incorrectCurrentPassword: {
        summary: 'Contraseña actual incorrecta',
        value: {
          statusCode: 400,
          message: 'La contraseña actual es incorrecta',
          error: 'Bad Request'
        }
      },
      passwordMismatch: {
        summary: 'Contraseñas no coinciden',
        value: {
          statusCode: 400,
          message: 'La nueva contraseña y la confirmación no coinciden',
          error: 'Bad Request'
        }
      },
      samePassword: {
        summary: 'Nueva contraseña igual a la actual',
        value: {
          statusCode: 400,
          message: 'La nueva contraseña debe ser diferente a la actual',
          error: 'Bad Request'
        }
      },
      weakPassword: {
        summary: 'Contraseña no cumple políticas de seguridad',
        value: {
          statusCode: 400,
          message: [
            'La nueva contraseña debe tener al menos 8 caracteres',
            'La nueva contraseña debe contener al menos: una letra minúscula, una mayúscula, un número y un carácter especial (@$!%*?&)'
          ],
          error: 'Bad Request'
        }
      },
      inactiveUser: {
        summary: 'Usuario inactivo',
        value: {
          statusCode: 400,
          message: 'No se puede cambiar la contraseña de un usuario inactivo',
          error: 'Bad Request'
        }
      }
    }
  })
  @ApiUnauthorizedResponse({
    description: 'No autorizado - Token JWT inválido',
    type: ErrorResponseDto,
    examples: {
      unauthorized: {
        summary: 'Token inválido',
        value: {
          statusCode: 401,
          message: 'Unauthorized',
          error: 'Unauthorized'
        }
      }
    }
  })
  changePassword(
    @GetUser() user: any,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    return this.usuariosService.changePassword(user.id, changePasswordDto);
  }

  @Get('me/profile')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Obtener perfil personal (HU5116)',
    description: `
      Permite a cualquier usuario autenticado visualizar su propio perfil personal.
      
      **Características de seguridad:**
      - 🔐 **Privacidad garantizada**: Solo retorna datos del usuario autenticado
      - 🛡️ **Sin datos sensibles**: No incluye contraseña ni información confidencial
      - ✅ **Verificación de identidad**: Requiere token JWT válido
      - 🚫 **Sin acceso cruzado**: Imposible acceder a datos de otros usuarios
      
      **Información incluida en el perfil:**
      - Datos personales básicos (nombres, apellidos, cédula, correo)
      - Rol asignado en el sistema
      - Estado de la cuenta (activo/inactivo)
      - Información de la facultad asociada (si aplica)
      - Fechas de creación y última actualización
      
      **Casos de uso:**
      - Revisar información personal actual
      - Verificar datos antes de realizar cambios
      - Consultar rol y permisos asignados
      - Verificar facultad de pertenencia
      - Auditoría personal de datos
    `
  })
  @ApiResponse({
    status: 200,
    description: 'Perfil personal obtenido exitosamente',
    type: UserProfileDto,
    examples: {
      profesor: {
        summary: 'Perfil de un profesor',
        value: {
          id: 5,
          nombres: 'Carlos Eduardo',
          apellidos: 'Rodríguez Silva',
          cedula: '1234567890',
          correo: 'carlos.rodriguez@epn.edu.ec',
          foto: 'https://example.com/photos/carlos-rodriguez.jpg',
          rol: 'PROFESOR',
          estadoActivo: true,
          facultad: {
            id: 1,
            nombre: 'Facultad de Ingeniería de Sistemas',
            codigo: 'FIS'
          },
          createdAt: '2024-01-15T10:30:00.000Z',
          updatedAt: '2024-01-20T15:45:00.000Z'
        }
      },
      administrador: {
        summary: 'Perfil de un administrador',
        value: {
          id: 1,
          nombres: 'María Elena',
          apellidos: 'García López',
          cedula: '0987654321',
          correo: 'maria.garcia@epn.edu.ec',
          rol: 'ADMINISTRADOR',
          estadoActivo: true,
          createdAt: '2024-01-10T08:00:00.000Z',
          updatedAt: '2024-01-18T14:20:00.000Z'
        }
      },
      decano: {
        summary: 'Perfil de un decano',
        value: {
          id: 3,
          nombres: 'José Antonio',
          apellidos: 'Martínez Herrera',
          cedula: '1122334455',
          correo: 'jose.martinez@epn.edu.ec',
          rol: 'DECANO',
          estadoActivo: true,
          facultad: {
            id: 2,
            nombre: 'Facultad de Ciencias Exactas',
            codigo: 'FCE'
          },
          createdAt: '2024-01-12T09:15:00.000Z',
          updatedAt: '2024-01-19T16:30:00.000Z'
        }
      }
    }
  })
  @ApiNotFoundResponse({
    description: 'Usuario no encontrado o perfil no disponible',
    type: ErrorResponseDto,
    examples: {
      userNotFound: {
        summary: 'Usuario no existe',
        value: {
          statusCode: 404,
          message: 'Usuario con ID 999 no encontrado',
          error: 'Not Found'
        }
      },
      inactiveUser: {
        summary: 'Usuario inactivo',
        value: {
          statusCode: 400,
          message: 'Perfil no disponible para usuario inactivo',
          error: 'Bad Request'
        }
      }
    }
  })
  @ApiUnauthorizedResponse({
    description: 'No autorizado - Token JWT inválido o expirado',
    type: ErrorResponseDto,
    examples: {
      unauthorized: {
        summary: 'Token inválido',
        value: {
          statusCode: 401,
          message: 'Unauthorized',
          error: 'Unauthorized'
        }
      },
      tokenExpired: {
        summary: 'Token expirado',
        value: {
          statusCode: 401,
          message: 'Token no válido o usuario inactivo',
          error: 'Unauthorized'
        }
      }
    }
  })
  getProfile(@GetUser() user: any): Promise<UserProfileDto> {
    // Pasar tanto el ID del usuario como el rol activo del JWT
    return this.usuariosService.getProfile(user.id, user.rol);
  }

  @Get('me/roles-permissions')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Obtener roles y permisos del usuario (HU5113)',
    description: `
      Permite a cualquier usuario autenticado visualizar todos sus roles asignados y los permisos correspondientes.
      
      **Nueva arquitectura multi-rol:**
      - 🔄 **Sistema multi-rol**: Un usuario puede tener múltiples roles simultáneamente
      - 🎯 **Compatibilidad**: Mantiene el concepto de "rol principal" para retrocompatibilidad
      - 🔐 **Permisos consolidados**: Unifica todos los permisos de todos los roles activos
      - 📊 **Análisis de capacidades**: Proporciona un resumen de lo que el usuario puede hacer
      
      **Información incluida:**
      - Lista completa de roles activos con descripciones y permisos
      - Permisos consolidados únicos de todos los roles
      - Nivel máximo de autoridad entre todos los roles
      - Análisis de capacidades del usuario
      - Información de facultad asociada
      - Rol principal para compatibilidad con versión anterior
      
      **Casos de uso:**
      - Verificar permisos antes de realizar acciones
      - Auditoría de roles y permisos asignados
      - Troubleshooting de accesos
      - Verificación de autoridad para funciones específicas
      - Análisis de capacidades del usuario
    `
  })
  @ApiResponse({
    status: 200,
    description: 'Roles y permisos obtenidos exitosamente',
    type: UserRolesPermissionsDto,
    examples: {
      usuarioMultiRol: {
        summary: 'Usuario con múltiples roles (Profesor + Coordinador)',
        value: {
          usuarioId: 5,
          nombreCompleto: 'Carlos Eduardo Rodríguez Silva',
          rolPrincipal: 'PROFESOR',
          roles: [
            {
              rol: 'PROFESOR',
              descripcion: 'Profesor universitario con acceso a funciones académicas básicas',
              activo: true,
              permisos: ['view_profile', 'update_profile', 'view_courses', 'submit_reports'],
              nivelAutoridad: 4,
              esPrincipal: true,
              fechaAsignacion: '2024-01-15T10:30:00.000Z'
            },
            {
              rol: 'COORDINADOR',
              descripcion: 'Coordinador de carrera con gestión específica de una carrera',
              activo: true,
              permisos: ['manage_career_courses', 'view_career_students', 'generate_career_reports'],
              nivelAutoridad: 5,
              esPrincipal: false,
              fechaAsignacion: '2024-02-01T14:00:00.000Z'
            }
          ],
          permisosConsolidados: [
            'view_profile', 'update_profile', 'view_courses', 'submit_reports',
            'manage_career_courses', 'view_career_students', 'generate_career_reports'
          ],
          nivelMaximoAutoridad: 5,
          facultad: {
            id: 1,
            nombre: 'Facultad de Ingeniería de Sistemas',
            codigo: 'FIS'
          },
          capacidades: {
            puedeGestionarUsuarios: false,
            puedeCrearCarreras: true,
            puedeVerDashboard: true,
            puedeGenerarReportes: true,
            esAdministrador: false,
            esDecano: false,
            esCoordinador: true
          }
        }
      },
      administrador: {
        summary: 'Usuario administrador (rol único)',
        value: {
          usuarioId: 1,
          nombreCompleto: 'María Elena García López',
          rolPrincipal: 'ADMINISTRADOR',
          roles: [
            {
              rol: 'ADMINISTRADOR',
              descripcion: 'Administrador del sistema con acceso completo a todas las funcionalidades',
              activo: true,
              permisos: [
                'manage_users', 'create_users', 'update_users', 'delete_users',
                'manage_faculties', 'create_faculties', 'update_faculties',
                'manage_careers', 'create_careers', 'update_careers',
                'view_all_dashboards', 'generate_all_reports', 'manage_system_settings'
              ],
              nivelAutoridad: 10,
              esPrincipal: true,
              fechaAsignacion: '2024-01-10T08:00:00.000Z'
            }
          ],
          permisosConsolidados: [
            'manage_users', 'create_users', 'update_users', 'delete_users',
            'manage_faculties', 'create_faculties', 'update_faculties',
            'manage_careers', 'create_careers', 'update_careers',
            'view_all_dashboards', 'generate_all_reports', 'manage_system_settings'
          ],
          nivelMaximoAutoridad: 10,
          capacidades: {
            puedeGestionarUsuarios: true,
            puedeCrearCarreras: true,
            puedeVerDashboard: true,
            puedeGenerarReportes: true,
            esAdministrador: true,
            esDecano: false,
            esCoordinador: false
          }
        }
      }
    }
  })
  @ApiUnauthorizedResponse({
    description: 'Token no válido o usuario inactivo',
    type: ErrorResponseDto,
    example: {
      statusCode: 401,
      timestamp: '2024-12-08T21:30:00.000Z',
      path: '/usuarios/me/roles-permissions',
      message: 'Token no válido o usuario inactivo',
      error: 'Unauthorized'
    }
  })
  @ApiNotFoundResponse({
    description: 'Usuario no encontrado',
    type: ErrorResponseDto,
    example: {
      statusCode: 404,
      timestamp: '2024-12-08T21:30:00.000Z',
      path: '/usuarios/me/roles-permissions',
      message: 'Usuario con ID 999 no encontrado',
      error: 'Not Found'
    }
  })
  @ApiBadRequestResponse({
    description: 'Usuario inactivo',
    type: ErrorResponseDto,
    example: {
      statusCode: 400,
      timestamp: '2024-12-08T21:30:00.000Z',
      path: '/usuarios/me/roles-permissions',
      message: 'No se pueden obtener roles y permisos de un usuario inactivo',
      error: 'Bad Request'
    }
  })
  getUserRolesAndPermissions(@GetUser() user: any): Promise<UserRolesPermissionsDto> {
    return this.usuariosService.getUserRolesAndPermissions(user.id);
  }

  @Put(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RolEnum.ADMINISTRADOR)
  @ApiOperation({
    summary: 'Cambiar estado de usuario (HU5095)',
    description: 'Permite al administrador cambiar el estado de un usuario específico (activar o desactivar). Este endpoint es fundamental para la gestión del acceso y permisos de los usuarios en el sistema. Solo accesible para usuarios con rol de Administrador.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del usuario cuyo estado se desea cambiar',
    type: 'number',
    example: 5,
  })
  @ApiResponse({
    status: 200,
    description: 'Estado del usuario actualizado exitosamente',
    type: UsuarioModel,
    examples: {
      activated: {
        summary: 'Usuario activado',
        value: {
          id: 5,
          nombres: 'Carlos Eduardo',
          apellidos: 'Rodríguez Silva',
          cedula: '1234567890',
          correo: 'carlos.rodriguez@epn.edu.ec',
          rol: 'PROFESOR',
          estadoActivo: true,
          facultadId: 2,
          createdAt: '2024-01-15T10:30:00.000Z',
          updatedAt: '2024-01-20T15:45:00.000Z'
        }
      },
      deactivated: {
        summary: 'Usuario desactivado', 
        value: {
          id: 5,
          nombres: 'Carlos Eduardo',
          apellidos: 'Rodríguez Silva',
          cedula: '1234567890',
          correo: 'carlos.rodriguez@epn.edu.ec',
          rol: 'PROFESOR',
          estadoActivo: false,
          facultadId: 2,
          createdAt: '2024-01-15T10:30:00.000Z',
          updatedAt: '2024-01-20T15:45:00.000Z'
        }
      }
    }
  })
  @ApiNotFoundResponse({
    description: 'Usuario no encontrado con el ID especificado',
    type: ErrorResponseDto,
    examples: {
      userNotFound: {
        summary: 'Usuario no existe',
        value: {
          statusCode: 404,
          message: 'Usuario con ID 999 no encontrado',
          error: 'Not Found'
        }
      }
    }
  })
  @ApiBadRequestResponse({
    description: 'Datos de entrada inválidos - el estado debe ser un valor booleano',
    type: ErrorResponseDto,
    examples: {
      invalidStatus: {
        summary: 'Estado inválido',
        value: {
          statusCode: 400,
          message: ['El estado activo debe ser un valor booleano'],
          error: 'Bad Request'
        }
      },
      missingStatus: {
        summary: 'Estado requerido',
        value: {
          statusCode: 400,
          message: ['El estado activo es obligatorio'],
          error: 'Bad Request'
        }
      }
    }
  })
  @ApiUnauthorizedResponse({
    description: 'No autorizado - Token JWT inválido o usuario sin permisos de administrador',
    type: ErrorResponseDto,
    examples: {
      unauthorized: {
        summary: 'Sin permisos',
        value: {
          statusCode: 401,
          message: 'Unauthorized',
          error: 'Unauthorized'
        }
      },
      forbidden: {
        summary: 'Acceso denegado',
        value: {
          statusCode: 403,
          message: 'Forbidden resource',
          error: 'Forbidden'
        }
      }
    }
  })
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateStatusDto: UpdateStatusUsuarioDto,
  ): Promise<UsuarioModel> {
    return this.usuariosService.updateStatus(id, updateStatusDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Desactivar usuario',
    description: 'Desactiva un usuario (soft delete)',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del usuario a desactivar',
    type: 'number',
    example: 1,
  })
  @ApiNoContentResponse({
    description: 'Usuario desactivado exitosamente',
  })
  @ApiNotFoundResponse({
    description: 'Usuario no encontrado',
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.usuariosService.remove(id);
  }

  @Patch(':id/restore')
  @ApiOperation({
    summary: 'Restaurar usuario',
    description: 'Reactiva un usuario previamente desactivado',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del usuario a restaurar',
    type: 'number',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Usuario restaurado exitosamente',
    type: UsuarioModel,
  })
  @ApiNotFoundResponse({
    description: 'Usuario no encontrado',
  })
  restore(@Param('id', ParseIntPipe) id: number) {
    return this.usuariosService.restore(id);
  }
}