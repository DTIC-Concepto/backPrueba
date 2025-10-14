import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { RaOppModel } from './models/ra-opp.model';
import { RaEuraceModel } from './models/ra-eurace.model';
import { ResultadoAprendizajeModel, TipoRA } from '../resultados-aprendizaje/models/resultado-aprendizaje.model';
import { OppModel } from '../opp/models/opp.model';
import { EurAceModel } from '../eur-ace/models/eur-ace.model';
import { CarreraModel } from '../carreras/models/carrera.model';
import {
  CreateBatchRaOppMappingsDto,
  FilterRaOppMappingsDto,
  BatchOperationResultDto,
  CreateRaOppMappingDto,
} from './dto/create-ra-opp-mapping.dto';
import {
  CreateBatchRaEuraceMappingsDto,
  FilterRaEuraceMappingsDto,
  BatchRaEuraceOperationResultDto,
} from './dto/create-ra-eurace-mapping.dto';
import { Transaction, Op } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';

@Injectable()
export class MappingsService {
  constructor(
    @InjectModel(RaOppModel)
    private readonly raOppModel: typeof RaOppModel,
    @InjectModel(RaEuraceModel)
    private readonly raEuraceModel: typeof RaEuraceModel,
    @InjectModel(ResultadoAprendizajeModel)
    private readonly resultadoAprendizajeModel: typeof ResultadoAprendizajeModel,
    @InjectModel(OppModel)
    private readonly oppModel: typeof OppModel,
    @InjectModel(EurAceModel)
    private readonly eurAceModel: typeof EurAceModel,
    private readonly sequelize: Sequelize,
  ) {}

  /**
   * Crear múltiples relaciones RA-OPP en lote con validaciones
   */
  async createBatchRaOppMappings(
    dto: CreateBatchRaOppMappingsDto,
  ): Promise<BatchOperationResultDto> {
    const result: BatchOperationResultDto = {
      totalSolicitadas: dto.mappings.length,
      exitosas: 0,
      fallidas: 0,
      errores: [],
      relacionesCreadas: [],
    };

    const transaction = await this.sequelize.transaction();

    try {
      for (const mapping of dto.mappings) {
        try {
          // Validar que el RA existe
          const ra = await this.resultadoAprendizajeModel.findByPk(
            mapping.resultadoAprendizajeId,
            { include: [{ model: CarreraModel, as: 'carrera' }] }
          );
          
          if (!ra) {
            result.errores.push(
              `El Resultado de Aprendizaje con ID ${mapping.resultadoAprendizajeId} no existe`
            );
            result.fallidas++;
            continue;
          }

          // Validar que el OPP existe
          const opp = await this.oppModel.findByPk(mapping.oppId, {
            include: [{ model: CarreraModel, as: 'carrera' }]
          });
          
          if (!opp) {
            result.errores.push(
              `El OPP con ID ${mapping.oppId} no existe`
            );
            result.fallidas++;
            continue;
          }

          // Validar que pertenecen a la misma carrera
          if (ra.carreraId !== opp.carreraId) {
            result.errores.push(
              `El RA (ID: ${mapping.resultadoAprendizajeId}) y el OPP (ID: ${mapping.oppId}) no pertenecen a la misma carrera`
            );
            result.fallidas++;
            continue;
          }

          // Validar que no existe duplicado
          const existingMapping = await this.raOppModel.findOne({
            where: {
              resultadoAprendizajeId: mapping.resultadoAprendizajeId,
              oppId: mapping.oppId,
            },
            transaction,
          });

          if (existingMapping) {
            result.errores.push(
              `Ya existe una relación entre el RA ${mapping.resultadoAprendizajeId} y el OPP ${mapping.oppId}`
            );
            result.fallidas++;
            continue;
          }

          // Crear la relación
          const newMapping = await this.raOppModel.create(
            {
              resultadoAprendizajeId: mapping.resultadoAprendizajeId,
              oppId: mapping.oppId,
              justificacion: mapping.justificacion,
              estadoActivo: true,
            },
            { transaction }
          );

          result.relacionesCreadas.push(newMapping.id);
          result.exitosas++;

        } catch (error) {
          result.errores.push(
            `Error procesando mapping RA ${mapping.resultadoAprendizajeId} - OPP ${mapping.oppId}: ${error.message}`
          );
          result.fallidas++;
        }
      }

      await transaction.commit();
      return result;
      
    } catch (error) {
      await transaction.rollback();
      throw new BadRequestException(
        `Error en operación batch: ${error.message}`
      );
    }
  }

