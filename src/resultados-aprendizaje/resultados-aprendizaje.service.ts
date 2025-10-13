import { Injectable, ConflictException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { ResultadoAprendizajeModel } from './models/resultado-aprendizaje.model';
import { CarreraModel } from '../carreras/models/carrera.model';
import { CreateResultadoAprendizajeDto } from './dto/create-resultado-aprendizaje.dto';
import { FilterResultadoAprendizajeDto } from './dto/filter-resultado-aprendizaje.dto';
import { AuditoriaService } from '../auditoria/auditoria.service';

@Injectable()
export class ResultadosAprendizajeService {
  constructor(
    @InjectModel(ResultadoAprendizajeModel)
    private readonly resultadoAprendizajeModel: typeof ResultadoAprendizajeModel,
    @InjectModel(CarreraModel)
    private readonly carreraModel: typeof CarreraModel,
    private readonly auditoriaService: AuditoriaService,
  ) {}

  async create(
    createRaDto: CreateResultadoAprendizajeDto,
    usuarioId?: number,
  ): Promise<ResultadoAprendizajeModel> {
    try {
      // Verificar que la carrera existe
      const carrera = await this.carreraModel.findByPk(createRaDto.carreraId);
      if (!carrera) {
        throw new NotFoundException('La carrera especificada no existe');
      }

      // Auto-generar código si no se proporciona
      let codigo = createRaDto.codigo;
      if (!codigo) {
        codigo = await this.generateNextCode(createRaDto.tipo, createRaDto.carreraId);
      } else {
        // Si se proporciona código, verificar unicidad
        const existingRa = await this.resultadoAprendizajeModel.findOne({
          where: { 
            codigo: codigo, 
            tipo: createRaDto.tipo,
            carreraId: createRaDto.carreraId,
          },
        });

        if (existingRa) {
          throw new ConflictException(
            `Ya existe un Resultado de Aprendizaje con el código "${codigo}" de tipo "${createRaDto.tipo}" para esta carrera`,
          );
        }
      }

      // Crear el nuevo RA
      const newRa = await this.resultadoAprendizajeModel.create({
        codigo,
        descripcion: createRaDto.descripcion,
        tipo: createRaDto.tipo,
        carreraId: createRaDto.carreraId,
      } as any);

      // Registrar en auditoría
      if (usuarioId) {
        await this.auditoriaService.registrarEvento({
          usuarioId,
          tipoEvento: 'RESULTADO_APRENDIZAJE_CREADO' as any,
          descripcion: `Se creó el Resultado de Aprendizaje "${newRa.codigo}" de tipo "${newRa.tipo}" para la carrera ${carrera.nombre}`,
          entidad: 'resultados_aprendizaje',
          entidadId: newRa.id,
          metadatos: {
            codigo: newRa.codigo,
            tipo: newRa.tipo,
            carreraId: newRa.carreraId,
            carreraNombre: carrera.nombre,
          },
        });
      }

      return newRa;
    } catch (error) {
      if (error instanceof ConflictException || error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Error interno del servidor al crear el Resultado de Aprendizaje',
      );
    }
  }

  async findAllWithFiltersAndPagination(filterDto: FilterResultadoAprendizajeDto): Promise<{
    data: ResultadoAprendizajeModel[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasPrevious: boolean;
    hasNext: boolean;
  }> {
    const { 
      codigo, 
      descripcion, 
      tipo, 
      carreraId, 
      search, 
      page = 1, 
      limit = 10 
    } = filterDto;

    // Construir filtros dinámicos
    const whereClause: any = {};

    if (codigo) {
      whereClause.codigo = {
        [Op.iLike]: `%${codigo}%`,
      };
    }

    if (descripcion) {
      whereClause.descripcion = {
        [Op.iLike]: `%${descripcion}%`,
      };
    }

    if (tipo) {
      whereClause.tipo = tipo;
    }

    if (carreraId) {
      whereClause.carreraId = carreraId;
    }

    // Búsqueda general en código y descripción
    if (search) {
      whereClause[Op.or] = [
        { codigo: { [Op.iLike]: `%${search}%` } },
        { descripcion: { [Op.iLike]: `%${search}%` } },
      ];
    }

    // Calcular offset para paginación
    const offset = (page - 1) * limit;

    try {
      // Ejecutar consulta con filtros, paginación y conteo total
      const { rows: data, count: total } = await this.resultadoAprendizajeModel.findAndCountAll({
        where: whereClause,
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

      // Calcular metadatos de paginación
      const totalPages = Math.ceil(total / limit);
      const hasPrevious = page > 1;
      const hasNext = page < totalPages;

      return {
        data,
        total,
        page,
        limit,
        totalPages,
        hasPrevious,
        hasNext,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Error interno del servidor al obtener los Resultados de Aprendizaje',
      );
    }
  }

  async findById(id: number): Promise<ResultadoAprendizajeModel | null> {
    return this.resultadoAprendizajeModel.findOne({
      where: { id },
      include: [
        {
          model: CarreraModel,
          as: 'carrera',
          attributes: ['id', 'codigo', 'nombre'],
        },
      ],
    });
  }

  async findByCarrera(carreraId: number): Promise<ResultadoAprendizajeModel[]> {
    return this.resultadoAprendizajeModel.findAll({
      where: { carreraId },
      include: [
        {
          model: CarreraModel,
          as: 'carrera',
          attributes: ['id', 'codigo', 'nombre'],
        },
      ],
      order: [['tipo', 'ASC'], ['codigo', 'ASC']],
    });
  }

  /**
   * Genera el siguiente código disponible para un tipo de RA en una carrera
   */
  private async generateNextCode(tipo: string, carreraId: number): Promise<string> {
    const prefix = tipo === 'GENERAL' ? 'RA' : 'RAE';
    
    // Buscar todos los códigos existentes para este tipo y carrera
    const existingRAs = await this.resultadoAprendizajeModel.findAll({
      where: { 
        tipo,
        carreraId,
        codigo: {
          [Op.like]: `${prefix}%`
        }
      },
      attributes: ['codigo'],
      order: [['codigo', 'ASC']],
    });

    // Extraer números de los códigos existentes
    const existingNumbers = existingRAs
      .map(ra => {
        const match = ra.codigo.match(new RegExp(`^${prefix}(\\d+)$`));
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter(num => num > 0)
      .sort((a, b) => a - b);

    // Encontrar el primer número disponible
    let nextNumber = 1;
    for (const num of existingNumbers) {
      if (num === nextNumber) {
        nextNumber++;
      } else {
        break;
      }
    }

    return `${prefix}${nextNumber}`;
  }
}