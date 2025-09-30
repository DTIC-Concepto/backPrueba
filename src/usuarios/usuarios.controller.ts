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
import { UsuarioListResponseDto } from './dto/usuario-list-response.dto';
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
  @ApiOperation({
    summary: 'Crear usuario',
    description: 'Crea un nuevo usuario en el sistema',
  })
  @ApiCreatedResponse({
    description: 'Usuario creado exitosamente',
    type: UsuarioModel,
  })
  @ApiBadRequestResponse({
    description: 'Datos inválidos o correo/cédula ya registrados',
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