  /**
   * Obtener todas las relaciones RA-OPP con filtros
   */
  async findAllRaOppMappings(filters?: FilterRaOppMappingsDto): Promise<RaOppModel[]> {
    const whereConditions: any = {};
    const includeConditions: any[] = [
      {
        model: ResultadoAprendizajeModel,
        as: 'resultadoAprendizaje',
        include: [{ model: CarreraModel, as: 'carrera' }],
      },
      {
        model: OppModel,
        as: 'opp',
        include: [{ model: CarreraModel, as: 'carrera' }],
      },
    ];

    // Aplicar filtros directos
    if (filters?.resultadoAprendizajeId) {
      whereConditions.resultadoAprendizajeId = filters.resultadoAprendizajeId;
    }

    if (filters?.oppId) {
      whereConditions.oppId = filters.oppId;
    }

    if (filters?.estadoActivo !== undefined) {
      whereConditions.estadoActivo = filters.estadoActivo;
    }

    return await this.raOppModel.findAll({
      where: whereConditions,
      include: includeConditions,
      order: [['createdAt', 'DESC']],
    });
  }

  /**
   * Obtener relaciones por carrera
   */
  async findMappingsByCarrera(carreraId: number): Promise<RaOppModel[]> {
    return await this.raOppModel.findAll({
      include: [
        {
          model: ResultadoAprendizajeModel,
          as: 'resultadoAprendizaje',
          where: { carreraId },
          include: [{ model: CarreraModel, as: 'carrera' }],
        },
        {
          model: OppModel,
          as: 'opp',
          where: { carreraId },
          include: [{ model: CarreraModel, as: 'carrera' }],
        },
      ],
      order: [['createdAt', 'DESC']],
    });
  }

  /**
   * Validar existencia de RA y OPP para endpoints adaptadores
   */
  async validateRaOppExistence(raId: number, oppId: number): Promise<{
    ra: ResultadoAprendizajeModel | null;
    opp: OppModel | null;
    sameCarrera: boolean;
  }> {
    const [ra, opp] = await Promise.all([
      this.resultadoAprendizajeModel.findByPk(raId, {
        include: [{ model: CarreraModel, as: 'carrera' }],
      }),
      this.oppModel.findByPk(oppId, {
        include: [{ model: CarreraModel, as: 'carrera' }],
      }),
    ]);

    const sameCarrera = ra && opp ? ra.carreraId === opp.carreraId : false;

    return { ra, opp, sameCarrera };
  }

  /**
   * Eliminar una relación RA-OPP
   */
  async deleteRaOppMapping(id: number): Promise<void> {
    const mapping = await this.raOppModel.findByPk(id);
    
    if (!mapping) {
      throw new BadRequestException(`La relación con ID ${id} no existe`);
    }

    await mapping.destroy();
  }

  /**
   * Obtener RAs disponibles (sin relación) para un OPP específico
   * Usado en el wizard para evitar duplicados
   */
  async getAvailableRAsForOpp(oppId: number, tipo?: TipoRA): Promise<ResultadoAprendizajeModel[]> {
    // Primero verificar que el OPP existe y obtener su carrera
    const opp = await this.oppModel.findByPk(oppId, {
      include: [{ model: CarreraModel, as: 'carrera' }],
    });

    if (!opp) {
      throw new BadRequestException(`El OPP con ID ${oppId} no existe`);
    }

    // Obtener IDs de RAs que ya tienen relación con este OPP
    const mappedRaIds = await this.raOppModel.findAll({
      where: { oppId },
      attributes: ['resultadoAprendizajeId'],
      raw: true,
    }).then(results => results.map(r => r.resultadoAprendizajeId));

    // Obtener RAs de la misma carrera que NO estén relacionados con este OPP
    const whereCondition: any = {
      carreraId: opp.carreraId, // Solo RAs de la misma carrera
    };

    // Filtrar por tipo si se especifica
    if (tipo) {
      whereCondition.tipo = tipo;
    }

    // Excluir RAs que ya tienen relación
    if (mappedRaIds.length > 0) {
      whereCondition.id = {
        [Op.notIn]: mappedRaIds,
      };
    }

    return await this.resultadoAprendizajeModel.findAll({
      where: whereCondition,
      include: [{ model: CarreraModel, as: 'carrera' }],
      order: [['codigo', 'ASC']],
    });
  }

