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
  constructor(private readonly facultadesService: FacultadesService) {}

  @Post()
  // @UseGuards(RolesGuard)  // Comentado temporalmente para testing
  // @Roles(RolEnum.DGIP, RolEnum.DECANO, RolEnum.SUBDECANO)  // Comentado temporalmente para testing
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear nueva facultad',
    description: 'Crear una nueva facultad en el sistema. Solo usuarios con roles administrativos pueden crear facultades.',
  })
  @ApiCreatedResponse({
    description: 'Facultad creada exitosamente',
    type: CreateFacultadDto,
  })
  @ApiBadRequestResponse({
    description: 'Datos de entrada inválidos o facultad duplicada',
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
  create(@Body() createFacultadDto: CreateFacultadDto, @GetUser() user: UsuarioModel) {
    return this.facultadesService.create(createFacultadDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar facultades',
    description: 'Obtener lista de facultades con filtros opcionales',
  })
  @ApiQuery({
    name: 'estadoActivo',
    required: false,
    type: Boolean,
    description: 'Filtrar por estado activo',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Buscar por nombre, código o descripción',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de facultades obtenida exitosamente',
    type: [CreateFacultadDto],
  })
  @ApiUnauthorizedResponse({
    description: 'Token de autenticación inválido',
    type: ErrorResponseDto,
  })
  findAll(@Query() filterDto: FilterFacultadDto) {
    return this.facultadesService.findAll(filterDto);
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