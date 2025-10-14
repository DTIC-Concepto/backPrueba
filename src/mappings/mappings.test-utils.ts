import { Test, TestingModule } from '@nestjs/testing';
import { SequelizeModule, getModelToken } from '@nestjs/sequelize';
import { MappingsModule } from './mappings.module';
import { MappingsService } from './mappings.service';
import { MappingsController } from './mappings.controller';
import { RaOppModel } from './models/ra-opp.model';
import { ResultadoAprendizajeModel } from '../resultados-aprendizaje/models/resultado-aprendizaje.model';
import { OppModel } from '../opp/models/opp.model';
import { CarreraModel } from '../carreras/models/carrera.model';

/**
 * Configuración de módulo de pruebas para Mappings
 * Proporciona los mocks necesarios para testing unitario aislado
 */
export const createMappingsTestModule = async (): Promise<TestingModule> => {
  // Mocks para los modelos Sequelize
  const mockRaOppModel = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    bulkCreate: jest.fn(),
    destroy: jest.fn(),
    count: jest.fn(),
    findAndCountAll: jest.fn(),
  };

  const mockResultadoAprendizajeModel = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByPk: jest.fn(),
    count: jest.fn(),
  };

  const mockOppModel = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByPk: jest.fn(),
    count: jest.fn(),
  };

  const mockCarreraModel = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByPk: jest.fn(),
  };

  const module: TestingModule = await Test.createTestingModule({
    controllers: [MappingsController],
    providers: [
      MappingsService,
      {
        provide: getModelToken(RaOppModel),
        useValue: mockRaOppModel,
      },
      {
        provide: getModelToken(ResultadoAprendizajeModel),
        useValue: mockResultadoAprendizajeModel,
      },
      {
        provide: getModelToken(OppModel),
        useValue: mockOppModel,
      },
      {
        provide: getModelToken(CarreraModel),
        useValue: mockCarreraModel,
      },
    ],
  }).compile();

  return module;
};

/**
 * Factory para crear datos de prueba consistentes
 */
export const createTestData = () => {
  const mockRa = {
    id: 1,
    codigo: 'RA-TEST-001',
    descripcion: 'Resultado de aprendizaje de prueba',
    tipo: 'ESPECIFICO',
    carreraId: 1,
    estadoActivo: true,
  };

  const mockOpp = {
    id: 1,
    codigo: 'OPP-TEST-001',
    descripcion: 'Objetivo de programa de prueba',
    carreraId: 1,
    estadoActivo: true,
  };

  const mockCarrera = {
    id: 1,
    codigo: 'ISC',
    nombre: 'Ingeniería en Sistemas Computacionales',
    facultadId: 1,
  };

  const mockRaOppMapping = {
    id: 1,
    resultadoAprendizajeId: 1,
    oppId: 1,
    justificacion: 'Justificación de mapeo para pruebas unitarias del sistema',
    fechaCreacion: new Date(),
    fechaActualizacion: new Date(),
    ResultadoAprendizaje: mockRa,
    Opp: mockOpp,
  };

  const mockBatchMappingsDto = {
    mappings: [
      {
        resultadoAprendizajeId: 1,
        oppId: 1,
        justificacion: 'Primera justificación de mapeo para batch operation test',
      },
      {
        resultadoAprendizajeId: 2,
        oppId: 1,
        justificacion: 'Segunda justificación de mapeo para batch operation test',
      },
    ],
  };

  const mockBatchResult = {
    totalSolicitadas: 2,
    exitosas: 2,
    fallidas: 0,
    errores: [],
    relacionesCreadas: [1, 2],
  };

  return {
    mockRa,
    mockOpp,
    mockCarrera,
    mockRaOppMapping,
    mockBatchMappingsDto,
    mockBatchResult,
  };
};

/**
 * Helpers para configurar mocks de Sequelize con comportamientos específicos
 */
export const configureMocks = (mockModels: any) => {
  const setupSuccessfulMocks = () => {
    const { mockRa, mockOpp, mockRaOppMapping } = createTestData();

    mockModels.resultadoAprendizajeModel.findByPk.mockResolvedValue(mockRa);
    mockModels.oppModel.findByPk.mockResolvedValue(mockOpp);
    mockModels.raOppModel.findOne.mockResolvedValue(null); // No existe mapping duplicado
    mockModels.raOppModel.create.mockResolvedValue(mockRaOppMapping);
    mockModels.raOppModel.findAll.mockResolvedValue([mockRaOppMapping]);
  };

  const setupErrorMocks = () => {
    mockModels.resultadoAprendizajeModel.findByPk.mockResolvedValue(null);
    mockModels.oppModel.findByPk.mockResolvedValue(null);
  };

  const setupValidationMocks = (sameCarrera = true) => {
    const { mockRa, mockOpp } = createTestData();
    
    const ra = { ...mockRa, carreraId: 1 };
    const opp = { ...mockOpp, carreraId: sameCarrera ? 1 : 2 };

    mockModels.resultadoAprendizajeModel.findByPk.mockResolvedValue(ra);
    mockModels.oppModel.findByPk.mockResolvedValue(opp);
  };

  const setupAvailableRasMocks = (tipo?: string) => {
    const { mockRa } = createTestData();
    const ras = [
      { ...mockRa, id: 1, tipo: 'ESPECIFICO' },
      { ...mockRa, id: 2, tipo: 'GENERAL' },
      { ...mockRa, id: 3, tipo: 'ESPECIFICO' },
    ].filter(ra => !tipo || ra.tipo === tipo);

    mockModels.oppModel.findByPk.mockResolvedValue({ id: 1, carreraId: 1 });
    mockModels.resultadoAprendizajeModel.findAll.mockResolvedValue(ras);
    mockModels.raOppModel.findAll.mockResolvedValue([]);
  };

  const setupStatsMocks = () => {
    mockModels.resultadoAprendizajeModel.count.mockResolvedValue(10);
    mockModels.oppModel.count.mockResolvedValue(8);
    mockModels.raOppModel.count.mockResolvedValue(15);
    mockModels.raOppModel.findAll
      .mockResolvedValueOnce([]) // RAs sin mappings
      .mockResolvedValueOnce([]); // OPPs sin mappings
  };

  const resetAllMocks = () => {
    Object.values(mockModels).forEach((model: any) => {
      Object.values(model).forEach((method: any) => {
        if (jest.isMockFunction(method)) {
          method.mockReset();
        }
      });
    });
  };

  return {
    setupSuccessfulMocks,
    setupErrorMocks,
    setupValidationMocks,
    setupAvailableRasMocks,
    setupStatsMocks,
    resetAllMocks,
  };
};