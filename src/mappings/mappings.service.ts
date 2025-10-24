import { Injectable, BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { RaOppModel } from './models/ra-opp.model';
import { RaEuraceModel } from './models/ra-eurace.model';
import { RaaRaModel } from './models/raa-ra.model';
import { ResultadoAprendizajeModel, TipoRA } from '../resultados-aprendizaje/models/resultado-aprendizaje.model';
import { OppModel } from '../opp/models/opp.model';
import { EurAceModel } from '../eur-ace/models/eur-ace.model';
import { RaaModel } from '../raa/models/raa.model';
import { CarreraAsignaturaModel } from '../asignaturas/models/carrera-asignatura.model';
import { AsignaturaModel } from '../asignaturas/models/asignatura.model';
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
import {
  CreateBatchRaaRaMappingsDto,
} from './dto/create-batch-raa-ra-mappings.dto';
import { CreateRaaRaMappingDto } from './dto/create-raa-ra-mapping.dto';
import { UpdateRaaRaMappingDto } from './dto/update-raa-ra-mapping.dto';
import { FilterRaaRaMappingsDto } from './dto/filter-raa-ra-mappings.dto';
import { BatchRaaRaOperationResultDto } from './dto/batch-raa-ra-operation-result.dto';
import { Transaction, Op } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';

@Injectable()
export class MappingsService {
  constructor(
    @InjectModel(RaOppModel)
    private readonly raOppModel: typeof RaOppModel,
    @InjectModel(RaEuraceModel)
    private readonly raEuraceModel: typeof RaEuraceModel,
    @InjectModel(RaaRaModel)
    private readonly raaRaModel: typeof RaaRaModel,
    @InjectModel(ResultadoAprendizajeModel)
    private readonly resultadoAprendizajeModel: typeof ResultadoAprendizajeModel,
    @InjectModel(OppModel)
    private readonly oppModel: typeof OppModel,
    @InjectModel(EurAceModel)
    private readonly eurAceModel: typeof EurAceModel,
    @InjectModel(RaaModel)
    private readonly raaModel: typeof RaaModel,
    @InjectModel(CarreraAsignaturaModel)
    private readonly carreraAsignaturaModel: typeof CarreraAsignaturaModel,
    @InjectModel(AsignaturaModel)
    private readonly asignaturaModel: typeof AsignaturaModel,
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

  // ==================== MÉTODOS RAA-RA HU8084 ====================

  /**
   * Crear una relación RAA-RA individual con validaciones
   * HU8084 - Vincular RAA con RA
   */
  async createRaaRaMapping(
    dto: CreateRaaRaMappingDto,
  ): Promise<RaaRaModel> {
    // Validar que el RAA existe
    const raa = await this.raaModel.findByPk(dto.raaId);

    if (!raa) {
      throw new BadRequestException(`RAA con ID ${dto.raaId} no encontrado`);
    }

    // Validar que el RA existe
    const ra = await this.resultadoAprendizajeModel.findByPk(
      dto.resultadoAprendizajeId,
    );

    if (!ra) {
      throw new BadRequestException(
        `Resultado de Aprendizaje con ID ${dto.resultadoAprendizajeId} no encontrado`,
      );
    }

    // Verificar que no exista relación duplicada
    const existingMapping = await this.raaRaModel.findOne({
      where: {
        raaId: dto.raaId,
        resultadoAprendizajeId: dto.resultadoAprendizajeId,
      },
    });

    if (existingMapping) {
      throw new ConflictException(
        `Ya existe una relación entre RAA ID ${dto.raaId} y RA ID ${dto.resultadoAprendizajeId}`,
      );
    }

    // Crear la relación
    return await this.raaRaModel.create({
      raaId: dto.raaId,
      resultadoAprendizajeId: dto.resultadoAprendizajeId,
      nivelAporte: dto.nivelAporte,
      justificacion: dto.justificacion,
      estadoActivo: dto.estadoActivo ?? true,
    });
  }

  /**
   * Crear múltiples relaciones RAA-RA en lote con validaciones
   * HU8084 - Vincular RAA con RA
   */
  async createBatchRaaRaMappings(
    dto: CreateBatchRaaRaMappingsDto,
  ): Promise<BatchRaaRaOperationResultDto> {
    const result: BatchRaaRaOperationResultDto = {
      totalSolicitadas: dto.mappings.length,
      exitosas: 0,
      fallidas: 0,
      errores: [],
      relacionesCreadas: [],
    };

    const transaction: Transaction = await this.sequelize.transaction();

    try {
      for (const mapping of dto.mappings) {
        try {
          // Validar que el RAA existe y obtener su carreraAsignatura
          const raa = await this.raaModel.findByPk(mapping.raaId, {
            include: [
              {
                model: CarreraAsignaturaModel,
                as: 'carreraAsignatura',
                include: [
                  { model: AsignaturaModel },
                  { model: CarreraModel },
                ],
              },
            ],
            transaction,
          });

          if (!raa) {
            throw new BadRequestException(`RAA con ID ${mapping.raaId} no encontrado`);
          }

          // Validar que el RA existe y obtener su carrera
          const ra = await this.resultadoAprendizajeModel.findByPk(
            mapping.resultadoAprendizajeId,
            {
              include: [{ model: CarreraModel, as: 'carrera' }],
              transaction,
            },
          );

          if (!ra) {
            throw new BadRequestException(
              `Resultado de Aprendizaje con ID ${mapping.resultadoAprendizajeId} no encontrado`,
            );
          }

          // Validar que el RAA y el RA pertenecen a la misma carrera
          if (raa.carreraAsignatura.carreraId !== ra.carreraId) {
            throw new BadRequestException(
              `El RAA (carrera ID: ${raa.carreraAsignatura.carreraId}) y el RA (carrera ID: ${ra.carreraId}) no pertenecen a la misma carrera`,
            );
          }

          // Verificar que no exista relación duplicada
          const existingMapping = await this.raaRaModel.findOne({
            where: {
              raaId: mapping.raaId,
              resultadoAprendizajeId: mapping.resultadoAprendizajeId,
            },
            transaction,
          });

          if (existingMapping) {
            throw new ConflictException(
              `Ya existe una relación entre RAA ID ${mapping.raaId} y RA ID ${mapping.resultadoAprendizajeId}`,
            );
          }

          // Crear la relación
          const nuevaRelacion = await this.raaRaModel.create(
            {
              raaId: mapping.raaId,
              resultadoAprendizajeId: mapping.resultadoAprendizajeId,
              nivelAporte: mapping.nivelAporte,
              justificacion: mapping.justificacion,
              estadoActivo: mapping.estadoActivo ?? true,
            },
            { transaction },
          );

          result.relacionesCreadas.push(nuevaRelacion.id);
          result.exitosas++;
        } catch (error) {
          result.fallidas++;
          result.errores.push(
            error.message || `Error procesando relación RAA-RA`,
          );
        }
      }

      await transaction.commit();
      return result;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Obtener todas las relaciones RAA-RA con filtros
   */
  async findAllRaaRaMappings(
    filters: FilterRaaRaMappingsDto,
  ): Promise<RaaRaModel[]> {
    const whereConditions: any = {};
    const includeConditions: any[] = [
      {
        model: RaaModel,
        as: 'raa',
        include: [
          {
            model: CarreraAsignaturaModel,
            as: 'carreraAsignatura',
            include: [
              { model: AsignaturaModel },
              { model: CarreraModel },
            ],
          },
        ],
      },
      {
        model: ResultadoAprendizajeModel,
        as: 'resultadoAprendizaje',
        include: [{ model: CarreraModel, as: 'carrera' }],
      },
    ];

    // Filtros directos
    if (filters?.raaId) {
      whereConditions.raaId = filters.raaId;
    }

    if (filters?.resultadoAprendizajeId) {
      whereConditions.resultadoAprendizajeId = filters.resultadoAprendizajeId;
    }

    if (filters?.nivelAporte) {
      whereConditions.nivelAporte = filters.nivelAporte;
    }

    if (filters?.estadoActivo !== undefined) {
      whereConditions.estadoActivo = filters.estadoActivo;
    }

    // Filtros a través de relaciones
    if (filters?.asignaturaId) {
      includeConditions[0].include[0].where = {
        asignaturaId: filters.asignaturaId,
      };
      includeConditions[0].include[0].required = true;
      includeConditions[0].required = true;
    }

    if (filters?.carreraId) {
      includeConditions[0].include[0].where = {
        ...(includeConditions[0].include[0].where || {}),
        carreraId: filters.carreraId,
      };
      includeConditions[0].include[0].required = true;
      includeConditions[0].required = true;
    }

    return await this.raaRaModel.findAll({
      where: whereConditions,
      include: includeConditions,
      order: [['createdAt', 'DESC']],
    });
  }

  /**
   * Obtener RAs disponibles (sin relación) para un RAA específico
   * Paso 2 del asistente
   */
  async getAvailableRAsForRaa(
    raaId: number,
    carreraId: number,
    tipo?: TipoRA,
  ): Promise<ResultadoAprendizajeModel[]> {
    // Verificar que el RAA existe
    const raa = await this.raaModel.findByPk(raaId);

    if (!raa) {
      throw new NotFoundException(`RAA con ID ${raaId} no encontrado`);
    }

    // Obtener IDs de RAs que ya tienen relación con este RAA
    const mappedRaIds = await this.raaRaModel
      .findAll({
        where: { raaId },
        attributes: ['resultadoAprendizajeId'],
        raw: true,
      })
      .then((results) => results.map((r) => r.resultadoAprendizajeId));

    // Obtener RAs de la misma carrera que NO estén relacionados con este RAA
    const whereCondition: any = {
      carreraId,
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
   * Eliminar una relación RAA-RA específica
   */
  async deleteRaaRaMapping(id: number): Promise<void> {
    const mapping = await this.raaRaModel.findByPk(id);

    if (!mapping) {
      throw new NotFoundException(`Relación RAA-RA con ID ${id} no encontrada`);
    }

    await mapping.destroy();
  }

  /**
   * Actualizar una relación RAA-RA específica
   * HU8084 - Modificar mapeo RAA-RA
   */
  async updateRaaRaMapping(
    id: number,
    dto: UpdateRaaRaMappingDto,
  ): Promise<RaaRaModel> {
    const mapping = await this.raaRaModel.findByPk(id);

    if (!mapping) {
      throw new NotFoundException(`Relación RAA-RA con ID ${id} no encontrada`);
    }

    // Actualizar solo los campos proporcionados
    if (dto.nivelAporte !== undefined) {
      mapping.nivelAporte = dto.nivelAporte;
    }

    if (dto.justificacion !== undefined) {
      mapping.justificacion = dto.justificacion;
    }

    if (dto.estadoActivo !== undefined) {
      mapping.estadoActivo = dto.estadoActivo;
    }

    await mapping.save();

    return mapping;
  }

  /**
   * HU8084: Obtener matriz completa RAA-RA para visualización por asignatura
   */
  async getRaaRaMatrix(asignaturaId: number, carreraId: number) {
    // Verificar que la asignatura existe
    const asignatura = await this.asignaturaModel.findByPk(asignaturaId);
    if (!asignatura) {
      throw new NotFoundException(
        `Asignatura con ID ${asignaturaId} no encontrada`,
      );
    }

    // Verificar que la carrera existe
    const carrera = await CarreraModel.findByPk(carreraId);
    if (!carrera) {
      throw new NotFoundException(`Carrera con ID ${carreraId} no encontrada`);
    }

    // Verificar que existe la relación carrera-asignatura
    const carreraAsignatura = await this.carreraAsignaturaModel.findOne({
      where: {
        carreraId,
        asignaturaId,
      },
    });

    if (!carreraAsignatura) {
      throw new BadRequestException(
        `No existe relación entre la carrera ${carreraId} y la asignatura ${asignaturaId}`,
      );
    }

    // Obtener todos los RAAs de esta asignatura en esta carrera
    const raas = await this.raaModel.findAll({
      where: {
        carreraAsignaturaId: carreraAsignatura.id,
      },
      order: [['codigo', 'ASC']],
    });

    // Obtener todos los RAs de esta carrera
    const ras = await this.resultadoAprendizajeModel.findAll({
      where: { carreraId },
      include: [{ model: CarreraModel, as: 'carrera' }],
      order: [['codigo', 'ASC']],
    });

    // Obtener todos los mappings existentes
    const raaIds = raas.map((r) => r.id);
    const existingMappings = await this.raaRaModel.findAll({
      where: {
        raaId: { [Op.in]: raaIds },
      },
    });

    // Construir matriz de mappings
    const mappings: any[] = [];
    for (const raa of raas) {
      for (const ra of ras) {
        const existingMapping = existingMappings.find(
          (m) => m.raaId === raa.id && m.resultadoAprendizajeId === ra.id,
        );

        mappings.push({
          raaId: raa.id,
          raId: ra.id,
          hasMapping: !!existingMapping,
          mappingId: existingMapping?.id,
          nivelAporte: existingMapping?.nivelAporte,
          justification: existingMapping?.justificacion,
        });
      }
    }

    // Calcular estadísticas
    const totalMappings = existingMappings.length;
    const maxPossibleMappings = raas.length * ras.length;
    const coveragePercentage =
      maxPossibleMappings > 0
        ? Number(((totalMappings / maxPossibleMappings) * 100).toFixed(2))
        : 0;

    return {
      raas: raas.map((raa) => ({
        id: raa.id,
        code: raa.codigo,
        description: raa.descripcion,
        tipo: raa.tipo,
        active: raa.estadoActivo,
      })),
      ras: ras.map((ra) => ({
        id: ra.id,
        code: ra.codigo,
        name: ra.descripcion,
        type: ra.tipo,
        active: true,
      })),
      mappings,
      asignaturaId,
      asignaturaName: asignatura.nombre,
      carreraId,
      carreraName: carrera.nombre,
      stats: {
        totalRaas: raas.length,
        totalRas: ras.length,
        totalMappings,
        coveragePercentage,
      },
    };
  }
}