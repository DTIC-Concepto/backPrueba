import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { OppService } from './opp.service';
import { OppModel } from './models/opp.model';
import { CarreraModel } from '../carreras/models/carrera.model';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { CreateOppDto } from './dto/create-opp.dto';
import { FilterOppDto } from './dto/filter-opp.dto';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('OppService', () => {
  let service: OppService;
  let oppModelMock: any;
  let carreraModelMock: any;
  let auditoriaServiceMock: any;

  const mockOpp = {
    id: 1,
    codigo: 'OPP1',
    descripcion: 'Objetivo de Programa de Prueba',
    carreraId: 1,
    createdAt: new Date('2025-10-13T05:05:36.333Z'),
    updatedAt: new Date('2025-10-13T05:05:36.333Z'),
    carrera: {
      id: 1,
      codigo: 'ING-SIS',
      nombre: 'Ingeniería en Sistemas',
    },
  };

  const mockCarrera = {
    id: 1,
    codigo: 'ING-SIS',
    nombre: 'Ingeniería en Sistemas',
    facultadId: 1,
    coordinadorId: 2,
  };

  beforeEach(async () => {
    // Mock del modelo OPP
    oppModelMock = {
      findOne: jest.fn(),
      create: jest.fn(),
      findAndCountAll: jest.fn(),
      sync: jest.fn().mockResolvedValue(undefined),
    };

    // Mock del modelo Carrera
    carreraModelMock = {
      findByPk: jest.fn(),
    };

    // Mock del servicio de auditoría
    auditoriaServiceMock = {
      registrarEvento: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OppService,
        {
          provide: getModelToken(OppModel),
          useValue: oppModelMock,
        },
        {
          provide: getModelToken(CarreraModel),
          useValue: carreraModelMock,
        },
        {
          provide: AuditoriaService,
          useValue: auditoriaServiceMock,
        },
      ],
    }).compile();

    service = module.get<OppService>(OppService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createOppDto: CreateOppDto = {
      codigo: 'OPP1',
      descripcion: 'Objetivo de Programa de Prueba',
      carreraId: 1,
    };

    it('should create an OPP successfully', async () => {
      // Arrange
      oppModelMock.findOne.mockResolvedValue(null); // No existe OPP duplicado
      carreraModelMock.findByPk.mockResolvedValue(mockCarrera); // Carrera existe
      oppModelMock.create.mockResolvedValue(mockOpp);

      // Act
      const result = await service.create(createOppDto, 1);

      // Assert
      expect(oppModelMock.findOne).toHaveBeenCalledWith({
        where: { codigo: 'OPP1', carreraId: 1 },
      });
      expect(carreraModelMock.findByPk).toHaveBeenCalledWith(1);
      expect(oppModelMock.create).toHaveBeenCalledWith(createOppDto);
      expect(auditoriaServiceMock.registrarEvento).toHaveBeenCalled();
      expect(result).toEqual(mockOpp);
    });

    it('should throw ConflictException when OPP with same codigo and carrera already exists', async () => {
      // Arrange
      carreraModelMock.findByPk.mockResolvedValue(mockCarrera); // Carrera existe primero
      oppModelMock.findOne.mockResolvedValue(mockOpp); // Existe OPP duplicado

      // Act & Assert
      await expect(service.create(createOppDto, 1)).rejects.toThrow(
        ConflictException,
      );

      expect(oppModelMock.create).not.toHaveBeenCalled();
      expect(auditoriaServiceMock.registrarEvento).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when carrera does not exist', async () => {
      // Arrange
      carreraModelMock.findByPk.mockResolvedValue(null); // Carrera no existe

      // Act & Assert
      await expect(service.create(createOppDto, 1)).rejects.toThrow(
        'La carrera especificada no existe',
      );

      expect(oppModelMock.create).not.toHaveBeenCalled();
      expect(auditoriaServiceMock.registrarEvento).not.toHaveBeenCalled();
    });
  });

  describe('findAllWithFiltersAndPagination', () => {
    const mockPaginatedResult = {
      rows: [mockOpp],
      count: 1,
    };

    it('should return paginated OPPs without filters', async () => {
      // Arrange
      const filters: FilterOppDto = { page: 1, limit: 10 };
      oppModelMock.findAndCountAll.mockResolvedValue(mockPaginatedResult);

      // Act
      const result = await service.findAllWithFiltersAndPagination(filters);

      // Assert
      expect(oppModelMock.findAndCountAll).toHaveBeenCalledWith({
        where: {},
        include: [
          {
            model: CarreraModel,
            as: 'carrera',
            attributes: ['id', 'codigo', 'nombre'],
          },
        ],
        limit: 10,
        offset: 0,
        order: [['codigo', 'ASC']],
      });

      expect(result).toEqual({
        data: [mockOpp],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
        hasPrevious: false,
        hasNext: false,
      });
    });

    it('should return paginated OPPs with search filter', async () => {
      // Arrange
      const filters: FilterOppDto = {
        page: 1,
        limit: 10,
        search: 'OPP1',
      };
      oppModelMock.findAndCountAll.mockResolvedValue(mockPaginatedResult);

      // Act
      const result = await service.findAllWithFiltersAndPagination(filters);

      // Assert
      expect(oppModelMock.findAndCountAll).toHaveBeenCalledWith({
        where: {
          [Op.or]: [
            { codigo: { [Op.iLike]: '%OPP1%' } },
            { descripcion: { [Op.iLike]: '%OPP1%' } },
          ],
        },
        include: [
          {
            model: CarreraModel,
            as: 'carrera',
            attributes: ['id', 'codigo', 'nombre'],
          },
        ],
        limit: 10,
        offset: 0,
        order: [['codigo', 'ASC']],
      });

      expect(result.data).toEqual([mockOpp]);
      expect(result.total).toBe(1);
    });

    it('should return paginated OPPs with carrera filter', async () => {
      // Arrange
      const filters: FilterOppDto = {
        page: 1,
        limit: 10,
        carreraId: 1,
      };
      oppModelMock.findAndCountAll.mockResolvedValue(mockPaginatedResult);

      // Act
      const result = await service.findAllWithFiltersAndPagination(filters);

      // Assert
      expect(oppModelMock.findAndCountAll).toHaveBeenCalledWith({
        where: { carreraId: 1 },
        include: [
          {
            model: CarreraModel,
            as: 'carrera',
            attributes: ['id', 'codigo', 'nombre'],
          },
        ],
        limit: 10,
        offset: 0,
        order: [['codigo', 'ASC']],
      });

      expect(result.data).toEqual([mockOpp]);
      expect(result.total).toBe(1);
    });

    it('should handle pagination correctly for second page', async () => {
      // Arrange
      const filters: FilterOppDto = { page: 2, limit: 5 };
      const mockLargePaginatedResult = {
        rows: [mockOpp],
        count: 15,
      };
      oppModelMock.findAndCountAll.mockResolvedValue(mockLargePaginatedResult);

      // Act
      const result = await service.findAllWithFiltersAndPagination(filters);

      // Assert
      expect(oppModelMock.findAndCountAll).toHaveBeenCalledWith({
        where: {},
        include: [
          {
            model: CarreraModel,
            as: 'carrera',
            attributes: ['id', 'codigo', 'nombre'],
          },
        ],
        limit: 5,
        offset: 5,
        order: [['codigo', 'ASC']],
      });

      expect(result).toEqual({
        data: [mockOpp],
        total: 15,
        page: 2,
        limit: 5,
        totalPages: 3,
        hasPrevious: true,
        hasNext: true,
      });
    });

    it('should combine search and carrera filters', async () => {
      // Arrange
      const filters: FilterOppDto = {
        page: 1,
        limit: 10,
        search: 'análisis',
        carreraId: 1,
      };
      oppModelMock.findAndCountAll.mockResolvedValue(mockPaginatedResult);

      // Act
      const result = await service.findAllWithFiltersAndPagination(filters);

      // Assert
      expect(oppModelMock.findAndCountAll).toHaveBeenCalledWith({
        where: {
          carreraId: 1,
          [Op.or]: [
            { codigo: { [Op.iLike]: '%análisis%' } },
            { descripcion: { [Op.iLike]: '%análisis%' } },
          ],
        },
        include: [
          {
            model: CarreraModel,
            as: 'carrera',
            attributes: ['id', 'codigo', 'nombre'],
          },
        ],
        limit: 10,
        offset: 0,
        order: [['codigo', 'ASC']],
      });

      expect(result.data).toEqual([mockOpp]);
    });

    it('should return empty results when no OPPs found', async () => {
      // Arrange
      const filters: FilterOppDto = { page: 1, limit: 10 };
      const emptyResult = { rows: [], count: 0 };
      oppModelMock.findAndCountAll.mockResolvedValue(emptyResult);

      // Act
      const result = await service.findAllWithFiltersAndPagination(filters);

      // Assert
      expect(result).toEqual({
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
        hasPrevious: false,
        hasNext: false,
      });
    });
  });
});