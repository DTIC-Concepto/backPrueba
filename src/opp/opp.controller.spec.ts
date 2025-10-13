import { Test, TestingModule } from '@nestjs/testing';
import { Request } from 'express';
import { OppController } from './opp.controller';
import { OppService } from './opp.service';
import { CreateOppDto } from './dto/create-opp.dto';
import { FilterOppDto } from './dto/filter-opp.dto';
import { OppResponseDto } from './dto/opp-response.dto';
import { OppPaginatedResponseDto } from './dto/opp-paginated-response.dto';

describe('OppController', () => {
  let controller: OppController;
  let oppServiceMock: any;

  const mockOppResponse: OppResponseDto = {
    id: 1,
    codigo: 'OPP1',
    descripcion: 'Objetivo de Programa de Prueba',
    carreraId: 1,
    createdAt: new Date('2025-10-13T05:05:36.333Z'),
    updatedAt: new Date('2025-10-13T05:05:36.333Z'),
  };

  const mockOppServiceResponse = {
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

  const mockPaginatedResponse: OppPaginatedResponseDto = {
    data: [mockOppResponse],
    total: 1,
    page: 1,
    limit: 10,
    totalPages: 1,
    hasPrevious: false,
    hasNext: false,
  };

  beforeEach(async () => {
    oppServiceMock = {
      create: jest.fn(),
      findAllWithFiltersAndPagination: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [OppController],
      providers: [
        {
          provide: OppService,
          useValue: oppServiceMock,
        },
      ],
    }).compile();

    controller = module.get<OppController>(OppController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    const createOppDto: CreateOppDto = {
      codigo: 'OPP1',
      descripcion: 'Objetivo de Programa de Prueba',
      carreraId: 1,
    };

    const mockRequest = {
      user: { id: 1 },
    } as any as Request;

    it('should create an OPP successfully', async () => {
      // Arrange
      oppServiceMock.create.mockResolvedValue(mockOppServiceResponse);

      // Act
      const result = await controller.create(createOppDto, mockRequest);

      // Assert
      expect(oppServiceMock.create).toHaveBeenCalledWith(createOppDto, 1);
      expect(result).toEqual(mockOppResponse);
    });

    it('should handle service errors', async () => {
      // Arrange
      const error = new Error('Service error');
      oppServiceMock.create.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.create(createOppDto, mockRequest)).rejects.toThrow(
        'Service error',
      );
      expect(oppServiceMock.create).toHaveBeenCalledWith(createOppDto, 1);
    });

    it('should extract user ID correctly from request', async () => {
      // Arrange
      const customRequest = {
        user: { id: 42 },
      } as any as Request;
      oppServiceMock.create.mockResolvedValue(mockOppServiceResponse);

      // Act
      await controller.create(createOppDto, customRequest);

      // Assert
      expect(oppServiceMock.create).toHaveBeenCalledWith(createOppDto, 42);
    });
  });

  describe('findAll', () => {
    it('should return paginated OPPs without filters', async () => {
      // Arrange
      const filters: FilterOppDto = { page: 1, limit: 10 };
      const serviceResponse = {
        data: [mockOppServiceResponse],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
        hasPrevious: false,
        hasNext: false,
      };
      oppServiceMock.findAllWithFiltersAndPagination.mockResolvedValue(
        serviceResponse,
      );

      // Act
      const result = await controller.findAll(filters);

      // Assert
      expect(oppServiceMock.findAllWithFiltersAndPagination).toHaveBeenCalledWith(
        filters,
      );
      expect(result).toEqual(mockPaginatedResponse);
    });

    it('should return paginated OPPs with search filter', async () => {
      // Arrange
      const filters: FilterOppDto = {
        page: 1,
        limit: 10,
        search: 'OPP1',
      };
      const serviceResponse = {
        data: [mockOppServiceResponse],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
        hasPrevious: false,
        hasNext: false,
      };
      oppServiceMock.findAllWithFiltersAndPagination.mockResolvedValue(
        serviceResponse,
      );

      // Act
      const result = await controller.findAll(filters);

      // Assert
      expect(oppServiceMock.findAllWithFiltersAndPagination).toHaveBeenCalledWith(
        filters,
      );
      expect(result).toEqual(mockPaginatedResponse);
    });

    it('should return paginated OPPs with carrera filter', async () => {
      // Arrange
      const filters: FilterOppDto = {
        page: 1,
        limit: 10,
        carreraId: 1,
      };
      const serviceResponse = {
        data: [mockOppServiceResponse],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
        hasPrevious: false,
        hasNext: false,
      };
      oppServiceMock.findAllWithFiltersAndPagination.mockResolvedValue(
        serviceResponse,
      );

      // Act
      const result = await controller.findAll(filters);

      // Assert
      expect(oppServiceMock.findAllWithFiltersAndPagination).toHaveBeenCalledWith(
        filters,
      );
      expect(result).toEqual(mockPaginatedResponse);
    });

    it('should handle multiple OPPs in response', async () => {
      // Arrange
      const secondOpp = {
        ...mockOppServiceResponse,
        id: 2,
        codigo: 'OPP2',
        descripcion: 'Segundo Objetivo de Programa',
      };

      const filters: FilterOppDto = { page: 1, limit: 10 };
      const serviceResponse = {
        data: [mockOppServiceResponse, secondOpp],
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
        hasPrevious: false,
        hasNext: false,
      };

      const expectedResponse: OppPaginatedResponseDto = {
        data: [
          mockOppResponse,
          {
            id: 2,
            codigo: 'OPP2',
            descripcion: 'Segundo Objetivo de Programa',
            carreraId: 1,
            createdAt: new Date('2025-10-13T05:05:36.333Z'),
            updatedAt: new Date('2025-10-13T05:05:36.333Z'),
          },
        ],
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
        hasPrevious: false,
        hasNext: false,
      };

      oppServiceMock.findAllWithFiltersAndPagination.mockResolvedValue(
        serviceResponse,
      );

      // Act
      const result = await controller.findAll(filters);

      // Assert
      expect(result).toEqual(expectedResponse);
    });

    it('should handle empty results', async () => {
      // Arrange
      const filters: FilterOppDto = { page: 1, limit: 10 };
      const serviceResponse = {
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
        hasPrevious: false,
        hasNext: false,
      };
      const expectedResponse: OppPaginatedResponseDto = {
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
        hasPrevious: false,
        hasNext: false,
      };

      oppServiceMock.findAllWithFiltersAndPagination.mockResolvedValue(
        serviceResponse,
      );

      // Act
      const result = await controller.findAll(filters);

      // Assert
      expect(result).toEqual(expectedResponse);
    });

    it('should handle pagination metadata correctly', async () => {
      // Arrange
      const filters: FilterOppDto = { page: 2, limit: 5 };
      const serviceResponse = {
        data: [mockOppServiceResponse],
        total: 15,
        page: 2,
        limit: 5,
        totalPages: 3,
        hasPrevious: true,
        hasNext: true,
      };
      const expectedResponse: OppPaginatedResponseDto = {
        data: [mockOppResponse],
        total: 15,
        page: 2,
        limit: 5,
        totalPages: 3,
        hasPrevious: true,
        hasNext: true,
      };

      oppServiceMock.findAllWithFiltersAndPagination.mockResolvedValue(
        serviceResponse,
      );

      // Act
      const result = await controller.findAll(filters);

      // Assert
      expect(result).toEqual(expectedResponse);
    });

    it('should handle service errors in findAll', async () => {
      // Arrange
      const filters: FilterOppDto = { page: 1, limit: 10 };
      const error = new Error('Database connection error');
      oppServiceMock.findAllWithFiltersAndPagination.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.findAll(filters)).rejects.toThrow(
        'Database connection error',
      );
      expect(oppServiceMock.findAllWithFiltersAndPagination).toHaveBeenCalledWith(
        filters,
      );
    });

    it('should properly transform service response to controller response format', async () => {
      // Arrange
      const serviceResponseWithCarrera = {
        data: [
          {
            ...mockOppServiceResponse,
            carrera: {
              id: 1,
              codigo: 'ING-SIS',
              nombre: 'Ingeniería en Sistemas',
            },
          },
        ],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
        hasPrevious: false,
        hasNext: false,
      };

      const filters: FilterOppDto = { page: 1, limit: 10 };
      oppServiceMock.findAllWithFiltersAndPagination.mockResolvedValue(
        serviceResponseWithCarrera,
      );

      // Act
      const result = await controller.findAll(filters);

      // Assert
      // Verificar que la transformación elimina el campo 'carrera' y mantiene solo los campos del DTO
      expect(result.data[0]).toEqual(mockOppResponse);
      expect(result.data[0]).not.toHaveProperty('carrera');
      expect(result.data[0]).toHaveProperty('id');
      expect(result.data[0]).toHaveProperty('codigo');
      expect(result.data[0]).toHaveProperty('descripcion');
      expect(result.data[0]).toHaveProperty('carreraId');
      expect(result.data[0]).toHaveProperty('createdAt');
      expect(result.data[0]).toHaveProperty('updatedAt');
    });
  });
});