import { Test, TestingModule } from '@nestjs/testing';
import { EurAceController } from './eur-ace.controller';
import { EurAceService } from './eur-ace.service';
import { CreateEurAceDto } from './dto/create-eur-ace.dto';
import { FilterEurAceDto } from './dto/filter-eur-ace.dto';
import { ConflictException, InternalServerErrorException } from '@nestjs/common';

describe('EurAceController', () => {
  let controller: EurAceController;
  let eurAceServiceMock: any;

  const mockUser = {
    id: 1,
    nombre: 'Test User',
    email: 'test@example.com',
  };

  const mockEurAce = {
    id: 1,
    codigo: '5.4.6',
    descripcion: 'Gestión de proyectos de ingeniería complejos aplicando metodologías modernas',
    createdAt: new Date('2025-10-13T05:05:36.333Z'),
    updatedAt: new Date('2025-10-13T05:05:36.333Z'),
  };

  const mockPaginatedResponse = {
    data: [mockEurAce],
    total: 1,
    page: 1,
    limit: 10,
    totalPages: 1,
    hasPrevious: false,
    hasNext: false,
  };

  beforeEach(async () => {
    eurAceServiceMock = {
      create: jest.fn(),
      findAllWithFiltersAndPagination: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [EurAceController],
      providers: [
        {
          provide: EurAceService,
          useValue: eurAceServiceMock,
        },
      ],
    }).compile();

    controller = module.get<EurAceController>(EurAceController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    const createEurAceDto: CreateEurAceDto = {
      codigo: '5.4.6',
      descripcion: 'Gestión de proyectos de ingeniería complejos aplicando metodologías modernas',
    };

    it('should create an EUR-ACE criterion successfully', async () => {
      // Arrange
      eurAceServiceMock.create.mockResolvedValue(mockEurAce);

      // Act
      const result = await controller.create(createEurAceDto, mockUser as any);

      // Assert
      expect(eurAceServiceMock.create).toHaveBeenCalledWith(createEurAceDto, mockUser.id);
      expect(result).toEqual({
        id: mockEurAce.id,
        codigo: mockEurAce.codigo,
        descripcion: mockEurAce.descripcion,
        createdAt: mockEurAce.createdAt,
        updatedAt: mockEurAce.updatedAt,
      });
    });

    it('should handle ConflictException when EUR-ACE criterion already exists', async () => {
      // Arrange
      const conflictError = new ConflictException(
        'Ya existe un criterio EUR-ACE con el código "5.4.6"',
      );
      eurAceServiceMock.create.mockRejectedValue(conflictError);

      // Act & Assert
      await expect(controller.create(createEurAceDto, mockUser as any)).rejects.toThrow(
        ConflictException,
      );
      expect(eurAceServiceMock.create).toHaveBeenCalledWith(createEurAceDto, mockUser.id);
    });

    it('should handle InternalServerErrorException', async () => {
      // Arrange
      const internalError = new InternalServerErrorException(
        'Error interno del servidor al crear el criterio EUR-ACE',
      );
      eurAceServiceMock.create.mockRejectedValue(internalError);

      // Act & Assert
      await expect(controller.create(createEurAceDto, mockUser as any)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated EUR-ACE criteria without filters', async () => {
      // Arrange
      const filterDto: FilterEurAceDto = {
        page: 1,
        limit: 10,
      };
      eurAceServiceMock.findAllWithFiltersAndPagination.mockResolvedValue(mockPaginatedResponse);

      // Act
      const result = await controller.findAll(filterDto);

      // Assert
      expect(eurAceServiceMock.findAllWithFiltersAndPagination).toHaveBeenCalledWith(filterDto);
      expect(result).toEqual({
        data: [{
          id: mockEurAce.id,
          codigo: mockEurAce.codigo,
          descripcion: mockEurAce.descripcion,
          createdAt: mockEurAce.createdAt,
          updatedAt: mockEurAce.updatedAt,
        }],
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
      const filterDto: FilterEurAceDto = {
        page: 1,
        limit: 10,
        codigo: '5.4',
      };
      eurAceServiceMock.findAllWithFiltersAndPagination.mockResolvedValue(mockPaginatedResponse);

      // Act
      const result = await controller.findAll(filterDto);

      // Assert
      expect(eurAceServiceMock.findAllWithFiltersAndPagination).toHaveBeenCalledWith(filterDto);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].codigo).toBe('5.4.6');
    });

    it('should return paginated EUR-ACE criteria with descripcion filter', async () => {
      // Arrange
      const filterDto: FilterEurAceDto = {
        page: 1,
        limit: 10,
        descripcion: 'gestión',
      };
      eurAceServiceMock.findAllWithFiltersAndPagination.mockResolvedValue(mockPaginatedResponse);

      // Act
      const result = await controller.findAll(filterDto);

      // Assert
      expect(eurAceServiceMock.findAllWithFiltersAndPagination).toHaveBeenCalledWith(filterDto);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].descripcion.toLowerCase()).toContain('gestión');
    });

    it('should handle pagination correctly', async () => {
      // Arrange
      const filterDto: FilterEurAceDto = {
        page: 2,
        limit: 5,
      };
      const paginatedResponse = {
        ...mockPaginatedResponse,
        page: 2,
        limit: 5,
        totalPages: 3,
        hasPrevious: true,
        hasNext: true,
      };
      eurAceServiceMock.findAllWithFiltersAndPagination.mockResolvedValue(paginatedResponse);

      // Act
      const result = await controller.findAll(filterDto);

      // Assert
      expect(result.page).toBe(2);
      expect(result.limit).toBe(5);
      expect(result.hasPrevious).toBe(true);
      expect(result.hasNext).toBe(true);
    });

    it('should return empty results when no criteria found', async () => {
      // Arrange
      const filterDto: FilterEurAceDto = {
        page: 1,
        limit: 10,
        codigo: 'nonexistent',
      };
      const emptyResponse = {
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
        hasPrevious: false,
        hasNext: false,
      };
      eurAceServiceMock.findAllWithFiltersAndPagination.mockResolvedValue(emptyResponse);

      // Act
      const result = await controller.findAll(filterDto);

      // Assert
      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('should handle service errors', async () => {
      // Arrange
      const filterDto: FilterEurAceDto = {
        page: 1,
        limit: 10,
      };
      const serviceError = new InternalServerErrorException(
        'Error interno del servidor al obtener los criterios EUR-ACE',
      );
      eurAceServiceMock.findAllWithFiltersAndPagination.mockRejectedValue(serviceError);

      // Act & Assert
      await expect(controller.findAll(filterDto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });
});