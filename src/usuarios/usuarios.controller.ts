import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
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
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { FilterUsuarioDto } from './dto/filter-usuario.dto';
import { SearchUsuarioDto } from './dto/search-usuario.dto';
import { UsuarioListResponseDto } from './dto/usuario-list-response.dto';
import { UsuarioSearchResponseDto } from './dto/usuario-search-response.dto';
import { UsuarioModel } from './models/usuario.model';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
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

  @Get()
  @UseGuards(RolesGuard)
  @Roles(RolEnum.ADMINISTRADOR)
  @ApiOperation({
    summary: 'Listar usuarios con filtros',
    description: 'Obtiene la lista de usuarios registrados en el sistema con filtros opcionales por rol, estado y búsqueda. Los administradores pueden filtrar por rol específico para gestionar permisos de manera eficiente. Solo accesible para usuarios con rol de Administrador.',
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