  /**
   * Obtener OPPs disponibles (sin relación) para un RA específico
   * Endpoint simétrico por si lo necesitas
   */
  async getAvailableOppsForRa(raId: number): Promise<OppModel[]> {
    // Verificar que el RA existe y obtener su carrera
    const ra = await this.resultadoAprendizajeModel.findByPk(raId, {
      include: [{ model: CarreraModel, as: 'carrera' }],
    });

    if (!ra) {
      throw new BadRequestException(`El RA con ID ${raId} no existe`);
    }

    // Obtener IDs de OPPs que ya tienen relación con este RA
    const mappedOppIds = await this.raOppModel.findAll({
      where: { resultadoAprendizajeId: raId },
      attributes: ['oppId'],
      raw: true,
    }).then(results => results.map(r => r.oppId));

    // Obtener OPPs de la misma carrera que NO estén relacionados con este RA
    const whereCondition: any = {
      carreraId: ra.carreraId, // Solo OPPs de la misma carrera
    };

    // Excluir OPPs que ya tienen relación
    if (mappedOppIds.length > 0) {
      whereCondition.id = {
        [Op.notIn]: mappedOppIds,
      };
    }

    return await this.oppModel.findAll({
      where: whereCondition,
      include: [{ model: CarreraModel, as: 'carrera' }],
      order: [['codigo', 'ASC']],
    });
  }

  /**
   * Obtener estadísticas de mappings por carrera
   */
  async getMappingStatsByCarrera(carreraId: number): Promise<{
    totalRAs: number;
    totalOPPs: number;
    totalMappings: number;
    rasSinMappings: number;
    oppsSinMappings: number;
  }> {
    const [totalRAs, totalOPPs, totalMappings] = await Promise.all([
      this.resultadoAprendizajeModel.count({ where: { carreraId } }),
      this.oppModel.count({ where: { carreraId } }),
      this.raOppModel.count({
        include: [
          {
            model: ResultadoAprendizajeModel,
            as: 'resultadoAprendizaje',
            where: { carreraId },
          },
        ],
      }),
    ]);

    // Contar RAs sin mappings
    const rasSinMappings = await this.resultadoAprendizajeModel.count({
      where: { 
        carreraId,
        id: {
          [Op.notIn]: this.sequelize.literal(
            `(SELECT DISTINCT resultado_aprendizaje_id FROM ra_opp WHERE resultado_aprendizaje_id IS NOT NULL)`
          ),
        },
      },
    });

    // Contar OPPs sin mappings  
    const oppsSinMappings = await this.oppModel.count({
      where: {
        carreraId,
        id: {
          [Op.notIn]: this.sequelize.literal(
            `(SELECT DISTINCT opp_id FROM ra_opp WHERE opp_id IS NOT NULL)`
          ),
        },
      },
    });

    return {
      totalRAs,
      totalOPPs,
      totalMappings,
      rasSinMappings,
      oppsSinMappings,
    };
  }

