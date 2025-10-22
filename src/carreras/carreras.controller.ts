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
import { CarrerasService } from './carreras.service';
import { CreateCarreraDto } from './dto/create-carrera.dto';
import { UpdateCarreraDto } from './dto/update-carrera.dto';
import { FilterCarreraDto } from './dto/filter-carrera.dto';
import { CarreraListResponseDto } from './dto/carrera-list-response.dto';
import { CarreraPaginatedFilterDto } from './dto/carrera-paginated-filter.dto';
import { CarreraPaginatedResponseDto } from './dto/carrera-paginated-response.dto';
import { CarreraModel } from './models/carrera.model';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolEnum } from '../common/enums/rol.enum';
import { ErrorResponseDto } from '../common/dto/error-response.dto';

@ApiTags('Carreras')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard)
@Controller('carreras')
export class CarrerasController {
  constructor(private readonly carrerasService: CarrerasService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(RolEnum.ADMINISTRADOR)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar nueva carrera',
    description: 'Permite a los administradores registrar una nueva carrera en el sistema, asociándola a una facultad y un coordinador existentes. Valida que el código de la carrera sea único y que el coordinador tenga un rol apropiado.',
  })
  @ApiCreatedResponse({
    description: 'Carrera creada exitosamente',
    type: CarreraModel,
    schema: {
      example: {
        id: 1,
        codigo: 'ING-SIS',
        nombre: 'Ingeniería en Sistemas Informáticos y de Computación',
        facultadId: 1,
        coordinadorId: 2,
        estadoActivo: true,
        createdAt: '2024-01-15T10:30:00.000Z',
        updatedAt: '2024-01-15T10:30:00.000Z',
        facultad: {
          id: 1,
          codigo: 'FIEEC',
          nombre: 'Facultad de Ingeniería Eléctrica y Electrónica'
        },
        coordinador: {
          id: 2,
          nombres: 'María Elena',
          apellidos: 'García López',
          correo: 'maria.garcia@epn.edu.ec'
        }
      }
    }
  })
  @ApiBadRequestResponse({
    description: 'Datos inválidos, código duplicado, facultad no existe, o coordinador no válido',
    type: ErrorResponseDto,
    schema: {
      examples: {
        codigoDuplicado: {
          summary: 'Código de carrera duplicado',
          value: {
            statusCode: 400,
            message: 'Ya existe una carrera con el código ING-SIS',
            error: 'Bad Request'
          }
        },
        facultadNoExiste: {
          summary: 'Facultad no existe',
          value: {
            statusCode: 400,
            message: 'No existe la facultad con ID 99',
            error: 'Bad Request'
          }
        },
        coordinadorInvalido: {
          summary: 'Coordinador con rol inválido',
          value: {
            statusCode: 400,
            message: 'El usuario seleccionado no tiene un rol apropiado para ser coordinador de carrera. Roles válidos: COORDINADOR, JEFE_DEPARTAMENTO, SUBDECANO, DECANO, ADMINISTRADOR',
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
  create(@Body() createCarreraDto: CreateCarreraDto): Promise<CarreraModel> {
    return this.carrerasService.create(createCarreraDto);
  }

  @Get('debug')
  @UseGuards(RolesGuard)
  @Roles(RolEnum.ADMINISTRADOR)
  @ApiOperation({ summary: 'Debug - Ver datos raw de carreras' })
  async debugCarreras() {
    return this.carrerasService.debugCarreras();
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(RolEnum.ADMINISTRADOR, RolEnum.COORDINADOR, RolEnum.JEFE_DEPARTAMENTO, RolEnum.SUBDECANO, RolEnum.DECANO, RolEnum.CEI, RolEnum.DGIP)
  @ApiOperation({
    summary: 'Listar carreras con filtros avanzados y paginación (HU5104-5110)',
    description: 'Obtiene la lista paginada de carreras registradas en el sistema. Implementa HU5104 (listado básico), HU5105 (búsqueda por palabra clave), HU5106 (filtro por estado), HU5109 (paginación) y HU5110 (filtro por facultad). Solo accesible para usuarios con rol de Administrador.',
  })
  @ApiQuery({
    name: 'facultadId',
    required: false,
    description: 'HU5110: Filtrar carreras por ID de facultad específica',
    type: Number,
    example: 1,
  })
  @ApiQuery({
    name: 'estadoActivo',
    required: false,
    description: 'HU5106: Filtrar carreras por estado activo/inactivo',
    type: Boolean,
    example: true,
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'HU5105: Buscar carreras por código o nombre usando palabra clave',
    type: String,
    example: 'Ingeniería',
  })
  @ApiQuery({
    name: 'modalidad',
    required: false,
    description: 'Filtrar carreras por modalidad (PRESENCIAL/VIRTUAL)',
    enum: ['PRESENCIAL', 'VIRTUAL'],
    example: 'PRESENCIAL',
  })
  @ApiQuery({
    name: 'duracionMin',
    required: false,
    description: 'Filtrar por duración mínima en semestres',
    type: Number,
    example: 8,
  })
  @ApiQuery({
    name: 'duracionMax',
    required: false,
    description: 'Filtrar por duración máxima en semestres',
    type: Number,
    example: 12,
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'HU5109: Número de página (empezando desde 1)',
    type: Number,
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'HU5109: Número de elementos por página (máximo 50)',
    type: Number,
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista paginada de carreras obtenida exitosamente con todos los filtros aplicados',
    schema: {
      example: {
        data: [
          {
            id: 1,
            codigo: 'ING-SIS',
            nombre: 'Ingeniería en Sistemas Informáticos y de Computación',
            duracion: 10,
            modalidad: 'PRESENCIAL',
            estadoActivo: true,
            facultad: {
              id: 1,
              codigo: 'FIEEC',
              nombre: 'Facultad de Ingeniería Eléctrica y Electrónica'
            },
            coordinador: {
              id: 2,
              nombres: 'María Elena',
              apellidos: 'García López',
              correo: 'maria.garcia@epn.edu.ec',
              rol: 'COORDINADOR'
            },
            createdAt: '2024-01-15T10:30:00.000Z',
            updatedAt: '2024-01-20T15:45:00.000Z'
          }
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 25,
          totalPages: 3,
          hasNextPage: true,
          hasPrevPage: false
        },
        filters: {
          filters: {
            facultadId: 1,
            estadoActivo: true,
            search: 'Ingeniería',
            modalidad: 'PRESENCIAL'
          }
        }
      }
    }
  })
  @ApiBadRequestResponse({
    description: 'Parámetros de filtros o paginación inválidos',
    type: ErrorResponseDto,
    examples: {
      invalidPage: {
        summary: 'Página inválida',
        value: {
          statusCode: 400,
          message: 'El número de página debe ser mayor a 0',
          error: 'Bad Request',
        },
      },
      invalidLimit: {
        summary: 'Límite inválido',
        value: {
          statusCode: 400,
          message: 'El límite debe estar entre 1 y 50',
          error: 'Bad Request',
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'No autorizado - Token JWT requerido',
    type: ErrorResponseDto,
  })
  findAllPaginated(@Query() filterDto: CarreraPaginatedFilterDto): Promise<CarreraPaginatedResponseDto> {
    return this.carrerasService.findAllForAdminPaginated(filterDto);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener carrera por ID',
    description: 'Obtiene una carrera específica por su ID incluyendo información de facultad y coordinador',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la carrera',
    type: 'number',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Carrera encontrada',
    type: CarreraModel,
  })
  @ApiNotFoundResponse({
    description: 'Carrera no encontrada',
    type: ErrorResponseDto,
  })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<CarreraModel> {
    return this.carrerasService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(RolEnum.ADMINISTRADOR)
  @ApiOperation({
    summary: 'Actualizar carrera',
    description: 'Actualiza los datos de una carrera existente. Solo administradores pueden realizar esta acción.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la carrera a actualizar',
    type: 'number',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Carrera actualizada exitosamente',
    type: CarreraModel,
  })
  @ApiNotFoundResponse({
    description: 'Carrera no encontrada',
    type: ErrorResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Datos inválidos o código duplicado',
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'No autorizado - Usuario sin permisos de administrador',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCarreraDto: UpdateCarreraDto,
  ): Promise<CarreraModel> {
    return this.carrerasService.update(id, updateCarreraDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(RolEnum.ADMINISTRADOR)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Eliminar carrera',
    description: 'Elimina una carrera del sistema. Solo administradores pueden realizar esta acción.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la carrera a eliminar',
    type: 'number',
    example: 1,
  })
  @ApiNoContentResponse({
    description: 'Carrera eliminada exitosamente',
  })
  @ApiNotFoundResponse({
    description: 'Carrera no encontrada',
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'No autorizado - Usuario sin permisos de administrador',
  })
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.carrerasService.remove(id);
  }
}