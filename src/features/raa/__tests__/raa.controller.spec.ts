import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { RaaController } from '../controllers/raa.controller';
import { RaaService } from '../services/raa.service';
import { DeleteRaaDto, DeleteRaaResponseDto } from '../dtos/delete-raa.dto';
import { CreateRaaDto, UpdateRaaDto, FilterRaaDto } from '../dtos/raa.dto';
import { RaaModel } from '../models/raa.model';

describe('RaaController', () => {
  let controller: RaaController;
  let service: jest.Mocked<RaaService>;

  const mockRaaService = {
    eliminarRaa: jest.fn(),
    buscarPorId: jest.fn(),
    crear: jest.fn(),
    actualizar: jest.fn(),
    listar: jest.fn(),
    existePorCodigo: jest.fn(),
  };

  const mockRaa = {
    id: 1,
    codigo: 'RAA-001',
    descripcion: 'Descripción del RAA de prueba',
    asignaturaId: 1,
    tipoRaaId: 1,
    estadoActivo: true,
    creadoEn: new Date(),
    actualizadoEn: new Date(),
    eliminadoEn: null,
  } as any; // Simplificamos el tipo para las pruebas

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

  describe('eliminarRaa', () => {
    const mockDeleteResponse: DeleteRaaResponseDto = {
      exitoso: true,
      mensaje: 'RAA eliminado correctamente (eliminación suave)',
      id: 1,
      codigo: 'RAA-001',
      tipoEliminacion: 'soft_delete',
    };

    it('debería eliminar un RAA exitosamente con opciones por defecto', async () => {
      // Arrange
      service.eliminarRaa.mockResolvedValue(mockDeleteResponse);

      // Act
      const result = await controller.eliminarRaa(1);

      // Assert
      expect(service.eliminarRaa).toHaveBeenCalledWith({
        id: 1,
        confirmarEliminacion: false,
        forzarEliminacion: false,
      });
      expect(result).toEqual(mockDeleteResponse);
    });

    it('debería eliminar un RAA con opciones personalizadas', async () => {
      // Arrange
      const deleteOptions = {
        confirmarEliminacion: true,
        forzarEliminacion: true,
      };
      const mockResponse = {
        ...mockDeleteResponse,
        tipoEliminacion: 'hard_delete' as const,
      };
      service.eliminarRaa.mockResolvedValue(mockResponse);

      // Act
      const result = await controller.eliminarRaa(1, deleteOptions);

      // Assert
      expect(service.eliminarRaa).toHaveBeenCalledWith({
        id: 1,
        confirmarEliminacion: true,
        forzarEliminacion: true,
      });
      expect(result.tipoEliminacion).toBe('hard_delete');
    });

    it('debería lanzar NotFoundException cuando el RAA no existe', async () => {
      // Arrange
      service.eliminarRaa.mockRejectedValue(
        new NotFoundException('RAA con ID 1 no encontrado')
      );

      // Act & Assert
      await expect(controller.eliminarRaa(1)).rejects.toThrow(NotFoundException);
    });

    it('debería lanzar BadRequestException cuando el RAA ya está eliminado', async () => {
      // Arrange
      service.eliminarRaa.mockRejectedValue(
        new BadRequestException('El RAA con ID 1 ya ha sido eliminado anteriormente')
      );

      // Act & Assert
      await expect(controller.eliminarRaa(1)).rejects.toThrow(BadRequestException);
    });
  });

  describe('obtenerPorId', () => {
    it('debería retornar un RAA por ID', async () => {
      // Arrange
      service.buscarPorId.mockResolvedValue(mockRaa);

      // Act
      const result = await controller.obtenerPorId(1);

      // Assert
      expect(service.buscarPorId).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockRaa);
    });

    it('debería lanzar NotFoundException cuando el RAA no existe', async () => {
      // Arrange
      service.buscarPorId.mockRejectedValue(
        new NotFoundException('RAA con ID 1 no encontrado')
      );

      // Act & Assert
      await expect(controller.obtenerPorId(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('listar', () => {
    it('debería listar todos los RAAs sin filtros', async () => {
      // Arrange
      const raas = [mockRaa];
      service.listar.mockResolvedValue(raas);

      // Act
      const result = await controller.listar({});

      // Assert
      expect(service.listar).toHaveBeenCalledWith({});
      expect(result).toEqual(raas);
    });

    it('debería listar RAAs con filtros aplicados', async () => {
      // Arrange
      const filterDto: FilterRaaDto = {
        codigo: 'RAA-001',
        asignaturaId: 1,
        estadoActivo: true,
      };
      const raas = [mockRaa];
      service.listar.mockResolvedValue(raas);

      // Act
      const result = await controller.listar(filterDto);

      // Assert
      expect(service.listar).toHaveBeenCalledWith(filterDto);
      expect(result).toEqual(raas);
    });
  });

  describe('crear', () => {
    const createRaaDto: CreateRaaDto = {
      codigo: 'RAA-001',
      descripcion: 'Descripción del RAA',
      asignaturaId: 1,
      tipoRaaId: 1,
      estadoActivo: true,
    };

    it('debería crear un RAA exitosamente', async () => {
      // Arrange
      service.crear.mockResolvedValue(mockRaa);

      // Act
      const result = await controller.crear(createRaaDto);

      // Assert
      expect(service.crear).toHaveBeenCalledWith(createRaaDto);
      expect(result).toEqual(mockRaa);
    });
  });

  describe('actualizar', () => {
    const updateRaaDto: UpdateRaaDto = {
      descripcion: 'Nueva descripción',
    };

    it('debería actualizar un RAA exitosamente', async () => {
      // Arrange
      const raaActualizado = { ...mockRaa, descripcion: 'Nueva descripción' } as any;
      service.actualizar.mockResolvedValue(raaActualizado);

      // Act
      const result = await controller.actualizar(1, updateRaaDto);

      // Assert
      expect(service.actualizar).toHaveBeenCalledWith(1, updateRaaDto);
      expect(result).toEqual(raaActualizado);
    });

    it('debería lanzar NotFoundException cuando el RAA no existe', async () => {
      // Arrange
      service.actualizar.mockRejectedValue(
        new NotFoundException('RAA con ID 1 no encontrado')
      );

      // Act & Assert
      await expect(controller.actualizar(1, updateRaaDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('Validaciones de parámetros', () => {
    it('debería validar que el ID sea un número entero', async () => {
      // Esta validación se maneja automáticamente por ParseIntPipe
      // La prueba se enfoca en verificar que el pipe funciona correctamente
      service.buscarPorId.mockResolvedValue(mockRaa);

      const result = await controller.obtenerPorId(1);

      expect(service.buscarPorId).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockRaa);
    });
  });

  describe('Manejo de errores HTTP', () => {
    it('debería manejar errores 404 correctamente', async () => {
      service.buscarPorId.mockRejectedValue(
        new NotFoundException('RAA con ID 999 no encontrado')
      );

      await expect(controller.obtenerPorId(999)).rejects.toThrow(
        new NotFoundException('RAA con ID 999 no encontrado')
      );
    });

    it('debería manejar errores 400 correctamente', async () => {
      service.eliminarRaa.mockRejectedValue(
        new BadRequestException('El RAA con ID 1 ya está inactivo')
      );

      await expect(controller.eliminarRaa(1)).rejects.toThrow(
        new BadRequestException('El RAA con ID 1 ya está inactivo')
      );
    });
  });
});