  /**
   * Obtener matriz completa OPP-RA para visualización
   */
  async getOppRaMatrix(programId: number, filters?: { raType?: string; activeOnly?: boolean }) {
    // Verificar que el programa existe
    const carrera = await CarreraModel.findByPk(programId);
    if (!carrera) {
      throw new BadRequestException(`No se encontró la carrera con ID ${programId}`);
    }

    // Obtener todos los OPPs del programa
    const opps = await this.oppModel.findAll({
      where: { carreraId: programId },
      order: [['codigo', 'ASC']],
    });

    // Construir filtros para RAs
    const raWhereConditions: any = { carreraId: programId };
    if (filters?.raType) {
      raWhereConditions.tipo = filters.raType;
    }

    // Obtener todos los RAs del programa
    const ras = await this.resultadoAprendizajeModel.findAll({
      where: raWhereConditions,
      order: [['codigo', 'ASC']],
    });

    // Obtener todos los mappings existentes
    const existingMappings = await this.raOppModel.findAll({
      include: [
        {
          model: ResultadoAprendizajeModel,
          as: 'resultadoAprendizaje',
          where: { carreraId: programId },
          required: true,
        },
        {
          model: OppModel,
          as: 'opp',
          required: true,
        },
      ],
    });

    // Construir matriz de mapeos
    const mappings: any[] = [];
    for (const opp of opps) {
      for (const ra of ras) {
        const existingMapping = existingMappings.find(
          (m) => m.oppId === opp.id && m.resultadoAprendizajeId === ra.id
        );

        mappings.push({
          oppId: opp.id,
          raId: ra.id,
          hasMaping: !!existingMapping,
          mappingId: existingMapping?.id,
          justification: existingMapping?.justificacion,
        });
      }
    }

    // Calcular estadísticas
    const totalMappings = existingMappings.length;
    const maxPossibleMappings = opps.length * ras.length;
    const coveragePercentage = maxPossibleMappings > 0 
      ? Number(((totalMappings / maxPossibleMappings) * 100).toFixed(2))
      : 0;

    return {
      opps: opps.map(opp => ({
        id: opp.id,
        code: opp.codigo,
        name: opp.descripcion, // Usando descripción como name
        description: opp.descripcion,
        active: true, // Todos los elementos recuperados están activos por defecto
      })),
      ras: ras.map(ra => ({
        id: ra.id,
        code: ra.codigo,
        name: ra.descripcion, // Usando descripción como name
        description: ra.descripcion,
        active: true, // Todos los elementos recuperados están activos por defecto
        type: ra.tipo,
      })),
      mappings,
      programId: programId,
      programName: carrera.nombre,
      stats: {
        totalOpps: opps.length,
        totalRas: ras.length,
        totalMappings,
        coveragePercentage,
      },
    };
  }

  /**
   * Obtener catálogo de OPPs por programa
   */
  async getProgramOppsCatalog(programId: number, lang?: string) {
    // Verificar que el programa existe
    const carrera = await CarreraModel.findByPk(programId);
    if (!carrera) {
      throw new BadRequestException(`No se encontró la carrera con ID ${programId}`);
    }

    const opps = await this.oppModel.findAll({
      where: { 
        carreraId: programId,
      },
      order: [['codigo', 'ASC']],
    });

    return {
      opps: opps.map(opp => ({
        id: opp.id,
        code: opp.codigo,
        name: opp.descripcion, // Usando descripción como name
        description: opp.descripcion,
        active: true, // Todos los OPPs están activos por defecto
      })),
      programId: programId,
      programName: carrera.nombre,
      totalOpps: opps.length,
    };
  }

  /**
   * Obtener catálogo de RAs por programa
   */
  async getProgramRasCatalog(programId: number, lang?: string) {
    // Verificar que el programa existe
    const carrera = await CarreraModel.findByPk(programId);
    if (!carrera) {
      throw new BadRequestException(`No se encontró la carrera con ID ${programId}`);
    }

    const ras = await this.resultadoAprendizajeModel.findAll({
      where: { 
        carreraId: programId,
      },
      order: [['codigo', 'ASC']],
    });

    // Calcular distribución por tipo
    const distributionByType = {
      GENERAL: ras.filter(ra => ra.tipo === TipoRA.GENERAL).length,
      ESPECIFICO: ras.filter(ra => ra.tipo === TipoRA.ESPECIFICO).length,
    };

    return {
      learningOutcomes: ras.map(ra => ({
        id: ra.id,
        code: ra.codigo,
        name: ra.descripcion, // Usando descripción como name
        description: ra.descripcion,
        active: true, // Todos los RAs están activos por defecto
        type: ra.tipo,
      })),
      programId: programId,
      programName: carrera.nombre,
      totalLearningOutcomes: ras.length,
      distributionByType,
    };
  }

  // ==================== MÉTODOS RA-EURACE HU7769 ====================

