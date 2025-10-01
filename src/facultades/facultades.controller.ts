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
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { FacultadesService } from './facultades.service';
import { CreateFacultadDto } from './dto/create-facultad.dto';
import { UpdateFacultadDto } from './dto/update-facultad.dto';
import { FilterFacultadDto } from './dto/filter-facultad.dto';
import { FacultadListResponseDto } from './dto/facultad-list-response.dto';
import { PaginatedFacultadResponseDto } from './dto/paginated-facultad-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { RolEnum } from '../common/enums/rol.enum';
import { UsuarioModel } from '../usuarios/models/usuario.model';
import { ErrorResponseDto } from '../common/dto/error-response.dto';

@ApiTags('Facultades')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard)
@Controller('facultades')
export class FacultadesController {
  constructor(private readonly facultadesService: FacultadesService) { }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(RolEnum.ADMINISTRADOR)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar nueva facultad',
    description: 'Permite a los administradores registrar una nueva facultad en el sistema especificando código, nombre y descripción. La facultad se crea sin decano asignado inicialmente - el decano se asignará posteriormente al editar la facultad. Valida que el código y nombre sean únicos para evitar duplicados.',
  })
  @ApiCreatedResponse({
    description: 'Facultad registrada exitosamente',
    type: CreateFacultadDto,
    schema: {
      example: {
        id: 13,
        codigo: 'FNEW',
        nombre: 'Facultad de Nuevas Tecnologías',
        descripcion: 'Facultad especializada en tecnologías emergentes e innovación digital',
        estadoActivo: true,
        createdAt: '2024-10-01T10:30:00.000Z',
        updatedAt: '2024-10-01T10:30:00.000Z'
      }
    }
  })
  @ApiBadRequestResponse({
    description: 'Datos inválidos, código duplicado o nombre duplicado',
    type: ErrorResponseDto,
    schema: {
      examples: {
        codigoDuplicado: {
          summary: 'Código de facultad duplicado',
          value: {
            statusCode: 400,
            message: 'Ya existe una facultad con este código',
            error: 'Bad Request'
          }
        },
        nombreDuplicado: {
          summary: 'Nombre de facultad duplicado',
          value: {
            statusCode: 400,
            message: 'Ya existe una facultad con este nombre',
            error: 'Bad Request'
          }
        },
        datosInvalidos: {
          summary: 'Datos de entrada inválidos',
          value: {
            statusCode: 400,
            message: ['codigo must be shorter than or equal to 20 characters'],
            error: 'Bad Request'
          }
        }
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
  @ApiConflictResponse({
    description: 'Conflicto - Código ya registrado en la base de datos',
    type: ErrorResponseDto,
  })
  create(@Body() createFacultadDto: CreateFacultadDto) {
    return this.facultadesService.create(createFacultadDto);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(RolEnum.ADMINISTRADOR)
  @ApiOperation({
    summary: 'Listar facultades con filtros avanzados y paginación',
    description: 'Obtiene la lista paginada de facultades registradas en el sistema con filtros avanzados: estado activo, búsqueda por código/nombre, y filtro por número de carreras. Incluye información completa como código, nombre, número de carreras y decano. Solo accesible para usuarios con rol de Administrador.',
  })
  @ApiQuery({
    name: 'estadoActivo',
    required: false,
    type: Boolean,
    description: 'Filtrar facultades por estado activo/inactivo',
    example: true,
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Buscar facultades por código o nombre (búsqueda parcial insensible a mayúsculas)',
    example: 'FIEC',
  })
  @ApiQuery({
    name: 'numeroCarrerasMin',
    required: false,
    type: Number,
    description: 'Filtrar facultades que tengan al menos este número de carreras',
    example: 3,
  })
  @ApiQuery({
    name: 'numeroCarrerasMax',
    required: false,
    type: Number,
    description: 'Filtrar facultades que tengan como máximo este número de carreras',
    example: 10,
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Número de página (empezando desde 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Número de elementos por página (máximo 100)',
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista paginada de facultades obtenida exitosamente con filtros aplicados. Incluye metadatos de paginación y información completa de cada facultad.',
    type: PaginatedFacultadResponseDto,
    examples: {
      paginatedResult: {
        summary: 'Resultado paginado con filtros (?page=1&limit=2&search=FIEC)',
        value: {
          data: [
            {
              id: 1,
              codigo: 'FIEC',
              nombre: 'Facultad de Ingeniería Eléctrica y Computación',
              descripcion: 'Facultad especializada en ingeniería eléctrica, electrónica y computación',
              numeroCarreras: 5,
              decano: {
                id: 3,
                nombres: 'Carlos Eduardo',
                apellidos: 'Rodríguez Silva',
                correo: 'carlos.rodriguez@epn.edu.ec'
              },
              estadoActivo: true,
              createdAt: '2024-01-15T10:30:00.000Z',
              updatedAt: '2024-01-20T15:45:00.000Z'
            }
          ],
          total: 1,
          page: 1,
          limit: 2,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
          meta: {
            startIndex: 1,
            endIndex: 1,
            hasData: true
          }
        }
      },
      carrerasFilter: {
        summary: 'Filtro por número de carreras (?numeroCarrerasMin=3&numeroCarrerasMax=5)',
        value: {
          data: [
            {
              id: 1,
              codigo: 'FIEC',
              nombre: 'Facultad de Ingeniería Eléctrica y Computación',
              descripcion: 'Facultad especializada en ingeniería eléctrica, electrónica y computación',
              numeroCarreras: 5,
              decano: null,
              estadoActivo: true,
              createdAt: '2024-01-15T10:30:00.000Z',
              updatedAt: '2024-01-20T15:45:00.000Z'
            }
          ],
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
          meta: {
            startIndex: 1,
            endIndex: 1,
            hasData: true
          }
        }
      },
      emptyResult: {
        summary: 'Sin coincidencias (?search=NoExiste)',
        value: {
          data: [],
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
          meta: {
            startIndex: 0,
            endIndex: 0,
            hasData: false
          }
        }
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
  @ApiForbiddenResponse({
    description: 'Acceso denegado - Solo administradores pueden listar facultades',
    type: ErrorResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Filtros de búsqueda o parámetros de paginación inválidos',
    type: ErrorResponseDto,
  })
  findAll(@Query() filterDto: FilterFacultadDto): Promise<PaginatedFacultadResponseDto> {
    return this.facultadesService.findAllForAdminPaginated(filterDto);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener facultad por ID',
    description: 'Obtener una facultad específica por su ID',
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'ID único de la facultad',
  })
  @ApiResponse({
    status: 200,
    description: 'Facultad encontrada exitosamente',
    type: CreateFacultadDto,
  })
  @ApiNotFoundResponse({
    description: 'Facultad no encontrada',
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Token de autenticación inválido',
    type: ErrorResponseDto,
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.facultadesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(RolEnum.DGIP, RolEnum.DECANO, RolEnum.SUBDECANO)
  @ApiOperation({
    summary: 'Actualizar facultad',
    description: 'Actualizar información de una facultad existente. Solo usuarios con roles administrativos pueden actualizar facultades.',
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'ID único de la facultad a actualizar',
  })
  @ApiResponse({
    status: 200,
    description: 'Facultad actualizada exitosamente',
    type: CreateFacultadDto,
  })
  @ApiBadRequestResponse({
    description: 'Datos de entrada inválidos o facultad duplicada',
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Facultad no encontrada',
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Token de autenticación inválido',
    type: ErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'No tiene permisos para realizar esta acción',
    type: ErrorResponseDto,
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateFacultadDto: UpdateFacultadDto,
    @GetUser() user: UsuarioModel,
  ) {
    return this.facultadesService.update(id, updateFacultadDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(RolEnum.DGIP)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Desactivar facultad',
    description: 'Desactivar una facultad (soft delete). Solo el DGIP puede desactivar facultades.',
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'ID único de la facultad a desactivar',
  })
  @ApiResponse({
    status: 204,
    description: 'Facultad desactivada exitosamente',
  })
  @ApiNotFoundResponse({
    description: 'Facultad no encontrada',
    type: ErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'No se puede eliminar la facultad porque tiene carreras asociadas',
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Token de autenticación inválido',
    type: ErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'No tiene permisos para realizar esta acción',
    type: ErrorResponseDto,
  })
  remove(@Param('id', ParseIntPipe) id: number, @GetUser() user: UsuarioModel) {
    return this.facultadesService.remove(id);
  }

  @Patch(':id/restore')
  @UseGuards(RolesGuard)
  @Roles(RolEnum.DGIP)
  @ApiOperation({
    summary: 'Reactivar facultad',
    description: 'Reactivar una facultad previamente desactivada. Solo el DGIP puede reactivar facultades.',
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'ID único de la facultad a reactivar',
  })
  @ApiResponse({
    status: 200,
    description: 'Facultad reactivada exitosamente',
    type: CreateFacultadDto,
  })
  @ApiNotFoundResponse({
    description: 'Facultad no encontrada',
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Token de autenticación inválido',
    type: ErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'No tiene permisos para realizar esta acción',
    type: ErrorResponseDto,
  })
  restore(@Param('id', ParseIntPipe) id: number, @GetUser() user: UsuarioModel) {
    return this.facultadesService.restore(id);
  }
}