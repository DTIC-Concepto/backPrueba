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
import { RaaService } from './raa.service';
import { CreateRaaDto } from './dto/create-raa.dto';
import { UpdateRaaDto } from './dto/update-raa.dto';
import { FilterRaaDto } from './dto/filter-raa.dto';
import { RaaModel } from './models/raa.model';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolEnum } from '../common/enums/rol.enum';
import { TipoRaaEnum } from '../common/enums/tipo-raa.enum';

@ApiTags('RAA (Resultados de Aprendizaje de Asignatura)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('raa')
export class RaaController {
  constructor(private readonly raaService: RaaService) {}

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
    summary: 'Crear nuevo RAA',
    description:
      'Permite crear un nuevo Resultado de Aprendizaje de Asignatura (RAA). ' +
      'Los RAAs definen los objetivos específicos de aprendizaje de una asignatura. ' +
      'HU8074 — Crear Resultado de Aprendizaje de Asignatura (RAA)',
  })
  @ApiResponse({
    status: 201,
    description: 'RAA creado exitosamente',
    type: RaaModel,
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
    description: 'Sin permisos para crear RAAs',
  })
  async create(@Body() createRaaDto: CreateRaaDto): Promise<RaaModel> {
    return this.raaService.create(createRaaDto);
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
    summary: 'Obtener todos los RAAs con filtros',
    description:
      'Devuelve la lista de RAAs con filtros opcionales por: ' +
      'búsqueda (código/descripción), carreraAsignaturaId, asignaturaId, carreraId y tipo de RAA.',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Búsqueda por código o descripción',
    example: '1.1',
  })
  @ApiQuery({
    name: 'carreraAsignaturaId',
    required: false,
    type: 'number',
    description: 'Filtrar por ID de relación carrera-asignatura',
    example: 2,
  })
  @ApiQuery({
    name: 'asignaturaId',
    required: false,
    type: 'number',
    description: 'Filtrar por ID de asignatura',
    example: 1,
  })
  @ApiQuery({
    name: 'carreraId',
    required: false,
    type: 'number',
    description: 'Filtrar por ID de carrera',
    example: 1,
  })
  @ApiQuery({
    name: 'tipo',
    required: false,
    enum: TipoRaaEnum,
    description: 'Filtrar por tipo de RAA',
    example: TipoRaaEnum.CONOCIMIENTOS,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de RAAs obtenida exitosamente',
    type: [RaaModel],
  })
  async findAll(@Query() filterDto: FilterRaaDto): Promise<RaaModel[]> {
    return this.raaService.findAll(filterDto);
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
    summary: 'Obtener RAA por ID',
    description: 'Devuelve los detalles de un RAA específico por su ID.',
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'ID del RAA',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'RAA encontrado',
    type: RaaModel,
  })
  @ApiResponse({
    status: 404,
    description: 'RAA no encontrado',
  })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<RaaModel> {
    return this.raaService.findOne(id);
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
    summary: 'Actualizar RAA',
    description: 'Actualiza los datos de un RAA existente.',
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'ID del RAA a actualizar',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'RAA actualizado exitosamente',
    type: RaaModel,
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos',
  })
  @ApiResponse({
    status: 404,
    description: 'RAA no encontrado',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRaaDto: UpdateRaaDto,
  ): Promise<RaaModel> {
    return this.raaService.update(id, updateRaaDto);
  }

  @Delete(':id')
  @Roles(RolEnum.ADMINISTRADOR, RolEnum.COORDINADOR)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Eliminar RAA',
    description: 'Elimina un RAA del sistema.',
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'ID del RAA a eliminar',
    example: 1,
  })
  @ApiResponse({
    status: 204,
    description: 'RAA eliminado exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'RAA no encontrado',
  })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.raaService.remove(id);
  }
}
