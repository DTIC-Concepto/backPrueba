import { Test, TestingModule } from '@nestjs/testing';
import { MappingsController } from './mappings.controller';
import { MappingsService } from './mappings.service';
import {
  CreateBatchRaOppMappingsDto,
  BatchOperationResultDto,
} from './dto/create-ra-opp-mapping.dto';
import { 
  CreateBatchRaEuraceMappingsDto,
  BatchRaEuraceOperationResultDto,
  FilterRaEuraceMappingsDto,
} from './dto/create-ra-eurace-mapping.dto';
import { TipoRA } from '../resultados-aprendizaje/models/resultado-aprendizaje.model';
import { OppRaMatrixResponseDto } from './dto/matrix-response.dto';
import { 
  ProgramOppsCatalogResponseDto,
  ProgramRasCatalogResponseDto 
} from './dto/catalog-response.dto';

describe('MappingsController', () => {
  let controller: MappingsController;
  let service: MappingsService;

  // Mock data
  const mockBatchResult: BatchOperationResultDto = {
    totalSolicitadas: 2,
    exitosas: 2,
    fallidas: 0,
    errores: [],
    relacionesCreadas: [15, 16],
  };

  const mockAvailableRAs = [
    {
      id: 1,
      codigo: 'RA1',
      descripcion: 'Diseñar sistemas escalables',
      tipo: TipoRA.ESPECIFICO,
      carreraId: 1,
    },
    {
      id: 2,
      codigo: 'RA2',
      descripcion: 'Implementar patrones de diseño',
      tipo: TipoRA.ESPECIFICO,
      carreraId: 1,
    },
  ];

  const mockValidationResult = {
    ra: { id: 1, codigo: 'RA1', carreraId: 1 },
    opp: { id: 1, codigo: 'OPP1', carreraId: 1 },
    sameCarrera: true,
  };

  const mockMappings = [
    {
      id: 1,
      resultadoAprendizajeId: 1,
      oppId: 1,
      justificacion: 'Justificación de mapeo',
      estadoActivo: true,
    },
  ];

  const mockStats = {
    totalRAs: 10,
    totalOPPs: 8,
    totalMappings: 15,
    rasSinMappings: 2,
    oppsSinMappings: 1,
  };

  // Mock data for HU7777 matrix visualization
  const mockMatrixResponse: OppRaMatrixResponseDto = {
    opps: [
      {
        id: 1,
        code: 'OPP001',
        name: 'Diseñar sistemas de software',
        description: 'Capacidad para diseñar sistemas escalables',
        active: true,
      },
    ],
    ras: [
      {
        id: 1,
        code: 'RA001',
        name: 'Aplicar metodologías ágiles',
        description: 'Conocimiento en metodologías ágiles',
        active: true,
        type: 'ESPECIFICO',
      },
    ],
    mappings: [
      {
        oppId: 1,
        raId: 1,
        hasMaping: true,
        mappingId: 15,
        justification: 'Contribuye al desarrollo de competencias técnicas',
      },
    ],
    programId: 1,
    programName: 'Ingeniería en Sistemas Computacionales',
    stats: {
      totalOpps: 1,
      totalRas: 1,
      totalMappings: 1,
      coveragePercentage: 100,
    },
  };

  const mockOppsCatalog: ProgramOppsCatalogResponseDto = {
    programId: 1,
    programName: 'Ingeniería en Sistemas Computacionales',
    totalOpps: 3,
    opps: [
      {
        id: 1,
        code: 'OPP001',
        name: 'Diseñar sistemas de software',
        description: 'Capacidad para diseñar sistemas escalables',
        active: true,
      },
    ],
  };

  const mockRasCatalog: ProgramRasCatalogResponseDto = {
    programId: 1,
    programName: 'Ingeniería en Sistemas Computacionales',
    totalLearningOutcomes: 3,
    learningOutcomes: [
      {
        id: 1,
        code: 'RA001',
        name: 'Aplicar metodologías ágiles',
        description: 'Conocimiento en metodologías ágiles',
        active: true,
        type: 'ESPECIFICO',
      },
    ],
    distributionByType: {
      GENERAL: 1,
      ESPECIFICO: 2,
    },
  };

  // HU7769 - RA-EURACE mock data
  const mockBatchRaEuraceResult: BatchRaEuraceOperationResultDto = {
    totalSolicitadas: 2,
    exitosas: 2,
    fallidas: 0,
    errores: [],
    relacionesCreadas: [1, 2],
  };

  const mockRaEuraceMappings = [
    {
      id: 1,
      resultadoAprendizajeId: 1,
      eurAceId: 1,
      justificacion: 'Este RA contribuye al criterio EUR-ACE de conocimiento técnico',
      createdAt: new Date('2024-01-15'),
      resultadoAprendizaje: {
        id: 1,
        code: 'RA001',
        name: 'Aplicar metodologías ágiles',
        type: 'ESPECIFICO',
      },
      eurAce: {
        id: 1,
        code: 'EA1.1',
        name: 'Conocimiento y comprensión',
        description: 'Conocimiento técnico especializado',
      },
    },
  ];

  const mockAvailableRAsForEurAce = [
    {
      id: 1,
      code: 'RA001',
      name: 'Aplicar metodologías ágiles',
      description: 'Conocimiento en metodologías ágiles',
      active: true,
      type: 'ESPECIFICO',
    },
    {
      id: 2,
      code: 'RA002',
      name: 'Desarrollar algoritmos eficientes',
      description: 'Capacidad de diseño algorítmico',
      active: true,
      type: 'GENERAL',
    },
  ];

  const mockService = {
    createBatchRaOppMappings: jest.fn(),
    findAllRaOppMappings: jest.fn(),
    findMappingsByCarrera: jest.fn(),
    getAvailableRAsForOpp: jest.fn(),
    getAvailableOppsForRa: jest.fn(),
    deleteRaOppMapping: jest.fn(),
    // HU7777 new methods
    getOppRaMatrix: jest.fn(),
    getProgramOppsCatalog: jest.fn(),
    getProgramRasCatalog: jest.fn(),
    // HU7769 - RA-EURACE methods
    createBatchRaEuraceMappings: jest.fn(),
    findAllRaEuraceMappings: jest.fn(),
    getAvailableRAsForEurAce: jest.fn(),
    deleteRaEuraceMapping: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MappingsController],
      providers: [
        {
          provide: MappingsService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<MappingsController>(MappingsController);
    service = module.get<MappingsService>(MappingsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createBatchRaOppMappings', () => {
    it('should create batch mappings successfully', async () => {
      // Arrange
      const dto: CreateBatchRaOppMappingsDto = {
        mappings: [
          {
            resultadoAprendizajeId: 1,
            oppId: 1,
            justificacion: 'Este RA contribuye al OPP mediante desarrollo de competencias técnicas',
          },
          {
            resultadoAprendizajeId: 2,
            oppId: 1,
            justificacion: 'Segundo mapeo con justificación válida',
          },
        ],
      };

      mockService.createBatchRaOppMappings.mockResolvedValue(mockBatchResult);

      // Act
      const result = await controller.createBatchRaOppMappings(dto);

      // Assert
      expect(result).toEqual(mockBatchResult);
      expect(service.createBatchRaOppMappings).toHaveBeenCalledWith(dto);
      expect(service.createBatchRaOppMappings).toHaveBeenCalledTimes(1);
    });

    it('should handle batch operation with errors', async () => {
      // Arrange
      const dto: CreateBatchRaOppMappingsDto = {
        mappings: [
          {
            resultadoAprendizajeId: 999, // No existe
            oppId: 1,
            justificacion: 'Justificación para RA inexistente',
          },
        ],
      };

      const errorResult: BatchOperationResultDto = {
        totalSolicitadas: 1,
        exitosas: 0,
        fallidas: 1,
        errores: ['El Resultado de Aprendizaje con ID 999 no existe'],
        relacionesCreadas: [],
      };

      mockService.createBatchRaOppMappings.mockResolvedValue(errorResult);

      // Act
      const result = await controller.createBatchRaOppMappings(dto);

      // Assert
      expect(result).toEqual(errorResult);
      expect(result.fallidas).toBe(1);
      expect(result.errores).toContain('El Resultado de Aprendizaje con ID 999 no existe');
    });
  });

  describe('getAvailableRAsForOpp', () => {
    it('should return available RAs for OPP without filter', async () => {
      // Arrange
      const oppId = 1;
      mockService.getAvailableRAsForOpp.mockResolvedValue(mockAvailableRAs);

      // Act
      const result = await controller.getAvailableRAsForOpp(oppId, undefined);

      // Assert
      expect(result).toEqual(mockAvailableRAs);
      expect(service.getAvailableRAsForOpp).toHaveBeenCalledWith(1, undefined);
    });

    it('should return available RAs for OPP with ESPECIFICO filter', async () => {
      // Arrange
      const oppId = 1;
      const tipo = TipoRA.ESPECIFICO;
      mockService.getAvailableRAsForOpp.mockResolvedValue(mockAvailableRAs);

      // Act
      const result = await controller.getAvailableRAsForOpp(oppId, tipo);

      // Assert
      expect(result).toEqual(mockAvailableRAs);
      expect(service.getAvailableRAsForOpp).toHaveBeenCalledWith(1, TipoRA.ESPECIFICO);
    });

    it('should return available RAs for OPP with GENERAL filter', async () => {
      // Arrange
      const oppId = 1;
      const tipo = TipoRA.GENERAL;
      const generalRAs = [
        {
          id: 3,
          codigo: 'RA3',
          descripcion: 'Comunicación efectiva',
          tipo: TipoRA.GENERAL,
          carreraId: 1,
        },
      ];
      mockService.getAvailableRAsForOpp.mockResolvedValue(generalRAs);

      // Act
      const result = await controller.getAvailableRAsForOpp(oppId, tipo);

      // Assert
      expect(result).toEqual(generalRAs);
      expect(service.getAvailableRAsForOpp).toHaveBeenCalledWith(1, TipoRA.GENERAL);
    });
  });

  describe('findAllRaOppMappings', () => {
    it('should return all mappings with filters', async () => {
      // Arrange
      const filters = {
        carreraId: 1,
        resultadoAprendizajeId: 1,
        oppId: 1,
        estadoActivo: true,
      };

      mockService.findAllRaOppMappings.mockResolvedValue(mockMappings);

      // Act
      const result = await controller.findAllRaOppMappings(filters);

      // Assert
      expect(result).toEqual(mockMappings);
      expect(service.findAllRaOppMappings).toHaveBeenCalledWith(filters);
    });

    it('should return all mappings without filters', async () => {
      // Arrange
      const filters = {};
      mockService.findAllRaOppMappings.mockResolvedValue(mockMappings);

      // Act
      const result = await controller.findAllRaOppMappings(filters);

      // Assert
      expect(result).toEqual(mockMappings);
      expect(service.findAllRaOppMappings).toHaveBeenCalledWith(filters);
    });
  });

  describe('findMappingsByCarrera', () => {
    it('should return mappings by carrera', async () => {
      // Arrange
      const carreraId = 1;
      mockService.findMappingsByCarrera.mockResolvedValue(mockMappings);

      // Act
      const result = await controller.findMappingsByCarrera(carreraId);

      // Assert
      expect(result).toEqual(mockMappings);
      expect(service.findMappingsByCarrera).toHaveBeenCalledWith(1);
    });
  });

  // HU7777 Matrix Visualization Tests
  describe('getOppRaMatrix', () => {
    it('should return OPP-RA matrix with mappings', async () => {
      // Arrange
      const carreraId = 1;
      const raType = 'ESPECIFICO';
      const activeOnly = true;
      const expectedFilters = { raType, activeOnly };
      mockService.getOppRaMatrix.mockResolvedValue(mockMatrixResponse);

      // Act
      const result = await controller.getOppRaMatrix(carreraId, raType, activeOnly);

      // Assert
      expect(result).toEqual(mockMatrixResponse);
      expect(service.getOppRaMatrix).toHaveBeenCalledWith(1, expectedFilters);
      expect(result.opps).toHaveLength(1);
      expect(result.ras).toHaveLength(1);
      expect(result.mappings).toHaveLength(1);
      expect(result.stats.totalMappings).toBe(1);
    });

    it('should return matrix with default filters', async () => {
      // Arrange
      const carreraId = 2;
      const expectedFilters = { raType: undefined, activeOnly: true };
      const emptyMatrix = {
        ...mockMatrixResponse,
        opps: [],
        ras: [],
        mappings: [],
        stats: {
          totalOpps: 0,
          totalRas: 0,
          totalMappings: 0,
          coveragePercentage: 0,
        },
      };
      mockService.getOppRaMatrix.mockResolvedValue(emptyMatrix);

      // Act
      const result = await controller.getOppRaMatrix(carreraId);

      // Assert
      expect(result).toEqual(emptyMatrix);
      expect(service.getOppRaMatrix).toHaveBeenCalledWith(2, expectedFilters);
      expect(result.opps).toHaveLength(0);
      expect(result.ras).toHaveLength(0);
      expect(result.mappings).toHaveLength(0);
    });

    it('should handle different RA type filters', async () => {
      // Arrange
      const carreraId = 1;
      const raType = 'GENERAL';
      const expectedFilters = { raType: 'GENERAL', activeOnly: true };
      mockService.getOppRaMatrix.mockResolvedValue(mockMatrixResponse);

      // Act
      const result = await controller.getOppRaMatrix(carreraId, raType);

      // Assert
      expect(result).toEqual(mockMatrixResponse);
      expect(service.getOppRaMatrix).toHaveBeenCalledWith(1, expectedFilters);
    });
  });



  describe('getAvailableOppsForRa', () => {
    it('should return available OPPs for RA', async () => {
      // Arrange
      const raId = 1;
      const mockOpps = [
        {
          id: 1,
          codigo: 'OPP1',
          descripcion: 'Aplicar metodologías ágiles',
          carreraId: 1,
        },
      ];
      mockService.getAvailableOppsForRa.mockResolvedValue(mockOpps);

      // Act
      const result = await controller.getAvailableOppsForRa(raId);

      // Assert
      expect(result).toEqual(mockOpps);
      expect(service.getAvailableOppsForRa).toHaveBeenCalledWith(1);
    });
  });

  describe('deleteRaOppMapping', () => {
    it('should delete mapping successfully', async () => {
      // Arrange
      const mappingId = 1;
      mockService.deleteRaOppMapping.mockResolvedValue(undefined);

      // Act
      await controller.deleteRaOppMapping(mappingId);

      // Assert
      expect(service.deleteRaOppMapping).toHaveBeenCalledWith(1);
      expect(service.deleteRaOppMapping).toHaveBeenCalledTimes(1);
    });
  });

  // HU7769 - RA-EURACE endpoints tests
  describe('createBatchRaEuraceMappings', () => {
    it('should create batch RA-EURACE mappings successfully', async () => {
      // Arrange
      const dto: CreateBatchRaEuraceMappingsDto = {
        mappings: [
          {
            resultadoAprendizajeId: 1,
            eurAceId: 1,
            justificacion: 'Este RA contribuye al criterio EUR-ACE de conocimiento técnico especializado',
          },
          {
            resultadoAprendizajeId: 2,
            eurAceId: 1,
            justificacion: 'Segundo mapeo con justificación válida para el mismo criterio',
          },
        ],
      };

      mockService.createBatchRaEuraceMappings.mockResolvedValue(mockBatchRaEuraceResult);

      // Act
      const result = await controller.createBatchRaEuraceMappings(dto);

      // Assert
      expect(result).toEqual(mockBatchRaEuraceResult);
      expect(service.createBatchRaEuraceMappings).toHaveBeenCalledWith(dto);
      expect(result.exitosas).toBe(2);
      expect(result.fallidas).toBe(0);
      expect(result.relacionesCreadas).toEqual([1, 2]);
    });

    it('should handle empty mappings array', async () => {
      // Arrange
      const dto: CreateBatchRaEuraceMappingsDto = {
        mappings: [],
      };

      const emptyResult: BatchRaEuraceOperationResultDto = {
        totalSolicitadas: 0,
        exitosas: 0,
        fallidas: 0,
        errores: [],
        relacionesCreadas: [],
      };

      mockService.createBatchRaEuraceMappings.mockResolvedValue(emptyResult);

      // Act
      const result = await controller.createBatchRaEuraceMappings(dto);

      // Assert
      expect(result).toEqual(emptyResult);
      expect(service.createBatchRaEuraceMappings).toHaveBeenCalledWith(dto);
    });
  });

  describe('findAllRaEuraceMappings', () => {
    it('should return filtered RA-EURACE mappings', async () => {
      // Arrange
      const filters: FilterRaEuraceMappingsDto = {
        carreraId: 1,
        resultadoAprendizajeId: 1,
      };

      mockService.findAllRaEuraceMappings.mockResolvedValue(mockRaEuraceMappings);

      // Act
      const result = await controller.findAllRaEuraceMappings(filters);

      // Assert
      expect(result).toEqual(mockRaEuraceMappings);
      expect(service.findAllRaEuraceMappings).toHaveBeenCalledWith(filters);
      expect(result).toHaveLength(1);
      expect(result[0].resultadoAprendizaje).toHaveProperty('code', 'RA001');
      expect(result[0].eurAce).toHaveProperty('code', 'EA1.1');
    });

    it('should return all mappings when no filters provided', async () => {
      // Arrange
      mockService.findAllRaEuraceMappings.mockResolvedValue(mockRaEuraceMappings);

      // Act
      const result = await controller.findAllRaEuraceMappings({});

      // Assert
      expect(result).toEqual(mockRaEuraceMappings);
      expect(service.findAllRaEuraceMappings).toHaveBeenCalledWith({});
    });
  });

  describe('getAvailableRAsForEurAce', () => {
    it('should return available RAs for EUR-ACE criterion', async () => {
      // Arrange
      const eurAceId = 1;
      const carreraId = 1;
      const raType = TipoRA.ESPECIFICO;

      mockService.getAvailableRAsForEurAce.mockResolvedValue(mockAvailableRAsForEurAce);

      // Act
      const result = await controller.getAvailableRAsForEurAce(eurAceId, carreraId, raType);

      // Assert
      expect(result).toEqual(mockAvailableRAsForEurAce);
      expect(service.getAvailableRAsForEurAce).toHaveBeenCalledWith(eurAceId, carreraId, raType);
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('type');
    });

    it('should return available RAs without type filter', async () => {
      // Arrange
      const eurAceId = 1;
      const carreraId = 1;

      mockService.getAvailableRAsForEurAce.mockResolvedValue(mockAvailableRAsForEurAce);

      // Act
      const result = await controller.getAvailableRAsForEurAce(eurAceId, carreraId, undefined);

      // Assert
      expect(result).toEqual(mockAvailableRAsForEurAce);
      expect(service.getAvailableRAsForEurAce).toHaveBeenCalledWith(eurAceId, carreraId, undefined);
    });

    it('should return empty array when no RAs available', async () => {
      // Arrange
      const eurAceId = 999;
      const carreraId = 1;
      mockService.getAvailableRAsForEurAce.mockResolvedValue([]);

      // Act
      const result = await controller.getAvailableRAsForEurAce(eurAceId, carreraId, undefined);

      // Assert
      expect(result).toEqual([]);
      expect(service.getAvailableRAsForEurAce).toHaveBeenCalledWith(999, 1, undefined);
      expect(result).toHaveLength(0);
    });
  });

  describe('deleteRaEuraceMapping', () => {
    it('should delete RA-EURACE mapping successfully', async () => {
      // Arrange
      const mappingId = 1;
      mockService.deleteRaEuraceMapping.mockResolvedValue(undefined);

      // Act
      await controller.deleteRaEuraceMapping(mappingId);

      // Assert
      expect(service.deleteRaEuraceMapping).toHaveBeenCalledWith(1);
      expect(service.deleteRaEuraceMapping).toHaveBeenCalledTimes(1);
    });

    it('should handle deletion of non-existent mapping', async () => {
      // Arrange
      const mappingId = 999;
      mockService.deleteRaEuraceMapping.mockRejectedValue(new Error('Mapping not found'));

      // Act & Assert
      await expect(controller.deleteRaEuraceMapping(mappingId)).rejects.toThrow('Mapping not found');
      expect(service.deleteRaEuraceMapping).toHaveBeenCalledWith(999);
    });
  });
});