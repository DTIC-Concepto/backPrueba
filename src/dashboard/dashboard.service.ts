import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { AuditoriaEventoModel } from '../auditoria/models/auditoria-evento.model';
import { UsuarioModel } from '../usuarios/models/usuario.model';
import { ActividadRecenteDto } from './dto/actividad-reciente.dto';
import { ActividadQueryDto } from './dto/actividad-query.dto';
import { RolEnum } from '../common/enums/rol.enum';

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(AuditoriaEventoModel)
    private readonly auditoriaEventoModel: typeof AuditoriaEventoModel,
  ) {}

  async getActividadReciente(
    usuario: UsuarioModel,
    queryDto: ActividadQueryDto,
  ): Promise<ActividadRecenteDto[]> {
    const { limit = 10, offset = 0 } = queryDto;

    // Determinar filtros según el rol del usuario
    const whereConditions: any = {};
    
    // Solo los administradores pueden ver toda la actividad
    // Otros roles solo ven su propia actividad
    if (usuario.rol !== RolEnum.ADMINISTRADOR) {
      whereConditions.usuarioId = usuario.id;
    }

    // Consulta optimizada con índices y eager loading
    const eventos = await this.auditoriaEventoModel.findAll({
      include: [
        {
          model: UsuarioModel,
          attributes: ['correo', 'nombres', 'apellidos', 'rol'],
        },
      ],
      where: whereConditions,
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    return eventos.map((evento) => ({
      hora: evento.getTiempoRelativo(),
      usuario: evento.usuario?.correo || 'Sistema',
      accion: evento.getDescripcionFormateada(),
      tipoEvento: evento.tipoEvento,
      fechaEvento: evento.createdAt,
    }));
  }

  async getEstadisticasActividad(usuario: UsuarioModel) {
    // Determinar filtros según el rol del usuario
    const whereConditions: any = {};
    
    // Solo los administradores pueden ver estadísticas de toda la actividad
    if (usuario.rol !== RolEnum.ADMINISTRADOR) {
      whereConditions.usuarioId = usuario.id;
    }

    const totalEventos = await this.auditoriaEventoModel.count({
      where: whereConditions,
    });

    const eventosHoy = await this.auditoriaEventoModel.count({
      where: {
        ...whereConditions,
        createdAt: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    });

    return {
      totalEventos,
      eventosHoy,
    };
  }
}