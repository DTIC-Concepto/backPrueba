import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/sequelize';
import { RaaService } from '../services/raa.service';
import { RaaModel } from '../models/raa.model';
import { CreateRaaRequestDto } from '../dtos/create-raa-request.dto';
import { CreateRaaResponseDto } from '../dtos/create-raa-response.dto';

describe('RaaService - Registrar Nuevo RAA', () => {
  let service: RaaService;
  let mockRaaModel: any;

  const mockRaaRepository = {
    create: jest.fn(),
    findOne: jest.fn(),
    findByPk: jest.fn(),
    count: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RaaService,
        {
          provide: getModelToken(RaaModel),
          useValue: mockRaaRepository,
        },
      ],
    }).compile();

    service = module.get<RaaService>(RaaService);
    mockRaaModel = module.get(getModelToken(RaaModel));

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('registrarNuevoRaa', () => {
    const createRaaRequestDto: CreateRaaRequestDto = {
      codigo: 'RAA-001',
      nombre: 'Aplicación de principios de programación',
      descripcion: 'El estudiante será capaz de aplicar principios fundamentales de programación orientada a objetos.',
      asignaturaId: 1,
      tipoRaaId: 1,
      nivel: 3,
      estadoActivo: true,
    };

    const mockCreatedRaa = {
      id: 1,
      codigo: 'RAA-001',
      nombre: 'Aplicación de principios de programación',
      descripcion: 'El estudiante será capaz de aplicar principios fundamentales de programación orientada a objetos.',
      asignaturaId: 1,
      tipoRaaId: 1,
      nivel: 3,
      estadoActivo: true,
      creadoEn: new Date(),
      actualizadoEn: new Date(),
    };

    it('debería registrar un nuevo RAA exitosamente', async () => {
      // Arrange
      mockRaaModel.count.mockResolvedValue(0); // No existe código duplicado
      mockRaaModel.create.mockResolvedValue(mockCreatedRaa);

      // Act
      const result = await service.registrarNuevoRaa(createRaaRequestDto);

      // Assert
      expect(result.exitoso).toBe(true);
      expect(result.mensaje).toBe('RAA registrado exitosamente');
      expect(result.raa.codigo).toBe('RAA-001');
      expect(result.detalles?.codigoGenerado).toBe(false);
      expect(mockRaaModel.create).toHaveBeenCalledWith({
        codigo: 'RAA-001',
        nombre: 'Aplicación de principios de programación',
        descripcion: 'El estudiante será capaz de aplicar principios fundamentales de programación orientada a objetos.',
        asignaturaId: 1,
        tipoRaaId: 1,
        nivel: 3,
        estadoActivo: true,
      });
    });

    it('debería generar código automáticamente cuando se solicita', async () => {
      // Arrange
      const requestWithAutoCode: CreateRaaRequestDto = {
        ...createRaaRequestDto,
        codigo: undefined,
        generarCodigoAutomatico: true,
      };
      
      mockRaaModel.findOne.mockResolvedValue(null); // No hay RAAs previos
      mockRaaModel.count.mockResolvedValue(0); // No existe código duplicado
      mockRaaModel.create.mockResolvedValue({
        ...mockCreatedRaa,
        codigo: 'RAA-001-001',
      });

      // Act
      const result = await service.registrarNuevoRaa(requestWithAutoCode);

      // Assert
      expect(result.exitoso).toBe(true);
      expect(result.raa.codigo).toBe('RAA-001-001');
      expect(result.detalles?.codigoGenerado).toBe(true);
    });

    it('debería generar código con prefijo personalizado', async () => {
      // Arrange
      const requestWithCustomPrefix: CreateRaaRequestDto = {
        ...createRaaRequestDto,
        codigo: undefined,
        generarCodigoAutomatico: true,
        prefijoPersonalizado: 'COMP',
      };
      
      mockRaaModel.findOne.mockResolvedValue(null);
      mockRaaModel.count.mockResolvedValue(0);
      mockRaaModel.create.mockResolvedValue({
        ...mockCreatedRaa,
        codigo: 'COMP-001-001',
      });

      // Act
      const result = await service.registrarNuevoRaa(requestWithCustomPrefix);

      // Assert
      expect(result.exitoso).toBe(true);
      expect(result.raa.codigo).toBe('COMP-001-001');
      expect(result.detalles?.codigoGenerado).toBe(true);
    });

    it('debería lanzar ConflictException si el código ya existe', async () => {
      // Arrange
      mockRaaModel.count.mockResolvedValue(1); // Código ya existe

      // Act & Assert
      await expect(service.registrarNuevoRaa(createRaaRequestDto))
        .rejects.toThrow(ConflictException);
      expect(mockRaaModel.create).not.toHaveBeenCalled();
    });

    it('debería manejar errores de validación de Sequelize', async () => {
      // Arrange
      mockRaaModel.count.mockResolvedValue(0);
      const validationError: any = new Error('Validation error');
      validationError.name = 'SequelizeValidationError';
      validationError.errors = [
        { message: 'El nombre no puede estar vacío' },
        { message: 'La descripción es requerida' }
      ];
      mockRaaModel.create.mockRejectedValue(validationError);

      // Act & Assert
      await expect(service.registrarNuevoRaa(createRaaRequestDto))
        .rejects.toThrow(BadRequestException);
    });

    it('debería manejar errores de constraint único', async () => {
      // Arrange
      mockRaaModel.count.mockResolvedValue(0);
      const uniqueError: any = new Error('Unique constraint violation');
      uniqueError.name = 'SequelizeUniqueConstraintError';
      mockRaaModel.create.mockRejectedValue(uniqueError);

      // Act & Assert
      await expect(service.registrarNuevoRaa(createRaaRequestDto))
        .rejects.toThrow(ConflictException);
    });

    it('debería validar ID de asignatura inválido', async () => {
      // Arrange
      const requestWithInvalidAsignatura: CreateRaaRequestDto = {
        ...createRaaRequestDto,
        asignaturaId: 0,
      };

      // Act & Assert
      await expect(service.registrarNuevoRaa(requestWithInvalidAsignatura))
        .rejects.toThrow(BadRequestException);
    });

    it('debería validar ID de tipo RAA inválido', async () => {
      // Arrange
      const requestWithInvalidTipo: CreateRaaRequestDto = {
        ...createRaaRequestDto,
        tipoRaaId: -1,
      };

      // Act & Assert
      await expect(service.registrarNuevoRaa(requestWithInvalidTipo))
        .rejects.toThrow(BadRequestException);
    });

    it('debería usar valores por defecto cuando no se proporcionan', async () => {
      // Arrange
      const requestMinimal: CreateRaaRequestDto = {
        nombre: 'RAA mínimo',
        descripcion: 'Descripción mínima del RAA para testing',
        asignaturaId: 1,
        tipoRaaId: 1,
      };
      
      mockRaaModel.count.mockResolvedValue(0);
      mockRaaModel.findOne.mockResolvedValue(null);
      mockRaaModel.create.mockResolvedValue({
        ...mockCreatedRaa,
        codigo: 'RAA-001-001',
        nombre: 'RAA mínimo',
        nivel: 1,
        estadoActivo: true,
      });

      // Act
      const result = await service.registrarNuevoRaa(requestMinimal);

      // Assert
      expect(result.exitoso).toBe(true);
      expect(mockRaaModel.create).toHaveBeenCalledWith({
        codigo: 'RAA-001-001',
        nombre: 'RAA mínimo',
        descripcion: 'Descripción mínima del RAA para testing',
        asignaturaId: 1,
        tipoRaaId: 1,
        nivel: 1,
        estadoActivo: true,
      });
    });
  });

  describe('generarCodigoAutomatico', () => {
    it('debería resolver conflictos en generación de código', async () => {
      // Arrange
      const mockUltimoRaa = {
        codigo: 'RAA-001-003',
        asignaturaId: 1,
      };
      mockRaaModel.findOne.mockResolvedValue(mockUltimoRaa);
      
      // Mock para simular que el primer código generado ya existe, pero el segundo no
      service.existePorCodigo = jest.fn()
        .mockResolvedValueOnce(true)  // RAA-001-004 ya existe
        .mockResolvedValueOnce(false); // RAA-001-005 no existe

      // Act
      const codigo = await service['generarCodigoAutomatico'](1, 'RAA');

      // Assert
      expect(codigo).toBe('RAA-001-005');
      expect(service.existePorCodigo).toHaveBeenCalledTimes(2);
    });

    it('debería generar código inicial cuando no hay RAAs previos', async () => {
      // Arrange
      mockRaaModel.findOne.mockResolvedValue(null);
      service.existePorCodigo = jest.fn().mockResolvedValue(false);

      // Act
      const codigo = await service['generarCodigoAutomatico'](1, 'RAA');

      // Assert
      expect(codigo).toBe('RAA-001-001');
    });

    it('debería manejar códigos que no siguen el patrón estándar', async () => {
      // Arrange
      const mockUltimoRaa = {
        codigo: 'CUSTOM-CODE-ABC',
        asignaturaId: 1,
      };
      mockRaaModel.findOne.mockResolvedValue(mockUltimoRaa);
      mockRaaModel.count.mockResolvedValue(5); // 5 RAAs existentes cuando no sigue el patrón
      
      // Mock del servicio existePorCodigo (que también usa count internamente)
      service.existePorCodigo = jest.fn().mockResolvedValue(false);

      // Act
      const codigo = await service['generarCodigoAutomatico'](1, 'RAA');

      // Assert
      expect(codigo).toBe('RAA-001-006'); // 5 existentes + 1
    });
  });

  describe('validaciones de entidades relacionadas', () => {
    it('debería validar asignatura existente', async () => {
      // Act & Assert
      await expect(service['validarAsignaturaExiste'](0))
        .rejects.toThrow(BadRequestException);
      
      await expect(service['validarAsignaturaExiste'](-1))
        .rejects.toThrow(BadRequestException);
    });

    it('debería validar tipo RAA existente', async () => {
      // Act & Assert
      await expect(service['validarTipoRaaExiste'](0))
        .rejects.toThrow(BadRequestException);
      
      await expect(service['validarTipoRaaExiste'](-1))
        .rejects.toThrow(BadRequestException);
    });

    it('debería pasar validación con IDs válidos', async () => {
      // Act & Assert
      await expect(service['validarAsignaturaExiste'](1))
        .resolves.not.toThrow();
      
      await expect(service['validarTipoRaaExiste'](1))
        .resolves.not.toThrow();
    });
  });
});
