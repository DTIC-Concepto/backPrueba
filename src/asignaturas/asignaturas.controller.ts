import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  UseGuards,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { AsignaturasService } from './asignaturas.service';
import { CreateAsignaturaDto } from './dto/create-asignatura.dto';
import { UpdateAsignaturaDto } from './dto/update-asignatura.dto';
import { FilterAsignaturaDto } from './dto/filter-asignatura.dto';
import { AsignaturaModel } from './models/asignatura.model';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolEnum } from '../common/enums/rol.enum';
import { TipoAsignaturaEnum } from '../common/enums/tipo-asignatura.enum';
import { UnidadCurricularEnum } from '../common/enums/unidad-curricular.enum';

@ApiTags('Asignaturas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('asignaturas')
export class AsignaturasController {
  constructor(private readonly asignaturasService: AsignaturasService) {}

  @Post()
  @Roles(
    RolEnum.ADMINISTRADOR,
    RolEnum.COORDINADOR,
    RolEnum.PROFESOR,
    RolEnum.JEFE_DEPARTAMENTO,
    RolEnum.SUBDECANO,
    RolEnum.DECANO,
  )
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear nueva asignatura (PEA)',
    description:
      'Permite a un coordinador o profesor crear una nueva asignatura en el sistema. ' +
      'La asignatura debe estar asociada al menos a una carrera. ' +
      'HU8079 — Crear Asignatura (PEA)',
  })
  @ApiResponse({
    status: 201,
    description: 'Asignatura creada exitosamente',
    type: AsignaturaModel,
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos o código duplicado',
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado',
  })
  @ApiResponse({
    status: 403,
    description: 'Sin permisos para crear asignaturas',
  })
  async create(
    @Body() createAsignaturaDto: CreateAsignaturaDto,
  ): Promise<AsignaturaModel> {
    return this.asignaturasService.create(createAsignaturaDto);
  }

  @Get()
  @Roles(
    RolEnum.ADMINISTRADOR,
    RolEnum.COORDINADOR,
    RolEnum.PROFESOR,
    RolEnum.JEFE_DEPARTAMENTO,
    RolEnum.SUBDECANO,
    RolEnum.DECANO,
    RolEnum.CEI,
    RolEnum.DGIP,
  )
  @ApiOperation({
    summary: 'Obtener todas las asignaturas con filtros',
    description:
      'Devuelve la lista de asignaturas con filtros opcionales por: ' +
      'búsqueda (código/descripción), carrera, nivel referencial, créditos, ' +
      'tipo de asignatura, unidad curricular y pénsum.',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Búsqueda por código, nombre o descripción',
    example: 'Software',
  })
  @ApiQuery({
    name: 'carreraId',
    required: false,
    type: 'number',
    description: 'Filtrar por ID de carrera',
    example: 1,
  })
  @ApiQuery({
    name: 'nivelReferencial',
    required: false,
    type: 'number',
    description: 'Filtrar por nivel referencial (1-20)',
    example: 1,
  })
  @ApiQuery({
    name: 'creditos',
    required: false,
    type: 'number',
    description: 'Filtrar por número de créditos (1-10)',
    example: 3,
  })
  @ApiQuery({
    name: 'tipoAsignatura',
    required: false,
    enum: TipoAsignaturaEnum,
    description: 'Filtrar por tipo de asignatura',
    example: TipoAsignaturaEnum.OBLIGATORIA,
  })
  @ApiQuery({
    name: 'unidadCurricular',
    required: false,
    enum: UnidadCurricularEnum,
    description: 'Filtrar por unidad curricular',
    example: UnidadCurricularEnum.UNIDAD_PROFESIONAL,
  })
  @ApiQuery({
    name: 'pensum',
    required: false,
    type: 'number',
    description: 'Filtrar por pénsum (período académico)',
    example: 2023,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de asignaturas obtenida exitosamente',
    type: [AsignaturaModel],
  })
  async findAll(@Query() filterDto: FilterAsignaturaDto): Promise<AsignaturaModel[]> {
    return this.asignaturasService.findAll(filterDto);
  }

  @Get(':id')
  @Roles(
    RolEnum.ADMINISTRADOR,
    RolEnum.COORDINADOR,
    RolEnum.PROFESOR,
    RolEnum.JEFE_DEPARTAMENTO,
    RolEnum.SUBDECANO,
    RolEnum.DECANO,
    RolEnum.CEI,
    RolEnum.DGIP,
  )
  @ApiOperation({
    summary: 'Obtener asignatura por ID',
    description: 'Devuelve los detalles de una asignatura específica por su ID.',
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'ID de la asignatura',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Asignatura encontrada',
    type: AsignaturaModel,
  })
  @ApiResponse({
    status: 404,
    description: 'Asignatura no encontrada',
  })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<AsignaturaModel> {
    return this.asignaturasService.findOne(id);
  }

  @Get('carrera/:carreraId/asignatura/:asignaturaId/relacion')
  @Roles(
    RolEnum.ADMINISTRADOR,
    RolEnum.COORDINADOR,
    RolEnum.PROFESOR,
    RolEnum.JEFE_DEPARTAMENTO,
    RolEnum.SUBDECANO,
    RolEnum.DECANO,
    RolEnum.CEI,
    RolEnum.DGIP,
  )
  @ApiOperation({
    summary: 'Obtener ID de relación carrera-asignatura',
    description:
      'Devuelve el ID de la relación carrera-asignatura necesario para operaciones con RAAs.',
  })
  @ApiParam({
    name: 'carreraId',
    type: 'number',
    description: 'ID de la carrera',
    example: 1,
  })
  @ApiParam({
    name: 'asignaturaId',
    type: 'number',
    description: 'ID de la asignatura',
    example: 2,
  })
  @ApiResponse({
    status: 200,
    description: 'ID de relación encontrado',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 5 },
        carreraId: { type: 'number', example: 1 },
        asignaturaId: { type: 'number', example: 2 },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Relación no encontrada',
  })
  async getCarreraAsignaturaId(
    @Param('carreraId', ParseIntPipe) carreraId: number,
    @Param('asignaturaId', ParseIntPipe) asignaturaId: number,
  ): Promise<any> {
    return this.asignaturasService.getCarreraAsignaturaId(
      carreraId,
      asignaturaId,
    );
  }


  @Patch(':id')
  @Roles(
    RolEnum.ADMINISTRADOR,
    RolEnum.COORDINADOR,
    RolEnum.PROFESOR,
    RolEnum.JEFE_DEPARTAMENTO,
    RolEnum.SUBDECANO,
    RolEnum.DECANO,
  )
  @ApiOperation({
    summary: 'Actualizar asignatura',
    description: 'Actualiza los datos de una asignatura existente.',
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'ID de la asignatura a actualizar',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Asignatura actualizada exitosamente',
    type: AsignaturaModel,
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos',
  })
  @ApiResponse({
    status: 404,
    description: 'Asignatura no encontrada',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAsignaturaDto: UpdateAsignaturaDto,
  ): Promise<AsignaturaModel> {
    return this.asignaturasService.update(id, updateAsignaturaDto);
  }

  @Delete(':id')
  @Roles(RolEnum.ADMINISTRADOR, RolEnum.COORDINADOR)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Eliminar asignatura',
    description: 'Elimina lógicamente (soft delete) una asignatura del sistema.',
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'ID de la asignatura a eliminar',
    example: 1,
  })
  @ApiResponse({
    status: 204,
    description: 'Asignatura eliminada exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Asignatura no encontrada',
  })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.asignaturasService.remove(id);
  }

}
