import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { MappingsService } from './mappings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolEnum } from '../common/enums/rol.enum';
import {
  CreateBatchRaOppMappingsDto,
  FilterRaOppMappingsDto,
  BatchOperationResultDto,
} from './dto/create-ra-opp-mapping.dto';
import {
  CreateBatchRaEuraceMappingsDto,
  FilterRaEuraceMappingsDto,
  BatchRaEuraceOperationResultDto,
} from './dto/create-ra-eurace-mapping.dto';
import { CreateBatchRaaRaMappingsDto } from './dto/create-batch-raa-ra-mappings.dto';
import { CreateRaaRaMappingDto } from './dto/create-raa-ra-mapping.dto';
import { UpdateRaaRaMappingDto } from './dto/update-raa-ra-mapping.dto';
import { FilterRaaRaMappingsDto } from './dto/filter-raa-ra-mappings.dto';
import { BatchRaaRaOperationResultDto } from './dto/batch-raa-ra-operation-result.dto';
import { RaOppModel } from './models/ra-opp.model';
import { RaEuraceModel } from './models/ra-eurace.model';
import { ResultadoAprendizajeModel, TipoRA } from '../resultados-aprendizaje/models/resultado-aprendizaje.model';
import { OppModel } from '../opp/models/opp.model';
import { EurAceModel } from '../eur-ace/models/eur-ace.model';
import { 
  OppRaMatrixResponseDto, 
  RaEuraceMatrixResponseDto 
} from './dto/matrix-response.dto';

