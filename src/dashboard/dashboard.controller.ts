import {
  Controller,
  Get,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { UsuarioModel } from '../usuarios/models/usuario.model';
import { ActividadRecenteDto } from './dto/actividad-reciente.dto';
import { ActividadQueryDto } from './dto/actividad-query.dto';

@ApiTags('Dashboard')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('activity')
  @ApiOperation({
    summary: 'Obtener actividad reciente',
    description: 'Obtiene un resumen de la actividad reciente para mostrar en el dashboard. Los administradores ven toda la actividad del sistema, mientras que otros roles solo ven su propia actividad. Incluye eventos como creación de facultades, actualización de carreras, revisión de informes, etc.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de actividad reciente obtenida exitosamente',
    type: [ActividadRecenteDto],
    example: [
      {
        hora: 'Hace 5 min',
        usuario: 'admin@epn.edu.ec',
        accion: "Creó nueva facultad 'FIEC'",
        tipoEvento: 'FACULTAD_CREADA',
        fechaEvento: '2024-09-30T15:30:00.000Z'
      },
      {
        hora: 'Hace 15 min',
        usuario: 'decano@epn.edu.ec',
        accion: "Actualizó datos de carrera 'Ingeniería Civil'",
        tipoEvento: 'CARRERA_ACTUALIZADA',
        fechaEvento: '2024-09-30T15:20:00.000Z'
      },
      {
        hora: 'Hace 30 min',
        usuario: 'ci@epn.edu.ec',
        accion: 'Revisó informe de acreditación',
        tipoEvento: 'INFORME_REVISADO',
        fechaEvento: '2024-09-30T15:05:00.000Z'
      }
    ]
  })
  @ApiUnauthorizedResponse({
    description: 'No autorizado - Token inválido o expirado',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Número de eventos a retornar (máximo 50)',
    example: 10,
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    description: 'Offset para paginación',
    example: 0,
  })
  async getActividadReciente(
    @GetUser() usuario: UsuarioModel,
    @Query() queryDto: ActividadQueryDto,
  ): Promise<ActividadRecenteDto[]> {
    return this.dashboardService.getActividadReciente(usuario, queryDto);
  }

  @Get('stats')
  @ApiOperation({
    summary: 'Obtener estadísticas de actividad',
    description: 'Obtiene estadísticas básicas de actividad para el dashboard. Los administradores ven estadísticas globales, otros roles ven solo sus propias estadísticas.',
  })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas de actividad obtenidas exitosamente',
    schema: {
      type: 'object',
      properties: {
        totalEventos: { type: 'number', example: 145 },
        eventosHoy: { type: 'number', example: 12 },
      },
    },
  })
  async getEstadisticasActividad(
    @GetUser() usuario: UsuarioModel,
  ) {
    return this.dashboardService.getEstadisticasActividad(usuario);
  }
}