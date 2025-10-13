import { Injectable, ConflictException, NotFoundException, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { OppModel } from './models/opp.model';
import { CreateOppDto } from './dto/create-opp.dto';
import { FilterOppDto } from './dto/filter-opp.dto';
import { CarreraModel } from '../carreras/models/carrera.model';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { EventoTipoEnum } from '../auditoria/enums/evento-tipo.enum';
import { Op } from 'sequelize';

@Injectable()
export class OppService {
  constructor(
    @InjectModel(OppModel)
    private readonly oppModel: typeof OppModel,
    @InjectModel(CarreraModel)
    private readonly carreraModel: typeof CarreraModel,
    @Inject(AuditoriaService)
    private readonly auditoriaService: AuditoriaService,
  ) {}

  async create(createOppDto: CreateOppDto, usuarioId: number): Promise<OppModel> {
    // Verificar que la carrera existe
    const carrera = await this.carreraModel.findByPk(createOppDto.carreraId);
    if (!carrera) {
      throw new NotFoundException('La carrera especificada no existe');
    }

    // Verificar unicidad del código
    const existingOpp = await this.oppModel.findOne({
      where: { 
        codigo: createOppDto.codigo,
        carreraId: createOppDto.carreraId
      },
    });

    if (existingOpp) {
      throw new ConflictException('Ya existe un Objetivo de Programa con este código para esta carrera');
    }

    // Crear el OPP
    const newOpp = await this.oppModel.create(createOppDto as any);

    // Registrar auditoría
    await this.auditoriaService.registrarEvento({
      usuarioId,
      tipoEvento: EventoTipoEnum.OBJETIVO_PROGRAMA_CREADO,
      descripcion: `Objetivo de Programa creado: ${newOpp.codigo}`,
      entidad: 'OPP',
      entidadId: newOpp.id,
      metadatos: {
        codigo: newOpp.codigo,
        descripcion: newOpp.descripcion,
        carreraId: newOpp.carreraId,
      },
    });

    return newOpp;
  }

  async findAllWithFiltersAndPagination(filters: FilterOppDto = {}) {
    const {
      search,
      page = 1,
      limit = 10,
      carreraId,
    } = filters;

    // Construir condiciones WHERE
    const whereConditions: any = {};

    // Filtro por carrera si se especifica
    if (carreraId) {
      whereConditions.carreraId = carreraId;
    }

    // Filtro de búsqueda por código o descripción
    if (search) {
      whereConditions[Op.or] = [
        { codigo: { [Op.iLike]: `%${search}%` } },
        { descripcion: { [Op.iLike]: `%${search}%` } },
      ];
    }

    // Calcular offset para paginación
    const offset = (page - 1) * limit;

    // Ejecutar consulta con filtros y paginación
    const { rows, count } = await this.oppModel.findAndCountAll({
      where: whereConditions,
      include: [
        {
          model: CarreraModel,
          as: 'carrera',
          attributes: ['id', 'codigo', 'nombre'],
        },
      ],
      order: [['codigo', 'ASC']],
      limit,
      offset,
    });

    // Calcular información de paginación
    const totalPages = Math.ceil(count / limit);
    const hasPrevious = page > 1;
    const hasNext = page < totalPages;

    return {
      data: rows,
      total: count,
      page,
      limit,
      totalPages,
      hasPrevious,
      hasNext,
    };
  }
}