@ApiBearerAuth()
@Controller('mappings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RolEnum.COORDINADOR,RolEnum.ADMINISTRADOR, RolEnum.DECANO, RolEnum.JEFE_DEPARTAMENTO)
export class MappingsController {
  constructor(private readonly mappingsService: MappingsService) {}

  @ApiTags('Mappings OPP-RA')
  @Post('opp-ra/batch')
  @Roles(RolEnum.COORDINADOR, RolEnum.ADMINISTRADOR)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear múltiples relaciones OPP-RA en lote',
    description: `
    **HU7771**: Crear relaciones de mapeo entre Objetivos de Perfil Profesional (OPP) y Resultados de Aprendizaje (RA) mediante un asistente.
    
    **Validaciones implementadas**:
    - ✅ Verificar que el RA existe (Tarea 7840)
    - ✅ Verificar que el OPP existe (Tarea 7840)  
    - ✅ Verificar que pertenecen a la misma carrera (Tarea 7840)
    - ✅ Verificar que no existe relación duplicada (Tarea 7840)
    - ✅ Procesamiento en lote con transacciones (Tarea 7843)
    
    **Roles autorizados**: COORDINADOR, ADMINISTRADOR
    `,
  })
  @ApiResponse({
    status: 201,
    description: 'Operación batch completada',
    type: BatchOperationResultDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o errores de validación',
  })
  @ApiResponse({
    status: 403,
    description: 'Sin permisos para realizar esta operación',
  })
  async createBatchRaOppMappings(
    @Body() dto: CreateBatchRaOppMappingsDto,
  ): Promise<BatchOperationResultDto> {
    return this.mappingsService.createBatchRaOppMappings(dto);
  }

  @ApiTags('Mappings RA-EURACE')
  @Post('ra-eur-ace/batch')
  @Roles(RolEnum.COORDINADOR, RolEnum.ADMINISTRADOR)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear múltiples relaciones RA-EURACE en lote',
    description: `
    **HU7769**: Crear relaciones de mapeo entre Resultados de Aprendizaje (RA) y Criterios EUR-ACE mediante un asistente.
    
    **Flujo del asistente**:
    1. Seleccionar un criterio EUR-ACE específico
    2. Mostrar RAs disponibles para ese criterio (con filtros por tipo GENERAL/ESPECÍFICO)
    3. Crear múltiples relaciones con justificación
    
    **Validaciones implementadas**:
    - ✅ Verificar que el RA existe (Task 7869)
    - ✅ Verificar que el criterio EUR-ACE existe (Task 7869)
    - ✅ Verificar que no existe relación duplicada (Task 7869)
    - ✅ Validar justificación (10-1000 caracteres) (Task 7869)
    - ✅ Procesamiento en lote con transacciones (Task 7861)
    
    **Casos de uso**:
    - Mapeo inicial de competencias con estándares EUR-ACE
    - Actualización masiva de relaciones durante procesos de acreditación
    - Asignación de múltiples RAs a un criterio específico
    `,
  })
  @ApiResponse({
    status: 201,
    description: 'Operación batch de mapeo RA-EURACE completada',
    type: BatchRaEuraceOperationResultDto,
    example: {
      totalSolicitadas: 3,
      exitosas: 2,
      fallidas: 1,
      errores: ['Ya existe una relación entre RA ID 1 y criterio EUR-ACE ID 2'],
      relacionesCreadas: [23, 24],
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o errores de validación',
  })
  @ApiResponse({
    status: 403,
    description: 'Sin permisos para realizar esta operación',
  })
  async createBatchRaEuraceMappings(
    @Body() dto: CreateBatchRaEuraceMappingsDto,
  ): Promise<BatchRaEuraceOperationResultDto> {
    return this.mappingsService.createBatchRaEuraceMappings(dto);
  }

  @ApiTags('Mappings OPP-RA')
  @Get('opp-ra')
  @Roles(RolEnum.COORDINADOR, RolEnum.ADMINISTRADOR, RolEnum.PROFESOR, RolEnum.DECANO, RolEnum.CEI)
  @ApiOperation({
    summary: 'Listar todas las relaciones OPP-RA',
    description: 'Obtiene todas las relaciones entre OPPs y RAs con filtros opcionales',
  })
  @ApiQuery({
    name: 'carreraId',
    required: false,
    description: 'Filtrar por ID de carrera',
    type: Number,
  })
  @ApiQuery({
    name: 'resultadoAprendizajeId', 
    required: false,
    description: 'Filtrar por ID de Resultado de Aprendizaje',
    type: Number,
  })
  @ApiQuery({
    name: 'oppId',
    required: false,
    description: 'Filtrar por ID de OPP',
    type: Number,
  })
  @ApiQuery({
    name: 'estadoActivo',
    required: false,
    description: 'Filtrar por estado activo',
    type: Boolean,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de relaciones OPP-RA',
    type: [RaOppModel],
  })
  async findAllRaOppMappings(
    @Query() filters: FilterRaOppMappingsDto,
  ): Promise<RaOppModel[]> {
    return this.mappingsService.findAllRaOppMappings(filters);
  }

  @ApiTags('Mappings OPP-RA')
  @Get('opp-ra/carrera/:carreraId')
  @Roles(RolEnum.COORDINADOR, RolEnum.ADMINISTRADOR, RolEnum.PROFESOR, RolEnum.CEI)
  @ApiOperation({
    summary: 'Obtener relaciones OPP-RA por carrera',
    description: 'Lista todas las relaciones de una carrera específica',
  })
  @ApiParam({
    name: 'carreraId',
    description: 'ID de la carrera',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Relaciones de la carrera',
    type: [RaOppModel],
  })
  async findMappingsByCarrera(
    @Param('carreraId') carreraId: number,
  ): Promise<RaOppModel[]> {
    return this.mappingsService.findMappingsByCarrera(+carreraId);
  }

  @ApiTags('Mappings OPP-RA')
  @Get('available-ras/opp/:oppId')
  @Roles(RolEnum.COORDINADOR, RolEnum.ADMINISTRADOR, RolEnum.PROFESOR, RolEnum.DECANO, RolEnum.CEI)
  @ApiOperation({
    summary: 'Obtener RAs disponibles para un OPP',
    description: `
    **Endpoint para wizard**: Obtiene todos los Resultados de Aprendizaje de la misma carrera 
    que NO tienen relación con el OPP seleccionado. Evita duplicados en el paso 2 del wizard.
    
    **Filtros aplicados**:
    - ✅ Misma carrera que el OPP
    - ✅ Sin relación previa con el OPP
    - ✅ Filtro por tipo (GENERAL/ESPECIFICO) opcional
    - ✅ Ordenados por código
    `,
  })
  @ApiParam({
    name: 'oppId',
    description: 'ID del OPP seleccionado en paso 1',
    type: Number,
  })
  @ApiQuery({
    name: 'tipo',
    required: false,
    description: 'Filtrar RAs por tipo: GENERAL o ESPECIFICO',
    enum: TipoRA,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de RAs disponibles para relacionar',
    type: [ResultadoAprendizajeModel],
  })
  @ApiResponse({
    status: 400,
    description: 'OPP no encontrado',
  })
  async getAvailableRAsForOpp(
    @Param('oppId') oppId: number,
    @Query('tipo') tipo?: TipoRA,
  ): Promise<ResultadoAprendizajeModel[]> {
    return this.mappingsService.getAvailableRAsForOpp(+oppId, tipo);
  }

  @ApiTags('Mappings OPP-RA')
  @Get('available-opps/ra/:raId')
  @Roles(RolEnum.COORDINADOR, RolEnum.ADMINISTRADOR, RolEnum.PROFESOR)
  @ApiOperation({
    summary: 'Obtener OPPs disponibles para un RA',
    description: `
    **Endpoint simétrico**: Obtiene todos los OPPs de la misma carrera 
    que NO tienen relación con el RA seleccionado.
    `,
  })
  @ApiParam({
    name: 'raId',
    description: 'ID del RA seleccionado',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de OPPs disponibles para relacionar',
    type: [OppModel],
  })
  async getAvailableOppsForRa(
    @Param('raId') raId: number,
  ): Promise<OppModel[]> {
    return this.mappingsService.getAvailableOppsForRa(+raId);
  }

  @ApiTags('Mappings OPP-RA')
  @Delete('opp-ra/:id')
  @Roles(RolEnum.COORDINADOR, RolEnum.ADMINISTRADOR)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Eliminar relación OPP-RA',
    description: 'Elimina una relación específica entre OPP y RA',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la relación',
    type: Number,
  })
  @ApiResponse({
    status: 204,
    description: 'Relación eliminada exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Relación no encontrada',
  })
  async deleteRaOppMapping(@Param('id') id: number): Promise<void> {
    return this.mappingsService.deleteRaOppMapping(+id);
  }

  // ========== ENDPOINTS RA-EURACE HU7769 ==========

  @ApiTags('Mappings RA-EURACE')
  @Get('ra-eur-ace')
  @Roles(RolEnum.COORDINADOR, RolEnum.ADMINISTRADOR, RolEnum.PROFESOR, RolEnum.DECANO, RolEnum.CEI)
  @ApiOperation({
    summary: 'Listar relaciones RA-EURACE con filtros',
    description: `
    **HU7769**: Obtener todas las relaciones entre RAs y criterios EUR-ACE con filtros opcionales.
    Útil para visualizar mapeos existentes y gestionar trazabilidad de competencias.
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de relaciones RA-EURACE',
    type: [RaEuraceModel],
  })
  async findAllRaEuraceMappings(
    @Query() filters: FilterRaEuraceMappingsDto,
  ): Promise<RaEuraceModel[]> {
    return this.mappingsService.findAllRaEuraceMappings(filters);
  }

  @ApiTags('Mappings RA-EURACE')
  @Get('available-ras/eur-ace/:eurAceId')
  @Roles(RolEnum.COORDINADOR, RolEnum.ADMINISTRADOR, RolEnum.PROFESOR)
  @ApiOperation({
    summary: 'Obtener RAs disponibles para un criterio EUR-ACE',
    description: `
    **HU7769 - Task 7864**: Paso 2 del asistente de mapeo RA-EURACE.
    
    Después de seleccionar un criterio EUR-ACE, este endpoint muestra todos los RAs 
    de las carreras que NO tienen relación con el criterio seleccionado.
    
    Permite filtrar por tipo de RA (GENERAL/ESPECÍFICO) para facilitar la selección.
    `,
  })
  @ApiParam({
    name: 'eurAceId',
    description: 'ID del criterio EUR-ACE seleccionado en paso 1',
    type: Number,
  })
  @ApiQuery({
    name: 'tipo',
    required: false,
    description: 'Filtrar RAs por tipo: GENERAL o ESPECIFICO',
    enum: TipoRA,
  })
  @ApiQuery({
    name: 'carreraId',
    required: false,
    description: 'Filtrar RAs por carrera específica',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de RAs disponibles para relacionar con el criterio EUR-ACE',
    type: [ResultadoAprendizajeModel],
  })
  @ApiResponse({
    status: 400,
    description: 'Criterio EUR-ACE no encontrado',
  })
  async getAvailableRAsForEurAce(
    @Param('eurAceId') eurAceId: number,
    @Query('tipo') tipo?: TipoRA,
    @Query('carreraId') carreraId?: number,
  ): Promise<ResultadoAprendizajeModel[]> {
    return this.mappingsService.getAvailableRAsForEurAce(+eurAceId, tipo, carreraId);
  }

  @ApiTags('Mappings RA-EURACE')
  @Delete('ra-eur-ace/:id')
  @Roles(RolEnum.COORDINADOR, RolEnum.ADMINISTRADOR)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Eliminar relación RA-EURACE',
    description: 'Elimina una relación específica entre RA y criterio EUR-ACE',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la relación RA-EURACE',
    type: Number,
  })
  @ApiResponse({
    status: 204,
    description: 'Relación RA-EURACE eliminada exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Relación no encontrada',
  })
  async deleteRaEuraceMapping(@Param('id') id: number): Promise<void> {
    return this.mappingsService.deleteRaEuraceMapping(+id);
  }

  @ApiTags('Mappings RA-EURACE')
  @Get('ra-eur-ace/matrix/:carreraId')
  @Roles(RolEnum.COORDINADOR, RolEnum.ADMINISTRADOR, RolEnum.PROFESOR, RolEnum.DECANO, RolEnum.CEI)
  @ApiOperation({
    summary: 'Obtener matriz de mapeo RA-EURACE para visualización',
    description: `
    **HU7758 - Task 7866**: Endpoint para obtener datos de matriz de relaciones RA-EURACE.
    
    Retorna una matriz completa que cruza Resultados de Aprendizaje (RAs) con criterios EUR-ACE,
    mostrando todas las relaciones existentes y facilitando la visualización en el frontend.

    **Características**:
    - ✅ Matriz bidimensional: RAs × Criterios EUR-ACE  
    - ✅ Estadísticas de cobertura y trazabilidad
    - ✅ Todos los RAs y criterios EUR-ACE disponibles
    - ✅ Justificaciones de mapeos incluidas
    - ✅ Preparado para visualización frontend

    **Casos de uso**:
    - Visualización de matriz de trazabilidad RA-EURACE
    - Análisis de cobertura de criterios EUR-ACE
    - Auditorías de acreditación y calidad
    - Reportes de cumplimiento de estándares
    `,
  })
  @ApiParam({
    name: 'carreraId',
    description: 'ID de la carrera para obtener la matriz',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Matriz de mapeo RA-EURACE obtenida exitosamente',
    type: RaEuraceMatrixResponseDto,
    example: {
      ras: [
        {
          id: 1,
          code: 'RA001',
          name: 'Análisis y diseño de software',
          description: 'Aplicar métodos de análisis y diseño para soluciones eficientes',
          active: true,
          type: 'ESPECIFICO',
        },
      ],
      eurAceCriteria: [
        {
          id: 1,
          code: 'EA1.1',
          name: 'Conocimiento y comprensión',
          description: 'Conocimiento técnico especializado',
          active: true,
        },
      ],
      mappings: [
        {
          raId: 1,
          eurAceId: 1,
          hasMapping: true,
          mappingId: 25,
          justification: 'Este RA desarrolla conocimientos técnicos especializados',
        },
      ],
      programId: 1,
      programName: 'Ingeniería en Sistemas Computacionales',
      stats: {
        totalRas: 12,
        totalEurAceCriteria: 8,
        totalMappings: 18,
        coveragePercentage: 72.3,
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Carrera no encontrada',
  })
  async getRaEuraceMatrix(
    @Param('carreraId') carreraId: number,
  ): Promise<RaEuraceMatrixResponseDto> {
    return this.mappingsService.getRaEuraceMatrix(+carreraId);
  }

  // ========== NUEVOS ENDPOINTS HU7777 ==========

  @ApiTags('Mappings OPP-RA')
  @Get('opp-ra/matrix/:carreraId')
  @Roles(RolEnum.COORDINADOR, RolEnum.ADMINISTRADOR, RolEnum.PROFESOR, RolEnum.DECANO, RolEnum.CEI)
  @ApiOperation({
    summary: 'Obtener matriz de mapeo OPP-RA para visualización',
    description: `
    **HU7777 - Task 7856**: Endpoint para obtener datos de matriz de relaciones OPP-RA.
    
    Retorna una matriz completa que muestra:
    - Lista de OPPs (filas) con id, code, name, description, active
    - Lista de RAs (columnas) con id, code, name, description, active, type  
    - Mapeos existentes entre OPPs y RAs con justificaciones
    - Estadísticas de cobertura de la matriz
    
    **Casos de uso**:
    - Visualización de matriz de trazabilidad OPP-RA
    - Identificación de gaps en mapeos
    - Análisis de cobertura curricular
    `,
  })
  @ApiParam({
    name: 'carreraId',
    description: 'ID de la carrera',
    type: Number,
  })
  @ApiQuery({
    name: 'raType',
    description: 'Filtrar RAs por tipo',
    enum: ['GENERAL', 'ESPECIFICO'],
    required: false,
  })
  @ApiQuery({
    name: 'activeOnly',
    description: 'Incluir solo elementos activos',
    type: Boolean,
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Matriz de mapeo OPP-RA obtenida exitosamente',
    // type: OppRaMatrixResponseDto, // Uncomment when importing DTO
  })
  @ApiResponse({
    status: 404,
    description: 'Carrera no encontrada',
  })
  async getOppRaMatrix(
    @Param('carreraId') carreraId: number,
    @Query('raType') raType?: string,
    @Query('activeOnly') activeOnly?: boolean,
  ) {
    const filters = {
      raType,
      activeOnly: activeOnly !== false, // Default true
    };
    
    return this.mappingsService.getOppRaMatrix(+carreraId, filters);
  }
}

@ApiTags('Mappings OPP-RA')
@ApiBearerAuth() 
@Controller('programs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProgramsController {
  constructor(private readonly mappingsService: MappingsService) {}

  @Get(':carreraId/opps')
  @Roles(RolEnum.COORDINADOR, RolEnum.ADMINISTRADOR, RolEnum.PROFESOR, RolEnum.DECANO, RolEnum.CEI)
  @ApiOperation({
    summary: 'Obtener catálogo de OPPs por carrera',
    description: `
    **HU7777 - Task 7872**: Exponer catálogo de OPP por carrera.
    
    Retorna lista de Objetivos de Perfil Profesional de la carrera con:
    - id: Identificador único
    - code: Código del OPP  
    - name: Nombre del OPP
    - description: Descripción detallada
    - active: Estado activo
    `,
  })
  @ApiParam({
    name: 'carreraId',
    description: 'ID de la carrera',
    type: Number,
  })
  @ApiQuery({
    name: 'lang',
    description: 'Idioma de la respuesta',
    enum: ['es', 'en'],
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Catálogo de OPPs obtenido exitosamente',
    // type: ProgramOppsCatalogResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Carrera no encontrada',
  })
  async getProgramOpps(
    @Param('carreraId') carreraId: number,
    @Query('lang') lang: string = 'es',
  ) {
    return this.mappingsService.getProgramOppsCatalog(+carreraId, lang);
  }
  
  @Get(':carreraId/learning-outcomes')
  @Roles(RolEnum.COORDINADOR, RolEnum.ADMINISTRADOR, RolEnum.PROFESOR, RolEnum.DECANO, RolEnum.CEI)
  @ApiOperation({
    summary: 'Obtener catálogo de RAs por carrera',
    description: `
    **HU7777 - Task 7873**: Exponer catálogo de RA por carrera.
    
    Retorna lista de Resultados de Aprendizaje de la carrera con:
    - id: Identificador único
    - code: Código del RA
    - name: Nombre del RA  
    - description: Descripción detallada
    - active: Estado activo
    - type: Tipo del RA (GENERAL/ESPECIFICO)
    `,
  })
  @ApiParam({
    name: 'carreraId',
    description: 'ID de la carrera',
    type: Number,
  })
  @ApiQuery({
    name: 'lang',
    description: 'Idioma de la respuesta', 
    enum: ['es', 'en'],
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Catálogo de RAs obtenido exitosamente',
    // type: ProgramRasCatalogResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Carrera no encontrada',
  })
  async getProgramLearningOutcomes(
    @Param('carreraId') carreraId: number,
    @Query('lang') lang: string = 'es',
  ) {
    return this.mappingsService.getProgramRasCatalog(+carreraId, lang);
  }
}

@ApiTags('Mappings RAA-RA')
@ApiBearerAuth()
@Controller('mappings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RaaRaMappingsController {
  constructor(private readonly mappingsService: MappingsService) {}

  @Post('raa-ra')
  @Roles(RolEnum.COORDINADOR, RolEnum.ADMINISTRADOR, RolEnum.PROFESOR, RolEnum.DECANO, RolEnum.JEFE_DEPARTAMENTO, RolEnum.SUBDECANO)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear una relación RAA-RA',
    description: `
    **HU8084**: Crear una relación de mapeo entre un Resultado de Aprendizaje de Asignatura (RAA) 
    y un Resultado de Aprendizaje de Carrera (RA).
    
    **Validaciones implementadas**:
    - ✅ Verificar que el RAA existe
    - ✅ Verificar que el RA existe
    - ✅ Verificar que pertenecen a la misma carrera
    - ✅ Verificar que no existe relación duplicada
    - ✅ Validar nivel de aporte (ALTO, MEDIO, BAJO)
    - ✅ Validar justificación (10-1000 caracteres, opcional)
    
    **Roles autorizados**: COORDINADOR, ADMINISTRADOR
    `,
  })
  @ApiResponse({
    status: 201,
    description: 'Relación RAA-RA creada exitosamente',
    example: {
      id: 1,
      raaId: 1,
      resultadoAprendizajeId: 6,
      nivelAporte: 'Medio',
      justificacion: 'Este RA complementa parcialmente las competencias del RAA',
      estadoActivo: true,
      createdAt: '2025-10-21T21:30:00.000Z',
      updatedAt: '2025-10-21T21:30:00.000Z',
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o errores de validación',
  })
  @ApiResponse({
    status: 409,
    description: 'Ya existe una relación entre este RAA y RA',
  })
  @ApiResponse({
    status: 403,
    description: 'Sin permisos para realizar esta operación',
  })
  async createRaaRaMapping(
    @Body() dto: CreateRaaRaMappingDto,
  ) {
    return this.mappingsService.createRaaRaMapping(dto);
  }

  

  @Get('raa-ra')
  @Roles(RolEnum.COORDINADOR, RolEnum.ADMINISTRADOR, RolEnum.PROFESOR, RolEnum.DECANO, RolEnum.CEI)
  @ApiOperation({
    summary: 'Listar todas las relaciones RAA-RA con filtros',
    description: `
    **HU8084**: Obtiene todas las relaciones entre RAAs y RAs con filtros opcionales.
    
    **Filtros disponibles**:
    - raaId: Filtrar por ID de RAA específico
    - resultadoAprendizajeId: Filtrar por ID de RA específico
    - asignaturaId: Filtrar por asignatura (todos los RAAs de esa asignatura)
    - carreraId: Filtrar por carrera
    - nivelAporte: Filtrar por nivel de aporte (ALTO, MEDIO, BAJO)
    - estadoActivo: Filtrar por estado activo
    `,
  })
  @ApiQuery({ name: 'raaId', required: false, type: Number })
  @ApiQuery({ name: 'resultadoAprendizajeId', required: false, type: Number })
  @ApiQuery({ name: 'asignaturaId', required: false, type: Number })
  @ApiQuery({ name: 'carreraId', required: false, type: Number })
  @ApiQuery({ name: 'nivelAporte', required: false, enum: ['Alto', 'Medio', 'Bajo'] })
  @ApiQuery({ name: 'estadoActivo', required: false, type: Boolean })
  @ApiResponse({
    status: 200,
    description: 'Lista de relaciones RAA-RA',
  })
  async findAllRaaRaMappings(
    @Query() filters: FilterRaaRaMappingsDto,
  ) {
    return this.mappingsService.findAllRaaRaMappings(filters);
  }

  @Get('available-ras/raa/:raaId')
  @Roles(RolEnum.COORDINADOR, RolEnum.ADMINISTRADOR, RolEnum.PROFESOR)
  @ApiOperation({
    summary: 'Obtener RAs disponibles para un RAA',
    description: `
    **HU8084 - Paso 2 del asistente**: Obtiene todos los RAs de la carrera especificada 
    que NO tienen relación con el RAA seleccionado.
    
    **Funcionalidad**:
    - Valida que el RAA existe
    - Retorna solo RAs de la carrera especificada sin relación previa con el RAA
    - Permite filtrar por tipo de RA (GENERAL/ESPECIFICO)
    - Ordenados por código
    `,
  })
  @ApiParam({
    name: 'raaId',
    description: 'ID del RAA seleccionado en paso 1',
    type: Number,
  })
  @ApiQuery({
    name: 'carreraId',
    required: true,
    description: 'ID de la carrera',
    type: Number,
  })
  @ApiQuery({
    name: 'tipo',
    required: false,
    description: 'Filtrar RAs por tipo: GENERAL o ESPECIFICO',
    enum: TipoRA,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de RAs disponibles para relacionar',
    type: [ResultadoAprendizajeModel],
  })
  @ApiResponse({
    status: 404,
    description: 'RAA no encontrado',
  })
  async getAvailableRAsForRaa(
    @Param('raaId') raaId: number,
    @Query('carreraId') carreraId: number,
    @Query('tipo') tipo?: TipoRA,
  ): Promise<ResultadoAprendizajeModel[]> {
    return this.mappingsService.getAvailableRAsForRaa(+raaId, +carreraId, tipo);
  }

  @Patch('raa-ra/:id')
  @Roles(RolEnum.COORDINADOR, RolEnum.ADMINISTRADOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Actualizar una relación RAA-RA',
    description: `
    **HU8084**: Actualizar una relación de mapeo existente entre RAA y RA.
    
    Permite modificar:
    - Nivel de aporte (ALTO, MEDIO, BAJO)
    - Justificación
    - Estado activo
    
    **Nota**: No se puede cambiar el RAA o RA de la relación, solo sus atributos.
    
    **Roles autorizados**: COORDINADOR, ADMINISTRADOR
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la relación RAA-RA a actualizar',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Relación RAA-RA actualizada exitosamente',
    example: {
      id: 1,
      raaId: 1,
      resultadoAprendizajeId: 6,
      nivelAporte: 'Alto',
      justificacion: 'Este RA contribuye significativamente al desarrollo de competencias',
      estadoActivo: true,
      createdAt: '2025-10-21T21:30:00.000Z',
      updatedAt: '2025-10-21T21:35:00.000Z',
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Relación no encontrada',
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos',
  })
  @ApiResponse({
    status: 403,
    description: 'Sin permisos para realizar esta operación',
  })
  async updateRaaRaMapping(
    @Param('id') id: number,
    @Body() dto: UpdateRaaRaMappingDto,
  ) {
    return this.mappingsService.updateRaaRaMapping(+id, dto);
  }

  @Delete('raa-ra/:id')
  @Roles(RolEnum.COORDINADOR, RolEnum.ADMINISTRADOR, RolEnum.PROFESOR, RolEnum.DECANO, RolEnum.JEFE_DEPARTAMENTO)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Eliminar relación RAA-RA',
    description: 'Elimina una relación específica entre RAA y RA',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la relación RAA-RA',
    type: Number,
  })
  @ApiResponse({
    status: 204,
    description: 'Relación eliminada exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Relación no encontrada',
  })
  async deleteRaaRaMapping(@Param('id') id: number): Promise<void> {
    return this.mappingsService.deleteRaaRaMapping(+id);
  }

  @Get('raa-ra/matrix/:asignaturaId/:carreraId')
  @Roles(RolEnum.COORDINADOR, RolEnum.ADMINISTRADOR, RolEnum.PROFESOR, RolEnum.DECANO, RolEnum.CEI)
  @ApiOperation({
    summary: 'Obtener matriz de mapeo RAA-RA para visualización por asignatura',
    description: `
    **HU8084**: Endpoint para obtener datos de matriz de relaciones RAA-RA.
    
    Retorna una matriz completa que cruza RAAs de una asignatura con RAs de la carrera,
    mostrando todas las relaciones existentes con niveles de aporte.
    
    **Características**:
    - ✅ Matriz bidimensional: RAAs × RAs
    - ✅ Estadísticas de cobertura y trazabilidad
    - ✅ Niveles de aporte incluidos (ALTO, MEDIO, BAJO)
    - ✅ Justificaciones de mapeos
    - ✅ Preparado para visualización frontend
    
    **Casos de uso**:
    - Visualización de matriz de trazabilidad RAA-RA por asignatura
    - Análisis de contribución de asignatura a RAs de carrera
    - Auditorías de acreditación curricular
    - Reportes de cobertura de RAs por asignatura
    `,
  })
  @ApiParam({
    name: 'asignaturaId',
    description: 'ID de la asignatura',
    type: Number,
  })
  @ApiParam({
    name: 'carreraId',
    description: 'ID de la carrera',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Matriz de mapeo RAA-RA obtenida exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Asignatura o carrera no encontrada',
  })
  @ApiResponse({
    status: 400,
    description: 'No existe relación entre la carrera y la asignatura',
  })
  async getRaaRaMatrix(
    @Param('asignaturaId') asignaturaId: number,
    @Param('carreraId') carreraId: number,
  ) {
    return this.mappingsService.getRaaRaMatrix(+asignaturaId, +carreraId);
  }
}