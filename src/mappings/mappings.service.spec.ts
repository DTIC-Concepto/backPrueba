import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import { BadRequestException } from '@nestjs/common';
import { Sequelize } from 'sequelize-typescript';
import { MappingsService } from './mappings.service';
import { RaOppModel } from './models/ra-opp.model';
import { RaEuraceModel } from './models/ra-eurace.model';
import { ResultadoAprendizajeModel, TipoRA } from '../resultados-aprendizaje/models/resultado-aprendizaje.model';
import { OppModel } from '../opp/models/opp.model';
import { CarreraModel } from '../carreras/models/carrera.model';
import { EurAceModel } from '../eur-ace/models/eur-ace.model';
import { CreateBatchRaOppMappingsDto } from './dto/create-ra-opp-mapping.dto';

describe('MappingsService', () => {
  let service: MappingsService;
  let raOppModel: typeof RaOppModel;
  let raModel: typeof ResultadoAprendizajeModel;
  let oppModel: typeof OppModel;
  let sequelize: Sequelize;

  // Mock data
  const mockCarrera = {
    id: 1,
    nombre: 'Ingeniería en Sistemas',
    codigo: 'ISIN',
    facultadId: 1,
  };

  const mockOpp = {
    id: 1,
    codigo: 'OPP1',
    descripcion: 'Aplicar metodologías ágiles en la gestión de proyectos',
    carreraId: 1,
    carrera: mockCarrera,
  };

  const mockRA = {
    id: 1,
    codigo: 'RA1',
    descripcion: 'Diseñar sistemas de software escalables',
    tipo: TipoRA.ESPECIFICO,
    carreraId: 1,
    carrera: mockCarrera,
  };

  const mockRaOppMapping = {
    id: 1,
    resultadoAprendizajeId: 1,
    oppId: 1,
    justificacion: 'Este RA contribuye directamente al OPP mediante competencias técnicas',
    estadoActivo: true,
  };

  // Mock implementations
  const mockRaOppRepository = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    findByPk: jest.fn(),
  };

  const mockRaRepository = {
    findByPk: jest.fn(),
    findAll: jest.fn(),
    count: jest.fn(),
  };

  const mockOppRepository = {
    findByPk: jest.fn(),
    findAll: jest.fn(),
    count: jest.fn(),
  };

  const mockSequelize = {
    transaction: jest.fn(),
    getQueryInterface: jest.fn().mockReturnValue({
      sequelize: {
        Op: { notIn: Symbol('notIn') },
      },
    }),
    literal: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MappingsService,
        {
          provide: getModelToken(RaOppModel),
          useValue: mockRaOppRepository,
        },
        {
          provide: getModelToken(RaEuraceModel),
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            destroy: jest.fn(),
          },
        },
        {
          provide: getModelToken(ResultadoAprendizajeModel),
          useValue: mockRaRepository,
        },
        {
          provide: getModelToken(OppModel),
          useValue: mockOppRepository,
        },
        {
          provide: getModelToken(EurAceModel),
          useValue: {
            findByPk: jest.fn(),
            findAll: jest.fn(),
          },
        },
        {
          provide: Sequelize,
          useValue: mockSequelize,
        },
      ],
    }).compile();

    service = module.get<MappingsService>(MappingsService);
    raOppModel = module.get<typeof RaOppModel>(getModelToken(RaOppModel));
    raModel = module.get<typeof ResultadoAprendizajeModel>(getModelToken(ResultadoAprendizajeModel));
    oppModel = module.get<typeof OppModel>(getModelToken(OppModel));
    sequelize = module.get<Sequelize>(Sequelize);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createBatchRaOppMappings', () => {
    const mockTransaction = {
      commit: jest.fn(),
      rollback: jest.fn(),
    };

    beforeEach(() => {
      mockSequelize.transaction.mockResolvedValue(mockTransaction);
    });

    it('should create batch mappings successfully', async () => {
      // Arrange
      const dto: CreateBatchRaOppMappingsDto = {
        mappings: [
          {
            resultadoAprendizajeId: 1,
            oppId: 1,
            justificacion: 'Justificación válida de más de 10 caracteres',
          },
        ],
      };

      mockRaRepository.findByPk.mockResolvedValue(mockRA);
      mockOppRepository.findByPk.mockResolvedValue(mockOpp);
      mockRaOppRepository.findOne.mockResolvedValue(null); // No duplicado
      mockRaOppRepository.create.mockResolvedValue({ id: 15, ...dto.mappings[0] });

      // Act
      const result = await service.createBatchRaOppMappings(dto);

      // Assert
      expect(result.totalSolicitadas).toBe(1);
      expect(result.exitosas).toBe(1);
      expect(result.fallidas).toBe(0);
      expect(result.errores).toEqual([]);
      expect(result.relacionesCreadas).toEqual([15]);
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    it('should handle RA not found error', async () => {
      // Arrange
      const dto: CreateBatchRaOppMappingsDto = {
        mappings: [
          {
            resultadoAprendizajeId: 999,
            oppId: 1,
            justificacion: 'Justificación válida',
          },
        ],
      };

      mockRaRepository.findByPk.mockResolvedValue(null); // RA no encontrado

      // Act
      const result = await service.createBatchRaOppMappings(dto);

      // Assert
      expect(result.totalSolicitadas).toBe(1);
      expect(result.exitosas).toBe(0);
      expect(result.fallidas).toBe(1);
      expect(result.errores).toContain('El Resultado de Aprendizaje con ID 999 no existe');
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    it('should handle OPP not found error', async () => {
      // Arrange
      const dto: CreateBatchRaOppMappingsDto = {
        mappings: [
          {
            resultadoAprendizajeId: 1,
            oppId: 999,
            justificacion: 'Justificación válida',
          },
        ],
      };

      mockRaRepository.findByPk.mockResolvedValue(mockRA);
      mockOppRepository.findByPk.mockResolvedValue(null); // OPP no encontrado

      // Act
      const result = await service.createBatchRaOppMappings(dto);

      // Assert
      expect(result.exitosas).toBe(0);
      expect(result.fallidas).toBe(1);
      expect(result.errores).toContain('El OPP con ID 999 no existe');
    });

    it('should handle different carrera error', async () => {
      // Arrange
      const dto: CreateBatchRaOppMappingsDto = {
        mappings: [
          {
            resultadoAprendizajeId: 1,
            oppId: 1,
            justificacion: 'Justificación válida',
          },
        ],
      };

      const oppDifferentCarrera = { ...mockOpp, carreraId: 2 };
      mockRaRepository.findByPk.mockResolvedValue(mockRA);
      mockOppRepository.findByPk.mockResolvedValue(oppDifferentCarrera);

      // Act
      const result = await service.createBatchRaOppMappings(dto);

      // Assert
      expect(result.exitosas).toBe(0);
      expect(result.fallidas).toBe(1);
      expect(result.errores).toContain(
        'El RA (ID: 1) y el OPP (ID: 1) no pertenecen a la misma carrera'
      );
    });

    it('should handle duplicate mapping error', async () => {
      // Arrange
      const dto: CreateBatchRaOppMappingsDto = {
        mappings: [
          {
            resultadoAprendizajeId: 1,
            oppId: 1,
            justificacion: 'Justificación válida',
          },
        ],
      };

      mockRaRepository.findByPk.mockResolvedValue(mockRA);
      mockOppRepository.findByPk.mockResolvedValue(mockOpp);
      mockRaOppRepository.findOne.mockResolvedValue(mockRaOppMapping); // Ya existe

      // Act
      const result = await service.createBatchRaOppMappings(dto);

      // Assert
      expect(result.exitosas).toBe(0);
      expect(result.fallidas).toBe(1);
      expect(result.errores).toContain('Ya existe una relación entre el RA 1 y el OPP 1');
    });

    it('should handle database errors gracefully', async () => {
      // Arrange
      const dto: CreateBatchRaOppMappingsDto = {
        mappings: [
          {
            resultadoAprendizajeId: 1,
            oppId: 1,
            justificacion: 'Justificación válida',
          },
        ],
      };

      mockRaRepository.findByPk.mockRejectedValue(new Error('Database connection failed'));

      // Act
      const result = await service.createBatchRaOppMappings(dto);

      // Assert - El servicio maneja el error y retorna resultado
      expect(result.totalSolicitadas).toBe(1);
      expect(result.fallidas).toBe(1);
      expect(result.errores.length).toBeGreaterThan(0);
      expect(result.errores[0]).toContain('Database connection failed');
    });
  });

  describe('getAvailableRAsForOpp', () => {
    it('should return available RAs for OPP', async () => {
      // Arrange
      const oppId = 1;
      const tipo = TipoRA.ESPECIFICO;
      const mappedRaIds = [2, 3]; // RAs ya relacionados

      mockOppRepository.findByPk.mockResolvedValue(mockOpp);
      mockRaOppRepository.findAll.mockResolvedValue(
        mappedRaIds.map(id => ({ resultadoAprendizajeId: id }))
      );
      mockRaRepository.findAll.mockResolvedValue([mockRA]);

      // Act
      const result = await service.getAvailableRAsForOpp(oppId, tipo);

      // Assert
      expect(result).toEqual([mockRA]);
      expect(mockOppRepository.findByPk).toHaveBeenCalledWith(oppId, {
        include: [{ model: CarreraModel, as: 'carrera' }],
      });
      expect(mockRaRepository.findAll).toHaveBeenCalledWith({
        where: {
          carreraId: 1,
          tipo: TipoRA.ESPECIFICO,
          id: expect.objectContaining({
            [Symbol.for('notIn')]: mappedRaIds
          }),
        },
        include: [{ model: CarreraModel, as: 'carrera' }],
        order: [['codigo', 'ASC']],
      });
    });

    it('should throw error if OPP not found', async () => {
      // Arrange
      const oppId = 999;
      mockOppRepository.findByPk.mockResolvedValue(null);

      // Act & Assert
      await expect(service.getAvailableRAsForOpp(oppId)).rejects.toThrow(
        BadRequestException
      );
      expect(mockOppRepository.findByPk).toHaveBeenCalledWith(oppId, {
        include: [{ model: CarreraModel, as: 'carrera' }],
      });
    });

    it('should return all RAs when no mappings exist', async () => {
      // Arrange
      const oppId = 1;
      mockOppRepository.findByPk.mockResolvedValue(mockOpp);
      mockRaOppRepository.findAll.mockResolvedValue([]); // Sin mappings
      mockRaRepository.findAll.mockResolvedValue([mockRA]);

      // Act
      const result = await service.getAvailableRAsForOpp(oppId);

      // Assert
      expect(result).toEqual([mockRA]);
      expect(mockRaRepository.findAll).toHaveBeenCalledWith({
        where: { carreraId: 1 },
        include: [{ model: CarreraModel, as: 'carrera' }],
        order: [['codigo', 'ASC']],
      });
    });
  });

  describe('validateRaOppExistence', () => {
    it('should validate RA and OPP existence with same carrera', async () => {
      // Arrange
      const raId = 1;
      const oppId = 1;

      mockRaRepository.findByPk.mockResolvedValue(mockRA);
      mockOppRepository.findByPk.mockResolvedValue(mockOpp);

      // Act
      const result = await service.validateRaOppExistence(raId, oppId);

      // Assert
      expect(result.ra).toEqual(mockRA);
      expect(result.opp).toEqual(mockOpp);
      expect(result.sameCarrera).toBe(true);
    });

    it('should return false for same carrera when different carreras', async () => {
      // Arrange
      const raId = 1;
      const oppId = 1;
      const oppDifferentCarrera = { ...mockOpp, carreraId: 2 };

      mockRaRepository.findByPk.mockResolvedValue(mockRA);
      mockOppRepository.findByPk.mockResolvedValue(oppDifferentCarrera);

      // Act
      const result = await service.validateRaOppExistence(raId, oppId);

      // Assert
      expect(result.ra).toEqual(mockRA);
      expect(result.opp).toEqual(oppDifferentCarrera);
      expect(result.sameCarrera).toBe(false);
    });

    it('should handle non-existent RA or OPP', async () => {
      // Arrange
      const raId = 999;
      const oppId = 999;

      mockRaRepository.findByPk.mockResolvedValue(null);
      mockOppRepository.findByPk.mockResolvedValue(null);

      // Act
      const result = await service.validateRaOppExistence(raId, oppId);

      // Assert
      expect(result.ra).toBeNull();
      expect(result.opp).toBeNull();
      expect(result.sameCarrera).toBe(false);
    });
  });

  describe('findAllRaOppMappings', () => {
    it('should return all mappings with filters', async () => {
      // Arrange
      const filters = {
        resultadoAprendizajeId: 1,
        oppId: 1,
        estadoActivo: true,
      };

      const expectedMappings = [mockRaOppMapping];
      mockRaOppRepository.findAll.mockResolvedValue(expectedMappings);

      // Act
      const result = await service.findAllRaOppMappings(filters);

      // Assert
      expect(result).toEqual(expectedMappings);
      expect(mockRaOppRepository.findAll).toHaveBeenCalledWith({
        where: filters,
        include: [
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
        ],
        order: [['createdAt', 'DESC']],
      });
    });
  });

  describe('deleteRaOppMapping', () => {
    it('should delete mapping successfully', async () => {
      // Arrange
      const mappingId = 1;
      const mockMapping = {
        id: mappingId,
        destroy: jest.fn().mockResolvedValue(undefined),
      };

      mockRaOppRepository.findByPk.mockResolvedValue(mockMapping);

      // Act
      await service.deleteRaOppMapping(mappingId);

      // Assert
      expect(mockRaOppRepository.findByPk).toHaveBeenCalledWith(mappingId);
      expect(mockMapping.destroy).toHaveBeenCalled();
    });

    it('should throw error if mapping not found', async () => {
      // Arrange
      const mappingId = 999;
      mockRaOppRepository.findByPk.mockResolvedValue(null);

      // Act & Assert
      await expect(service.deleteRaOppMapping(mappingId)).rejects.toThrow(
        BadRequestException
      );
    });
  });
});