  /**
   * Crear múltiples relaciones RA-EURACE en lote con validaciones
   * HU7769 - Task 7861
   */
  async createBatchRaEuraceMappings(
    dto: CreateBatchRaEuraceMappingsDto,
  ): Promise<BatchRaEuraceOperationResultDto> {
    const result: BatchRaEuraceOperationResultDto = {
      totalSolicitadas: dto.mappings.length,
      exitosas: 0,
      fallidas: 0,
      errores: [],
      relacionesCreadas: [],
    };

    // Usar transacción para garantizar consistencia
    const transaction = await this.sequelize.transaction();

    try {
      for (const mapping of dto.mappings) {
        try {
          // Validar que el RA existe
          const ra = await this.resultadoAprendizajeModel.findByPk(
            mapping.resultadoAprendizajeId,
            { transaction }
          );
          if (!ra) {
            result.errores.push(
              `El Resultado de Aprendizaje con ID ${mapping.resultadoAprendizajeId} no existe`
            );
            result.fallidas++;
            continue;
          }

          // Validar que el criterio EUR-ACE existe
          const eurAce = await this.eurAceModel.findByPk(
            mapping.eurAceId,
            { transaction }
          );
          if (!eurAce) {
            result.errores.push(
              `El criterio EUR-ACE con ID ${mapping.eurAceId} no existe`
            );
            result.fallidas++;
            continue;
          }

          // Verificar si ya existe la relación (evitar duplicados - Task 7869)
          const existingMapping = await this.raEuraceModel.findOne({
            where: {
              resultadoAprendizajeId: mapping.resultadoAprendizajeId,
              eurAceId: mapping.eurAceId,
            },
            transaction,
          });

          if (existingMapping) {
            result.errores.push(
              `Ya existe una relación entre el RA ID ${mapping.resultadoAprendizajeId} y el criterio EUR-ACE ID ${mapping.eurAceId}`
            );
            result.fallidas++;
            continue;
          }

          // Crear la relación
          const newMapping = await this.raEuraceModel.create(
            {
              resultadoAprendizajeId: mapping.resultadoAprendizajeId,
              eurAceId: mapping.eurAceId,
              justificacion: mapping.justificacion,
              estadoActivo: true,
            } as any,
            { transaction }
          );

          result.relacionesCreadas.push(newMapping.id);
          result.exitosas++;
        } catch (error) {
          result.errores.push(
            `Error al crear relación: ${error.message}`
          );
          result.fallidas++;
        }
      }

      await transaction.commit();
      return result;
    } catch (error) {
      await transaction.rollback();
      throw new BadRequestException(
        'Error en la operación batch de mapeo RA-EURACE'
      );
    }
  }

  /**
   * Obtener todas las relaciones RA-EURACE con filtros
   * HU7769 - Task 7864
   */
  async findAllRaEuraceMappings(
    filters: FilterRaEuraceMappingsDto,
  ): Promise<RaEuraceModel[]> {
    const whereClause: any = {};

    if (filters.resultadoAprendizajeId) {
      whereClause.resultadoAprendizajeId = filters.resultadoAprendizajeId;
    }

    if (filters.eurAceId) {
      whereClause.eurAceId = filters.eurAceId;
    }

    if (filters.estadoActivo !== undefined) {
      whereClause.estadoActivo = filters.estadoActivo;
    }

    let includeWhere = {};
    if (filters.carreraId) {
      includeWhere = {
        where: { carreraId: filters.carreraId },
      };
    }

    return this.raEuraceModel.findAll({
      where: whereClause,
      include: [
        {
          model: ResultadoAprendizajeModel,
          as: 'resultadoAprendizaje',
          include: [
            {
              model: CarreraModel,
              as: 'carrera',
            },
          ],
          ...includeWhere,
        },
        {
          model: EurAceModel,
          as: 'eurAce',
        },
      ],
      order: [['createdAt', 'DESC']],
    });
  }

