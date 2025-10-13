import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { EurAceService } from './eur-ace.service';
import { EurAceModel } from './models/eur-ace.model';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { CreateEurAceDto } from './dto/create-eur-ace.dto';
import { FilterEurAceDto } from './dto/filter-eur-ace.dto';
import { ConflictException, InternalServerErrorException } from '@nestjs/common';

describe('EurAceService', () => {
  let service: EurAceService;
  let eurAceModelMock: any;
  let auditoriaServiceMock: any;

  const mockEurAce = {
    id: 1,
    codigo: '5.4.6',
    descripcion: 'Gestión de proyectos de ingeniería complejos aplicando metodologías modernas',
    createdAt: new Date('2025-10-13T05:05:36.333Z'),
    updatedAt: new Date('2025-10-13T05:05:36.333Z'),
  };

  const mockPaginatedResult = {
    rows: [mockEurAce],
    count: 1,
  };

  beforeEach(async () => {
    eurAceModelMock = {
      findOne: jest.fn(),
      create: jest.fn(),
      findAll: jest.fn(),
      findAndCountAll: jest.fn(),
    };

    auditoriaServiceMock = {
      registrarEvento: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EurAceService,
        {
          provide: getModelToken(EurAceModel),
          useValue: eurAceModelMock,
        },
        {
          provide: AuditoriaService,
          useValue: auditoriaServiceMock,
        },
      ],
    }).compile();

    service = module.get<EurAceService>(EurAceService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createEurAceDto: CreateEurAceDto = {
      codigo: '5.4.6',
      descripcion: 'Gestión de proyectos de ingeniería complejos aplicando metodologías modernas',
    };

    it('should create an EUR-ACE criterion successfully', async () => {
      // Arrange
      eurAceModelMock.findOne.mockResolvedValue(null); // No existe criterio duplicado
      eurAceModelMock.create.mockResolvedValue(mockEurAce);

      // Act
      const result = await service.create(createEurAceDto, 1);

      // Assert
      expect(eurAceModelMock.findOne).toHaveBeenCalledWith({
        where: { codigo: '5.4.6' },
      });
      expect(eurAceModelMock.create).toHaveBeenCalledWith({
        codigo: '5.4.6',
        descripcion: 'Gestión de proyectos de ingeniería complejos aplicando metodologías modernas',
      });
      expect(auditoriaServiceMock.registrarEvento).toHaveBeenCalled();
      expect(result).toEqual(mockEurAce);
    });

    it('should throw ConflictException when EUR-ACE criterion with same codigo already exists', async () => {
      // Arrange
      eurAceModelMock.findOne.mockResolvedValue(mockEurAce); // Existe criterio duplicado

      // Act & Assert
      await expect(service.create(createEurAceDto, 1)).rejects.toThrow(
        ConflictException,
      );

      expect(eurAceModelMock.create).not.toHaveBeenCalled();
      expect(auditoriaServiceMock.registrarEvento).not.toHaveBeenCalled();
    });

    it('should create successfully without userId (no audit)', async () => {
      // Arrange
      eurAceModelMock.findOne.mockResolvedValue(null);
      eurAceModelMock.create.mockResolvedValue(mockEurAce);

      // Act
      const result = await service.create(createEurAceDto);

      // Assert
      expect(result).toEqual(mockEurAce);
      expect(auditoriaServiceMock.registrarEvento).not.toHaveBeenCalled();
    });

    it('should throw InternalServerErrorException when database operation fails', async () => {
      // Arrange
      eurAceModelMock.findOne.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(service.create(createEurAceDto, 1)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('findAll', () => {
    it('should return all EUR-ACE criteria ordered by codigo', async () => {
      // Arrange
      const mockCriteria = [mockEurAce];
      eurAceModelMock.findAll.mockResolvedValue(mockCriteria);

      // Act
      const result = await service.findAll();

      // Assert
      expect(eurAceModelMock.findAll).toHaveBeenCalledWith({
        order: [['codigo', 'ASC']],
      });
      expect(result).toEqual(mockCriteria);
    });
  });

  describe('findAllWithFiltersAndPagination', () => {
    it('should return paginated EUR-ACE criteria without filters', async () => {
      // Arrange
      const filters: FilterEurAceDto = {
        page: 1,
        limit: 10,
      };
      eurAceModelMock.findAndCountAll.mockResolvedValue(mockPaginatedResult);

      // Act
      const result = await service.findAllWithFiltersAndPagination(filters);

      // Assert
      expect(eurAceModelMock.findAndCountAll).toHaveBeenCalledWith({
        where: {},
        order: [['codigo', 'ASC']],
        limit: 10,
        offset: 0,
      });

      expect(result).toEqual({
        data: [mockEurAce],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
        hasPrevious: false,
        hasNext: false,
      });
    });

    it('should return paginated EUR-ACE criteria with codigo filter', async () => {
      // Arrange
      const filters: FilterEurAceDto = {
        page: 1,
        limit: 10,
        codigo: '5.4',
      };
      eurAceModelMock.findAndCountAll.mockResolvedValue(mockPaginatedResult);

      // Act
      const result = await service.findAllWithFiltersAndPagination(filters);

      // Assert
      expect(eurAceModelMock.findAndCountAll).toHaveBeenCalledWith({
        where: {
          codigo: { [Op.iLike]: '%5.4%' },
        },
        order: [['codigo', 'ASC']],
        limit: 10,
        offset: 0,
      });

      expect(result.data).toEqual([mockEurAce]);
      expect(result.total).toBe(1);
    });

    it('should return paginated EUR-ACE criteria with descripcion filter', async () => {
      // Arrange
      const filters: FilterEurAceDto = {
        page: 1,
        limit: 10,
        descripcion: 'gestión',
      };
      eurAceModelMock.findAndCountAll.mockResolvedValue(mockPaginatedResult);

      // Act
      const result = await service.findAllWithFiltersAndPagination(filters);

      // Assert
      expect(eurAceModelMock.findAndCountAll).toHaveBeenCalledWith({
        where: {
          descripcion: { [Op.iLike]: '%gestión%' },
        },
        order: [['codigo', 'ASC']],
        limit: 10,
        offset: 0,
      });

      expect(result.data).toEqual([mockEurAce]);
      expect(result.total).toBe(1);
    });

    it('should handle pagination correctly for second page', async () => {
      // Arrange
      const filters: FilterEurAceDto = {
        page: 2,
        limit: 5,
      };
      const mockResult = {
        rows: [mockEurAce],
        count: 15,
      };
      eurAceModelMock.findAndCountAll.mockResolvedValue(mockResult);

      // Act
      const result = await service.findAllWithFiltersAndPagination(filters);

      // Assert
      expect(eurAceModelMock.findAndCountAll).toHaveBeenCalledWith({
        where: {},
        order: [['codigo', 'ASC']],
        limit: 5,
        offset: 5,
      });

      expect(result).toEqual({
        data: [mockEurAce],
        total: 15,
        page: 2,
        limit: 5,
        totalPages: 3,
        hasPrevious: true,
        hasNext: true,
      });
    });

    it('should combine codigo and descripcion filters', async () => {
      // Arrange
      const filters: FilterEurAceDto = {
        page: 1,
        limit: 10,
        codigo: '5.4',
        descripcion: 'gestión',
      };
      eurAceModelMock.findAndCountAll.mockResolvedValue(mockPaginatedResult);

      // Act
      const result = await service.findAllWithFiltersAndPagination(filters);

      // Assert
      expect(eurAceModelMock.findAndCountAll).toHaveBeenCalledWith({
        where: {
          codigo: { [Op.iLike]: '%5.4%' },
          descripcion: { [Op.iLike]: '%gestión%' },
        },
        order: [['codigo', 'ASC']],
        limit: 10,
        offset: 0,
      });

      expect(result.data).toEqual([mockEurAce]);
      expect(result.total).toBe(1);
    });

    it('should return empty results when no criteria found', async () => {
      // Arrange
      const filters: FilterEurAceDto = {
        page: 1,
        limit: 10,
        codigo: 'nonexistent',
      };
      const emptyResult = {
        rows: [],
        count: 0,
      };
      eurAceModelMock.findAndCountAll.mockResolvedValue(emptyResult);

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

    it('should throw InternalServerErrorException when findAndCountAll fails', async () => {
      // Arrange
      const filters: FilterEurAceDto = {
        page: 1,
        limit: 10,
      };
      eurAceModelMock.findAndCountAll.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(service.findAllWithFiltersAndPagination(filters)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('findByCode', () => {
    it('should find EUR-ACE criterion by codigo', async () => {
      // Arrange
      eurAceModelMock.findOne.mockResolvedValue(mockEurAce);

      // Act
      const result = await service.findByCode('5.4.6');

      // Assert
      expect(eurAceModelMock.findOne).toHaveBeenCalledWith({
        where: { codigo: '5.4.6' },
      });
      expect(result).toEqual(mockEurAce);
    });

    it('should return null when EUR-ACE criterion not found', async () => {
      // Arrange
      eurAceModelMock.findOne.mockResolvedValue(null);

      // Act
      const result = await service.findByCode('nonexistent');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('should find EUR-ACE criterion by id', async () => {
      // Arrange
      eurAceModelMock.findOne.mockResolvedValue(mockEurAce);

      // Act
      const result = await service.findById(1);

      // Assert
      expect(eurAceModelMock.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(result).toEqual(mockEurAce);
    });

    it('should return null when EUR-ACE criterion not found by id', async () => {
      // Arrange
      eurAceModelMock.findOne.mockResolvedValue(null);

      // Act
      const result = await service.findById(999);

      // Assert
      expect(result).toBeNull();
    });
  });
});