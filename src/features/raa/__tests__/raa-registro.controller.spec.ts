import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';
import { RaaController } from '../controllers/raa.controller';
import { RaaService } from '../services/raa.service';
import { CreateRaaRequestDto } from '../dtos/create-raa-request.dto';
import { CreateRaaResponseDto } from '../dtos/create-raa-response.dto';

describe('RaaController - Registrar Nuevo RAA', () => {
  let controller: RaaController;
  let service: jest.Mocked<RaaService>;

  const mockRaaService = {
    registrarNuevoRaa: jest.fn(),
    buscarPorId: jest.fn(),
    crear: jest.fn(),
    actualizar: jest.fn(),
    actualizarDetallado: jest.fn(),
    eliminarRaa: jest.fn(),
    listar: jest.fn(),
    existePorCodigo: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RaaController],
      providers: [
        {
          provide: RaaService,
          useValue: mockRaaService,
        },
      ],
    }).compile();

    controller = module.get<RaaController>(RaaController);
    service = module.get(RaaService);

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('registrarNuevoRaa', () => {
    const createRaaRequestDto: CreateRaaRequestDto = {
      codigo: 'RAA-001',
      nombre: 'Aplicación de principios de programación',
      descripcion: 'El estudiante será capaz de aplicar principios fundamentales de programación orientada a objetos para resolver problemas computacionales de mediana complejidad.',
      asignaturaId: 1,
      tipoRaaId: 1,
      nivel: 3,
      estadoActivo: true,
    };

    const mockSuccessResponse: CreateRaaResponseDto = {
      exitoso: true,
      mensaje: 'RAA registrado exitosamente',
      raa: {
        id: 1,
        codigo: 'RAA-001',
        descripcion: 'El estudiante será capaz de aplicar principios fundamentales de programación orientada a objetos para resolver problemas computacionales de mediana complejidad.',
        asignaturaId: 1,
        tipoRaaId: 1,
        estadoActivo: true,
        creadoEn: new Date(),
        actualizadoEn: new Date(),
      },
      detalles: {
        codigoGenerado: false,
        relacionesCreadas: ['asignatura', 'tipoRaa'],
      },
    };

    it('debería registrar un nuevo RAA exitosamente', async () => {
      // Arrange
      service.registrarNuevoRaa.mockResolvedValue(mockSuccessResponse);

      // Act
      const result = await controller.registrarNuevoRaa(createRaaRequestDto);

      // Assert
      expect(service.registrarNuevoRaa).toHaveBeenCalledWith(createRaaRequestDto);
      expect(result).toEqual(mockSuccessResponse);
      expect(result.exitoso).toBe(true);
      expect(result.raa.codigo).toBe('RAA-001');
    });

    it('debería registrar RAA con código generado automáticamente', async () => {
      // Arrange
      const requestAutoCode: CreateRaaRequestDto = {
        ...createRaaRequestDto,
        codigo: undefined,
        generarCodigoAutomatico: true,
      };

      const responseAutoCode: CreateRaaResponseDto = {
        ...mockSuccessResponse,
        raa: {
          ...mockSuccessResponse.raa,
          codigo: 'RAA-001-001',
        },
        detalles: {
          codigoGenerado: true,
          relacionesCreadas: ['asignatura', 'tipoRaa'],
        },
      };

      service.registrarNuevoRaa.mockResolvedValue(responseAutoCode);

      // Act
      const result = await controller.registrarNuevoRaa(requestAutoCode);

      // Assert
      expect(service.registrarNuevoRaa).toHaveBeenCalledWith(requestAutoCode);
      expect(result.raa.codigo).toBe('RAA-001-001');
      expect(result.detalles?.codigoGenerado).toBe(true);
    });

    it('debería registrar RAA con prefijo personalizado', async () => {
      // Arrange
      const requestCustomPrefix: CreateRaaRequestDto = {
        ...createRaaRequestDto,
        codigo: undefined,
        generarCodigoAutomatico: true,
        prefijoPersonalizado: 'COMP',
      };

      const responseCustomPrefix: CreateRaaResponseDto = {
        ...mockSuccessResponse,
        raa: {
          ...mockSuccessResponse.raa,
          codigo: 'COMP-001-001',
        },
        detalles: {
          codigoGenerado: true,
          relacionesCreadas: ['asignatura', 'tipoRaa'],
        },
      };

      service.registrarNuevoRaa.mockResolvedValue(responseCustomPrefix);

      // Act
      const result = await controller.registrarNuevoRaa(requestCustomPrefix);

      // Assert
      expect(result.raa.codigo).toBe('COMP-001-001');
      expect(result.detalles?.codigoGenerado).toBe(true);
    });

    it('debería manejar valores por defecto correctamente', async () => {
      // Arrange
      const requestMinimal: CreateRaaRequestDto = {
        nombre: 'RAA básico',
        descripcion: 'Descripción básica del RAA para testing de valores por defecto.',
        asignaturaId: 1,
        tipoRaaId: 1,
      };

      const responseMinimal: CreateRaaResponseDto = {
        ...mockSuccessResponse,
        raa: {
          ...mockSuccessResponse.raa,
          codigo: 'RAA-001-001',
        },
        detalles: {
          codigoGenerado: true,
          relacionesCreadas: ['asignatura', 'tipoRaa'],
        },
      };

      service.registrarNuevoRaa.mockResolvedValue(responseMinimal);

      // Act
      const result = await controller.registrarNuevoRaa(requestMinimal);

      // Assert
      expect(service.registrarNuevoRaa).toHaveBeenCalledWith(requestMinimal);
      expect(result.exitoso).toBe(true);
      expect(result.detalles?.codigoGenerado).toBe(true);
    });

    it('debería lanzar BadRequestException para datos inválidos', async () => {
      // Arrange
      service.registrarNuevoRaa.mockRejectedValue(
        new BadRequestException('Errores de validación: El nombre no puede estar vacío')
      );

      // Act & Assert
      await expect(controller.registrarNuevoRaa(createRaaRequestDto))
        .rejects.toThrow(BadRequestException);
      expect(service.registrarNuevoRaa).toHaveBeenCalledWith(createRaaRequestDto);
    });

    it('debería lanzar ConflictException para código duplicado', async () => {
      // Arrange
      service.registrarNuevoRaa.mockRejectedValue(
        new ConflictException('Ya existe un RAA con el código RAA-001')
      );

      // Act & Assert
      await expect(controller.registrarNuevoRaa(createRaaRequestDto))
        .rejects.toThrow(ConflictException);
    });

    it('debería lanzar NotFoundException para asignatura no encontrada', async () => {
      // Arrange
      service.registrarNuevoRaa.mockRejectedValue(
        new NotFoundException('Asignatura con ID 999 no encontrada')
      );

      // Act & Assert
      await expect(controller.registrarNuevoRaa({
        ...createRaaRequestDto,
        asignaturaId: 999,
      })).rejects.toThrow(NotFoundException);
    });

    it('debería lanzar NotFoundException para tipo RAA no encontrado', async () => {
      // Arrange
      service.registrarNuevoRaa.mockRejectedValue(
        new NotFoundException('Tipo RAA con ID 999 no encontrado')
      );

      // Act & Assert
      await expect(controller.registrarNuevoRaa({
        ...createRaaRequestDto,
        tipoRaaId: 999,
      })).rejects.toThrow(NotFoundException);
    });

    it('debería validar campos requeridos', async () => {
      // Arrange
      const requestIncompleto = {
        codigo: 'RAA-001',
        // falta nombre
        descripcion: 'Descripción del RAA',
        asignaturaId: 1,
        tipoRaaId: 1,
      } as CreateRaaRequestDto;

      service.registrarNuevoRaa.mockRejectedValue(
        new BadRequestException('El nombre del RAA es obligatorio')
      );

      // Act & Assert
      await expect(controller.registrarNuevoRaa(requestIncompleto))
        .rejects.toThrow(BadRequestException);
    });

    it('debería validar longitudes de campos', async () => {
      // Arrange
      const requestConCamposLargos: CreateRaaRequestDto = {
        ...createRaaRequestDto,
        nombre: 'A'.repeat(201), // Excede el límite de 200 caracteres
      };

      service.registrarNuevoRaa.mockRejectedValue(
        new BadRequestException('El nombre no puede tener más de 200 caracteres')
      );

      // Act & Assert
      await expect(controller.registrarNuevoRaa(requestConCamposLargos))
        .rejects.toThrow(BadRequestException);
    });

    it('debería validar formato del código personalizado', async () => {
      // Arrange
      const requestCodigoInvalido: CreateRaaRequestDto = {
        ...createRaaRequestDto,
        codigo: 'raa-001', // Letras minúsculas no permitidas
      };

      service.registrarNuevoRaa.mockRejectedValue(
        new BadRequestException('El código solo puede contener letras mayúsculas, números, guiones y guiones bajos')
      );

      // Act & Assert
      await expect(controller.registrarNuevoRaa(requestCodigoInvalido))
        .rejects.toThrow(BadRequestException);
    });

    it('debería validar rango del nivel', async () => {
      // Arrange
      const requestNivelInvalido: CreateRaaRequestDto = {
        ...createRaaRequestDto,
        nivel: 6, // Excede el rango 1-5
      };

      service.registrarNuevoRaa.mockRejectedValue(
        new BadRequestException('El nivel debe estar entre 1 y 5')
      );

      // Act & Assert
      await expect(controller.registrarNuevoRaa(requestNivelInvalido))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('Integración con otros endpoints', () => {
    it('debería mantener compatibilidad con endpoint básico de creación', async () => {
      // Arrange
      const createBasicoDto = {
        codigo: 'RAA-BASICO',
        descripcion: 'RAA creado con endpoint básico',
        asignaturaId: 1,
        tipoRaaId: 1,
      };

      const mockRaaBasico = {
        id: 2,
        codigo: 'RAA-BASICO',
        descripcion: 'RAA creado con endpoint básico',
        asignaturaId: 1,
        tipoRaaId: 1,
        estadoActivo: true,
      } as any;

      service.crear.mockResolvedValue(mockRaaBasico);

      // Act
      const result = await controller.crear(createBasicoDto);

      // Assert
      expect(service.crear).toHaveBeenCalledWith(createBasicoDto);
      expect(result.codigo).toBe('RAA-BASICO');
    });

    it('debería diferenciarse del endpoint básico en la respuesta', async () => {
      // Arrange
      const requestAvanzado: CreateRaaRequestDto = {
        nombre: 'RAA avanzado',
        descripcion: 'RAA creado con endpoint avanzado',
        asignaturaId: 1,
        tipoRaaId: 1,
      };

      const responseAvanzado: CreateRaaResponseDto = {
        exitoso: true,
        mensaje: 'RAA registrado exitosamente',
        raa: {
          id: 3,
          codigo: 'RAA-001-001',
          descripcion: 'RAA creado con endpoint avanzado',
          asignaturaId: 1,
          tipoRaaId: 1,
          estadoActivo: true,
          creadoEn: new Date(),
          actualizadoEn: new Date(),
        },
        detalles: {
          codigoGenerado: true,
          relacionesCreadas: ['asignatura', 'tipoRaa'],
        },
      };

      service.registrarNuevoRaa.mockResolvedValue(responseAvanzado);

      // Act
      const result = await controller.registrarNuevoRaa(requestAvanzado);

      // Assert
      expect(result).toHaveProperty('exitoso');
      expect(result).toHaveProperty('mensaje');
      expect(result).toHaveProperty('detalles');
      expect(result.detalles?.codigoGenerado).toBeDefined();
    });
  });
});