  /**
   * Obtener RAs disponibles para un criterio EUR-ACE específico
   * HU7769 - Task 7864 - Paso 2 del asistente
   */
  async getAvailableRAsForEurAce(
    eurAceId: number,
    tipo?: TipoRA,
    carreraId?: number,
  ): Promise<ResultadoAprendizajeModel[]> {
    // Verificar que el criterio EUR-ACE existe
    const eurAce = await this.eurAceModel.findByPk(eurAceId);
    if (!eurAce) {
      throw new BadRequestException('Criterio EUR-ACE no encontrado');
    }

    // Obtener IDs de RAs que YA tienen relación con este criterio EUR-ACE
    const mappedRaIds = await this.raEuraceModel.findAll({
      where: { eurAceId },
      attributes: ['resultadoAprendizajeId'],
    }).then(mappings => mappings.map(m => m.resultadoAprendizajeId));

    // Construir filtros para RAs disponibles
    const whereClause: any = {
      id: {
        [Op.notIn]: mappedRaIds, // Excluir RAs ya relacionados
      },
    };

    if (tipo) {
      whereClause.tipo = tipo;
    }

    if (carreraId) {
      whereClause.carreraId = carreraId;
    }

    return this.resultadoAprendizajeModel.findAll({
      where: whereClause,
      include: [
        {
          model: CarreraModel,
          as: 'carrera',
        },
      ],
      order: [['carreraId', 'ASC'], ['tipo', 'ASC'], ['codigo', 'ASC']],
    });
  }

  /**
   * Eliminar una relación RA-EURACE específica
   */
  async deleteRaEuraceMapping(id: number): Promise<void> {
    const mapping = await this.raEuraceModel.findByPk(id);
    if (!mapping) {
      throw new BadRequestException('Relación RA-EURACE no encontrada');
    }

    await mapping.destroy();
  }

  /**
   * HU7758 - Task 7866: Obtener matriz completa RA-EURACE para visualización
   */
  async getRaEuraceMatrix(programId: number) {
    // Verificar que el programa existe
    const carrera = await CarreraModel.findByPk(programId);
    if (!carrera) {
      throw new BadRequestException(`No se encontró la carrera con ID ${programId}`);
    }

    // Obtener todos los RAs del programa
    const raWhereConditions: any = { carreraId: programId };

    // Obtener todos los RAs del programa
    const ras = await this.resultadoAprendizajeModel.findAll({
      where: raWhereConditions,
      order: [['codigo', 'ASC']],
    });

    // Obtener todos los criterios EUR-ACE
    const eurAceCriteria = await this.eurAceModel.findAll({
      order: [['codigo', 'ASC']],
    });

    // Obtener todos los mappings RA-EURACE existentes del programa
    const existingMappings = await this.raEuraceModel.findAll({
      include: [
        {
          model: ResultadoAprendizajeModel,
          as: 'resultadoAprendizaje',
          where: { carreraId: programId },
          required: true,
        },
        {
          model: this.eurAceModel,
          as: 'eurAce',
          required: true,
        },
      ],
    });

    // Construir matriz de mapeos RA-EURACE
    const mappings: any[] = [];
    for (const ra of ras) {
      for (const eurAce of eurAceCriteria) {
        const existingMapping = existingMappings.find(
          (m) => m.resultadoAprendizajeId === ra.id && m.eurAceId === eurAce.id
        );

        mappings.push({
          raId: ra.id,
          eurAceId: eurAce.id,
          hasMapping: !!existingMapping,
          mappingId: existingMapping?.id,
          justification: existingMapping?.justificacion,
        });
      }
    }

    // Calcular estadísticas
    const totalMappings = existingMappings.length;
    const maxPossibleMappings = ras.length * eurAceCriteria.length;
    const coveragePercentage = maxPossibleMappings > 0 
      ? Number(((totalMappings / maxPossibleMappings) * 100).toFixed(2))
      : 0;

    return {
      ras: ras.map(ra => ({
        id: ra.id,
        code: ra.codigo,
        name: ra.descripcion,
        description: ra.descripcion,
        active: true, // Los RAs recuperados están activos por defecto
        type: ra.tipo,
      })),
      eurAceCriteria: eurAceCriteria.map(criteria => ({
        id: criteria.id,
        code: criteria.codigo,
        name: criteria.descripcion, // Usando descripcion como name
        description: criteria.descripcion,
        active: true, // Los criterios EUR-ACE recuperados están activos por defecto
      })),
      mappings,
      programId: programId,
      programName: carrera.nombre,
      stats: {
        totalRas: ras.length,
        totalEurAceCriteria: eurAceCriteria.length,
        totalMappings,
        coveragePercentage,
      },
    };
  }
}