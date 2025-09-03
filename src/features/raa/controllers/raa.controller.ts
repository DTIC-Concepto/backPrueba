import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  HttpStatus,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { RaaService } from '../services/raa.service';
import { CreateRaaDto, UpdateRaaDto, FilterRaaDto } from '../dtos/raa.dto';
import { DeleteRaaDto, DeleteRaaResponseDto } from '../dtos/delete-raa.dto';
import { UpdateRaaRequestDto, UpdateRaaResponseDto } from '../dtos/update-raa.dto';
import { CreateRaaRequestDto } from '../dtos/create-raa-request.dto';
import { CreateRaaResponseDto } from '../dtos/create-raa-response.dto';
import { ListarRaasQueryDto, ListarRaasResponseDto } from '../dtos/listar-raas.dto';
import { RaaModel } from '../models/raa.model';

@ApiTags('RAA - Resultados de Aprendizaje de Asignatura')
@Controller('raa')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class RaaController {
  constructor(private readonly raaService: RaaService) {}

  /**
   * Eliminar un RAA específico por ID
   */
  @Delete(':id')
  @ApiOperation({ 
    summary: 'Eliminar RAA',
    description: 'Elimina un Resultado de Aprendizaje de Asignatura (RAA) específico. Soporta eliminación suave (soft delete) y eliminación física según los parámetros enviados.'
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'ID único del RAA a eliminar',
    example: 1,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'RAA eliminado exitosamente',
    type: DeleteRaaResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'RAA no encontrado',
    schema: {
      example: {
        statusCode: 404,
        message: 'RAA con ID 1 no encontrado',
        error: 'Not Found',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Parámetros inválidos o RAA ya eliminado',
    schema: {
      example: {
        statusCode: 400,
        message: 'El RAA con ID 1 ya ha sido eliminado anteriormente',
        error: 'Bad Request',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Error de conflicto durante la eliminación',
    schema: {
      example: {
        statusCode: 409,
        message: 'Error al eliminar el RAA: conflicto de integridad',
        error: 'Conflict',
      },
    },
  })
  async eliminarRaa(
    @Param('id', ParseIntPipe) id: number,
    @Body() deleteOptions: Partial<DeleteRaaDto> = {},
  ): Promise<DeleteRaaResponseDto> {
    const deleteRaaDto: DeleteRaaDto = {
      id,
      confirmarEliminacion: deleteOptions.confirmarEliminacion ?? false,
      forzarEliminacion: deleteOptions.forzarEliminacion ?? false,
    };

    return await this.raaService.eliminarRaa(deleteRaaDto);
  }

  /**
   * Obtener un RAA por ID
   */
  @Get(':id')
  @ApiOperation({ 
    summary: 'Obtener RAA por ID',
    description: 'Obtiene un Resultado de Aprendizaje de Asignatura específico por su ID.'
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'ID único del RAA',
    example: 1,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'RAA encontrado exitosamente',
    type: RaaModel,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'RAA no encontrado',
  })
  async obtenerPorId(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<RaaModel> {
    return await this.raaService.buscarPorId(id);
  }

  /**
   * Listar RAAs con filtros opcionales
   */
  @Get()
  @ApiOperation({ 
    summary: 'Listar RAAs',
    description: 'Obtiene una lista de RAAs con filtros opcionales.'
  })
  @ApiQuery({
    name: 'codigo',
    required: false,
    type: 'string',
    description: 'Filtrar por código del RAA',
    example: 'RAA-001',
  })
  @ApiQuery({
    name: 'asignaturaId',
    required: false,
    type: 'number',
    description: 'Filtrar por ID de asignatura',
    example: 1,
  })
  @ApiQuery({
    name: 'tipoRaaId',
    required: false,
    type: 'number',
    description: 'Filtrar por ID de tipo de RAA',
    example: 1,
  })
  @ApiQuery({
    name: 'estadoActivo',
    required: false,
    type: 'boolean',
    description: 'Filtrar por estado activo',
    example: true,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de RAAs obtenida exitosamente',
    type: [RaaModel],
  })
  async listar(
    @Query() filterRaaDto: FilterRaaDto,
  ): Promise<RaaModel[]> {
    return await this.raaService.listar(filterRaaDto);
  }

  /**
   * Listar RAAs con funcionalidades avanzadas (paginación, filtros, búsqueda)
   */
  @Get('avanzado')
  @ApiOperation({ 
    summary: 'Listar RAAs con funcionalidades avanzadas',
    description: 'Obtiene una lista paginada de RAAs con funcionalidades avanzadas de filtrado, búsqueda, ordenamiento y metadatos detallados. Ideal para interfaces administrativas y reportes detallados.'
  })
  @ApiQuery({
    name: 'pagina',
    required: false,
    type: 'number',
    description: 'Número de página (iniciando en 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limite',
    required: false,
    type: 'number',
    description: 'Cantidad de elementos por página (máximo 100)',
    example: 10,
  })
  @ApiQuery({
    name: 'ordenarPor',
    required: false,
    type: 'string',
    description: 'Campo por el cual ordenar los resultados',
    example: 'creadoEn',
    enum: ['codigo', 'nombre', 'descripcion', 'creadoEn', 'actualizadoEn', 'nivel']
  })
  @ApiQuery({
    name: 'direccion',
    required: false,
    type: 'string',
    description: 'Dirección del ordenamiento',
    example: 'DESC',
    enum: ['ASC', 'DESC']
  })
  @ApiQuery({
    name: 'codigo',
    required: false,
    type: 'string',
    description: 'Filtrar por código del RAA (búsqueda parcial)',
    example: 'RAA-001',
  })
  @ApiQuery({
    name: 'busqueda',
    required: false,
    type: 'string',
    description: 'Búsqueda general en nombre, descripción y código',
    example: 'algoritmos',
  })
  @ApiQuery({
    name: 'asignaturaId',
    required: false,
    type: 'number',
    description: 'Filtrar por ID de asignatura',
    example: 1,
  })
  @ApiQuery({
    name: 'tipoRaaId',
    required: false,
    type: 'number',
    description: 'Filtrar por ID de tipo de RAA',
    example: 1,
  })
  @ApiQuery({
    name: 'estadoActivo',
    required: false,
    type: 'boolean',
    description: 'Filtrar por estado activo',
    example: true,
  })
  @ApiQuery({
    name: 'nivel',
    required: false,
    type: 'string',
    description: 'Filtrar por nivel del RAA',
    example: 'INTERMEDIO',
  })
  @ApiQuery({
    name: 'fechaCreacionDesde',
    required: false,
    type: 'string',
    description: 'Filtrar RAAs creados desde esta fecha (ISO 8601)',
    example: '2024-01-01T00:00:00.000Z',
  })
  @ApiQuery({
    name: 'fechaCreacionHasta',
    required: false,
    type: 'string',
    description: 'Filtrar RAAs creados hasta esta fecha (ISO 8601)',
    example: '2024-12-31T23:59:59.999Z',
  })
  @ApiQuery({
    name: 'incluirEliminados',
    required: false,
    type: 'boolean',
    description: 'Incluir RAAs eliminados (soft delete) en los resultados',
    example: false,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista paginada de RAAs obtenida exitosamente con metadatos completos',
    type: ListarRaasResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Parámetros de consulta inválidos',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Error interno del servidor',
  })
  async listarAvanzado(
    @Query() queryDto: ListarRaasQueryDto,
  ): Promise<ListarRaasResponseDto> {
    return await this.raaService.listarRaasAvanzado(queryDto);
  }

  /**
   * Registrar un nuevo RAA con funcionalidades avanzadas
   */
  @Post()
  @ApiOperation({ 
    summary: 'Crear RAA',
    description: 'Crea un nuevo Resultado de Aprendizaje de Asignatura con funcionalidades avanzadas como generación automática de códigos, validaciones extendidas y respuesta detallada.'
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'RAA creado exitosamente',
    type: CreateRaaResponseDto,
    schema: {
      example: {
        exitoso: true,
        mensaje: 'RAA registrado exitosamente',
        raa: {
          id: 1,
          codigo: 'RAA-001-001',
          descripcion: 'El estudiante será capaz de aplicar principios fundamentales...',
          asignaturaId: 1,
          tipoRaaId: 1,
          estadoActivo: true,
          creadoEn: '2025-09-02T00:00:00.000Z',
          actualizadoEn: '2025-09-02T00:00:00.000Z'
        },
        detalles: {
          codigoGenerado: true,
          relacionesCreadas: ['asignatura', 'tipoRaa']
        }
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Datos de entrada inválidos',
    schema: {
      example: {
        exitoso: false,
        mensaje: 'Error al registrar el RAA',
        codigoEstado: 400,
        erroresValidacion: [
          {
            campo: 'nombre',
            valor: '',
            errores: ['isNotEmpty'],
            mensaje: 'El nombre del RAA es obligatorio'
          }
        ]
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'RAA con código duplicado',
    schema: {
      example: {
        exitoso: false,
        mensaje: 'Ya existe un RAA con el código RAA-001-001',
        codigoEstado: 409,
        errorTecnico: 'Constraint violation: unique_codigo'
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Asignatura o Tipo RAA no encontrado',
    schema: {
      example: {
        exitoso: false,
        mensaje: 'Asignatura con ID 999 no encontrada',
        codigoEstado: 404
      }
    }
  })
  async crear(
    @Body() createRaaRequestDto: CreateRaaRequestDto,
  ): Promise<CreateRaaResponseDto> {
    return await this.raaService.registrarNuevoRaa(createRaaRequestDto);
  }

  /**
   * Actualizar un RAA existente con respuesta detallada
   */
  @Put(':id/detallado')
  @ApiOperation({ 
    summary: 'Actualizar RAA (con detalles)',
    description: 'Actualiza un Resultado de Aprendizaje de Asignatura existente y devuelve información detallada sobre los cambios realizados.'
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'ID único del RAA a actualizar',
    example: 1,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'RAA actualizado exitosamente con detalles',
    type: UpdateRaaResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'RAA no encontrado',
    schema: {
      example: {
        statusCode: 404,
        message: 'RAA con ID 1 no encontrado',
        error: 'Not Found',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Datos inválidos o sin cambios',
    schema: {
      example: {
        statusCode: 400,
        message: 'No se proporcionaron campos para actualizar',
        error: 'Bad Request',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'RAA con código duplicado',
    schema: {
      example: {
        statusCode: 409,
        message: 'Ya existe otro RAA con el código RAA-002',
        error: 'Conflict',
      },
    },
  })
  async actualizarDetallado(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRaaDto: UpdateRaaRequestDto,
  ): Promise<UpdateRaaResponseDto> {
    return await this.raaService.actualizarConDetalle(id, updateRaaDto);
  }

  /**
   * Actualizar un RAA existente (método simplificado)
   */
  @Put(':id')
  @ApiOperation({ 
    summary: 'Actualizar RAA',
    description: 'Actualiza un Resultado de Aprendizaje de Asignatura existente.'
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'ID único del RAA a actualizar',
    example: 1,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'RAA actualizado exitosamente',
    type: RaaModel,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'RAA no encontrado',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Datos inválidos',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'RAA con código duplicado',
  })
  async actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRaaDto: UpdateRaaDto,
  ): Promise<RaaModel> {
    return await this.raaService.actualizar(id, updateRaaDto);
  }
}
